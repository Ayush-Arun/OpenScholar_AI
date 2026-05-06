// ============================================
// WEB SEARCH SERVICE
// Fetches papers from arXiv when local digest
// has insufficient papers for a query.
// Includes in-memory TTL cache + relevance reranking.
// ============================================

const axios = require("axios");
const xml2js = require("xml2js");

const ARXIV_BASE = "http://export.arxiv.org/api/query";

// ── In-memory cache: key=normalizedQuery, value={ papers, ts } ─────────────
const queryCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached(query) {
  const norm = query.toLowerCase().trim();
  const entry = queryCache.get(norm);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    queryCache.delete(norm);
    return null;
  }
  console.log(`[WebSearch] Cache hit for "${norm}"`);
  return entry.papers;
}

function setCache(query, papers) {
  const norm = query.toLowerCase().trim();
  queryCache.set(norm, { papers, ts: Date.now() });
}

// ── Domain → arXiv category map ───────────────────────────────────────────────
const DOMAIN_CATEGORIES = {
  // Medical / health
  medical:     ["cs.CV", "cs.LG", "cs.AI", "eess.IV"],
  health:      ["cs.CV", "cs.LG", "cs.AI", "eess.IV"],
  clinical:    ["cs.CV", "cs.LG", "cs.AI", "eess.IV"],
  diagnosis:   ["cs.CV", "cs.LG", "cs.AI", "eess.IV"],
  radiology:   ["cs.CV", "eess.IV"],
  pathology:   ["cs.CV", "eess.IV"],
  drug:        ["cs.LG", "q-bio.QM"],
  genomic:     ["cs.LG", "q-bio.GN"],
  // Vision / image
  image:       ["cs.CV", "cs.LG"],
  vision:      ["cs.CV", "cs.LG"],
  multimodal:  ["cs.CV", "cs.CL", "cs.LG", "cs.AI"],
  visual:      ["cs.CV", "cs.LG"],
  detection:   ["cs.CV", "cs.LG"],
  segmentation:["cs.CV"],
  // NLP / language
  language:    ["cs.CL", "cs.AI"],
  nlp:         ["cs.CL"],
  text:        ["cs.CL", "cs.AI"],
  transformer: ["cs.CL", "cs.LG", "cs.AI"],
  llm:         ["cs.CL", "cs.AI"],
  // RL / robotics
  robot:       ["cs.RO", "cs.AI", "cs.LG"],
  reinforcement:["cs.LG", "cs.AI"],
  // General AI/ML
  generative:  ["cs.LG", "cs.CV", "cs.AI"],
  diffusion:   ["cs.LG", "cs.CV"],
  autonomous:  ["cs.RO", "cs.CV", "cs.AI"],
  // Agriculture
  plant:       ["cs.CV", "cs.LG"],
  crop:        ["cs.CV", "cs.LG"],
  agriculture: ["cs.CV", "cs.LG"],
  // Education (want to AVOID this being the only category)
  // Smart city / traffic
  traffic:     ["cs.CV", "cs.LG", "cs.AI"],
  vehicle:     ["cs.CV", "cs.LG"],
};

// ── Filler words to strip before query building ───────────────────────────────
const FILLER_WORDS = new Set([
  "a","an","the","in","of","on","for","with","about","and","or","is","are",
  "was","were","to","from","that","this","it","be","by","at","as","how",
  "what","why","when","does","do","can","will","would","could","should",
  "tell","me","explain","show","give","list","find","papers","research",
  "latest","recent","new","using","use","based","deep","learning","neural",
  "network","using","approach","method","model","models","system","study"
]);

// ── Build stricter cascading arXiv query ──────────────────────────────────────
//
// Strategy for "multimodal medical diagnosis":
//   keywords = ["multimodal", "medical", "diagnosis"]
//
//   Tier 1 (full phrase):  ti+abs:"multimodal medical diagnosis"
//   Tier 2 (sub-phrases):  ti+abs:"multimodal medical" OR ti+abs:"medical diagnosis"
//   Tier 3 (individual):   all:multimodal AND all:medical AND all:diagnosis
//
//   Category filter (if any domain word matched): cat:cs.CV OR cat:cs.LG ...
//
// This returns a single combined query using arXiv boolean operators.
function buildArxivQuery(userQuery) {
  // 1. Tokenise
  const keywords = userQuery
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !FILLER_WORDS.has(w));

  if (keywords.length === 0) return `all:${userQuery}`;

  const parts = [];

  // 2. Tier 1 — full phrase (most specific)
  if (keywords.length >= 2) {
    parts.push(`ti_abs:"${keywords.join(" ")}"`);
  }

  // 3. Tier 2 — sliding window 2-gram and 3-gram sub-phrases
  if (keywords.length >= 2) {
    for (let i = 0; i < keywords.length - 1; i++) {
      parts.push(`ti_abs:"${keywords[i]} ${keywords[i + 1]}"`);
    }
  }
  if (keywords.length >= 3) {
    for (let i = 0; i < keywords.length - 2; i++) {
      parts.push(`ti_abs:"${keywords[i]} ${keywords[i + 1]} ${keywords[i + 2]}"`);
    }
  }

  // 4. Tier 3 — individual key terms ANDed together (tighter than OR)
  if (keywords.length >= 2) {
    const andClause = keywords.map(k => `all:${k}`).join(" AND ");
    parts.push(`(${andClause})`);
  }

  // 5. De-duplicate, join with OR
  const seen = new Set();
  const uniqueParts = parts.filter(p => {
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });
  let searchQuery = uniqueParts.join(" OR ");

  // 6. Inject category filter for known domains
  const matchedCats = new Set();
  for (const kw of keywords) {
    const cats = DOMAIN_CATEGORIES[kw];
    if (cats) cats.forEach(c => matchedCats.add(c));
  }
  if (matchedCats.size > 0 && matchedCats.size <= 6) {
    const catFilter = [...matchedCats].map(c => `cat:${c}`).join(" OR ");
    searchQuery = `(${searchQuery}) AND (${catFilter})`;
  }

  return searchQuery;
}

// ── Relevance reranker ────────────────────────────────────────────────────────
// Scores each paper against the important query keywords.
// Checks title (weight 3×) + abstract (weight 1×).
// Returns sorted array with score attached; filters out score < threshold.
function rerankPapers(papers, userQuery, minScore = 1) {
  // Extract important keywords (no fillers, no stop words)
  const queryWords = userQuery
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !FILLER_WORDS.has(w));

  if (queryWords.length === 0) return papers;

  const scored = papers.map(paper => {
    const titleWords = (paper.title || "").toLowerCase().split(/\W+/);
    const abstractWords = (paper.abstract || "").toLowerCase().split(/\W+/);

    let score = 0;
    for (const qw of queryWords) {
      // Title match is worth 3 points; abstract match 1 point
      if (titleWords.includes(qw)) score += 3;
      if (abstractWords.includes(qw)) score += 1;
    }
    // Bonus: full phrase appears in title
    const fullPhrase = queryWords.join(" ");
    if ((paper.title || "").toLowerCase().includes(fullPhrase)) score += 5;
    if ((paper.abstract || "").toLowerCase().includes(fullPhrase)) score += 2;

    return { ...paper, _relevanceScore: score };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b._relevanceScore - a._relevanceScore);

  // Filter out papers below minimum score (removes clearly unrelated ones)
  const filtered = scored.filter(p => p._relevanceScore >= minScore);

  // Log what was filtered
  const dropped = scored.length - filtered.length;
  if (dropped > 0) {
    console.log(`[WebSearch] Reranker dropped ${dropped} low-relevance papers (score < ${minScore})`);
  }

  // Strip the internal score field before returning
  return filtered.map(({ _relevanceScore, ...paper }) => paper);
}

// ── Fetch papers from arXiv by natural-language query ────────────────────────
async function fetchPapersFromQuery(userQuery, maxResults = 15) {
  // Check cache first
  const cached = getCached(userQuery);
  if (cached) return { papers: cached, fromCache: true };

  const searchQuery = buildArxivQuery(userQuery);
  console.log(`[WebSearch] arXiv query: ${searchQuery}`);

  try {
    // Fetch more than needed so reranker has enough candidates to filter
    const fetchCount = Math.max(maxResults * 2, 30);
    const params = {
      search_query: searchQuery,
      start: 0,
      max_results: fetchCount,
      sortBy: "relevance",
      sortOrder: "descending"
    };

    let response;
    try {
      response = await axios.get(ARXIV_BASE, { params, timeout: 25000 });
    } catch (err) {
      if (err.response?.status === 429) {
        console.log("[WebSearch] ArXiv rate limit, retrying in 8s...");
        await new Promise(r => setTimeout(r, 8000));
        response = await axios.get(ARXIV_BASE, { params, timeout: 25000 });
      } else {
        throw err;
      }
    }

    const parsed = await xml2js.parseStringPromise(response.data);
    const entries = parsed.feed?.entry || [];

    const raw = entries.map(entry => ({
      title:       entry.title?.[0]?.replace(/\s+/g, " ").trim() || "",
      authors:     (entry.author || []).map(a => a.name?.[0]).filter(Boolean),
      abstract:    entry.summary?.[0]?.replace(/\s+/g, " ").trim() || "",
      published:   entry.published?.[0] || "",
      arxivUrl:    entry.id?.[0] || "",
      pdfUrl:      (entry.id?.[0] || "").replace("/abs/", "/pdf/") + ".pdf",
      categories:  (entry.category || []).map(c => c.$.term),
      source:      "arxiv_web"
    }));

    console.log(`[WebSearch] Raw fetch: ${raw.length} papers for "${userQuery}"`);

    // Rerank and filter: require at least 1 keyword match
    const reranked = rerankPapers(raw, userQuery, 1);
    const papers = reranked.slice(0, maxResults);

    console.log(`[WebSearch] After reranking: ${papers.length} relevant papers returned`);

    setCache(userQuery, papers);
    return { papers, fromCache: false };

  } catch (err) {
    console.error("[WebSearch] ArXiv fetch error:", err.message);
    throw new Error("Could not fetch papers from web. Try again.");
  }
}

const { generateAIResponse } = require("./aiRouter");

/**
 * RAG answer generation using web-fetched papers
 */
async function generateRAGAnswerFromWeb(question, papers) {
  const topPapers = papers.slice(0, 6);
  const contextText = topPapers.map((p, i) => `
[Paper ${i + 1}]
Title: ${p.title}
Authors: ${p.authors?.slice(0, 3).join(", ")}
Abstract: ${p.abstract?.slice(0, 400)}
Link: ${p.arxivUrl}
`).join("\n");

  const prompt = `You are a research assistant. Answer the user question using the provided paper context fetched live from arXiv.

Question: ${question}

Paper context:
${contextText}

Return your answer in this structure (Markdown):
### 1. Direct answer
(your answer here)

### 2. Important details
(details here)

### 3. Related papers
(list papers you used)

### 4. Suggested next step
(what the user should explore next)

If context is insufficient, say so honestly.`;

  try {
    const answer = await generateAIResponse(prompt, { system: "You are a helpful AI research assistant." });
    return answer || "I could not generate an answer.";
  } catch (err) {
    console.error("[WebSearch] RAG generation failed:", err.message);
    return "I could not generate an answer.";
  }
}

// ── Keyword similarity (for local RAG scoring) ────────────────────────────────
function calculateSimilarity(query, text) {
  if (!text) return 0;
  const qWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const tWords = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  let score = 0;
  for (const qw of qWords) {
    if (tWords.includes(qw)) score++;
  }
  return score;
}

module.exports = {
  fetchPapersFromQuery,
  generateRAGAnswerFromWeb,
  calculateSimilarity,
  buildArxivQuery,
  rerankPapers,
  getCached,
  queryCache
};

