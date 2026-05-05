// ============================================
// IMAGE RESEARCH SERVICE - Snap2Research
// Analyzes an image with OpenAI Vision, then
// fetches related AI/GenAI papers from arXiv.
// ============================================

const OpenAI = require("openai");
const axios = require("axios");
const xml2js = require("xml2js");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ARXIV_BASE = "http://export.arxiv.org/api/query";

// ── Step 1: Analyze image with OpenAI Vision ─────────────────────────────────

async function analyzeImageWithVision(base64Image, mimeType = "image/jpeg") {
  const systemPrompt = `You are an AI research analyst.
Analyze this image and extract research-searchable topics.
Return JSON only:
{
  "isResearchRelevant": true,
  "relevanceScore": 85,
  "detectedObjects": [],
  "mainProblem": "",
  "researchKeywords": [],
  "possibleDomains": [],
  "bestSearchQueries": [],
  "projectIdeas": []
}
Rules:
- isResearchRelevant: true only if the image shows a real-world scene, object, problem, or system that maps to AI/ML/computer science research.
- relevanceScore: 0-100. Set < 30 for abstract art, selfies, memes, blank pages, or random photos with no research context.
- Focus on topics useful for AI/ML/GenAI research papers.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: systemPrompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 1200
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Step 2: Search arXiv with extracted queries ───────────────────────────────

async function searchArxivForQueries(queries = [], maxResultsTotal = 10) {
  const allPapers = [];
  const seen = new Set();

  // Use up to 3 best queries to avoid rate-limiting
  const topQueries = queries.slice(0, 3);

  for (const query of topQueries) {
    try {
      const params = {
        search_query: `all:${query}`,
        start: 0,
        max_results: Math.ceil(maxResultsTotal / topQueries.length) + 2,
        sortBy: "relevance",
        sortOrder: "descending"
      };

      let response;
      try {
        response = await axios.get(ARXIV_BASE, { params, timeout: 25000 });
      } catch (err) {
        if (err.response?.status === 429) {
          console.log("[Snap2Research] ArXiv rate limit, retrying in 10s...");
          await new Promise(r => setTimeout(r, 10000));
          response = await axios.get(ARXIV_BASE, { params, timeout: 25000 });
        } else {
          throw err;
        }
      }

      const parsed = await xml2js.parseStringPromise(response.data);
      const entries = parsed.feed?.entry || [];

      for (const entry of entries) {
        const id = entry.id?.[0] || "";
        if (seen.has(id)) continue;
        seen.add(id);

        allPapers.push({
          title: entry.title?.[0]?.replace(/\s+/g, " ").trim() || "",
          authors: (entry.author || []).map(a => a.name?.[0]).filter(Boolean),
          abstract: entry.summary?.[0]?.replace(/\s+/g, " ").trim() || "",
          publishedDate: entry.published?.[0] || "",
          arxivUrl: entry.id?.[0] || "",
          pdfUrl: (entry.id?.[0] || "").replace("/abs/", "/pdf/") + ".pdf",
          categories: (entry.category || []).map(c => c.$.term)
        });
      }

      // Small delay between queries to be kind to arXiv
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.warn(`[Snap2Research] ArXiv query failed for "${query}":`, err.message);
    }
  }

  return allPapers.slice(0, maxResultsTotal);
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

async function analyzeImageAndFetchPapers(base64Image, mimeType) {
  console.log("[Snap2Research] Analyzing image with OpenAI Vision...");
  const imageAnalysis = await analyzeImageWithVision(base64Image, mimeType);

  const {
    isResearchRelevant = true,
    relevanceScore = 50,
    detectedObjects = [],
    mainProblem = "",
    researchKeywords = [],
    possibleDomains = [],
    bestSearchQueries = [],
    projectIdeas = []
  } = imageAnalysis;

  // ── Safety gate ───────────────────────────────────────────────────────────
  if (isResearchRelevant === false || relevanceScore < 30) {
    const err = new Error(
      "I could not detect a strong research direction from this image. " +
      "Try uploading a clearer object, scene, or real-world problem."
    );
    err.code = "NO_RESEARCH_SIGNAL";
    throw err;
  }

  // Fallback signal check
  const hasSignal = researchKeywords.length >= 1 || bestSearchQueries.length >= 1 || mainProblem.length > 10;
  if (!hasSignal) {
    const err = new Error(
      "I could not detect a strong research direction from this image. " +
      "Try uploading a clearer object, scene, or real-world problem."
    );
    err.code = "NO_RESEARCH_SIGNAL";
    throw err;
  }

  console.log("[Snap2Research] Relevance:", relevanceScore, "| Keywords:", researchKeywords.slice(0, 4).join(", "));

  // 2. Fallback: if AI didn't produce search queries, build them from keywords
  const queriesToUse = bestSearchQueries.length > 0
    ? bestSearchQueries
    : researchKeywords.map(k => `"${k}" AI`).slice(0, 3);

  // 3. Fetch papers from arXiv
  console.log("[Snap2Research] Fetching papers from arXiv...");
  const papers = await searchArxivForQueries(queriesToUse, 10);

  console.log(`[Snap2Research] Returned ${papers.length} papers.`);

  return {
    imageAnalysis: {
      detectedObjects,
      mainProblem,
      researchKeywords,
      possibleDomains,
      bestSearchQueries,
      projectIdeas,
      relevanceScore
    },
    papers
  };
}

module.exports = { analyzeImageAndFetchPapers };
