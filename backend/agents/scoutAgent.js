// ============================================
// SCOUT AGENT
// Discovers latest GenAI papers from ArXiv
// and trending repos from GitHub
// ============================================

const axios = require("axios");
const xml2js = require("xml2js");

const ARXIV_BASE = "https://export.arxiv.org/api/query";
const GITHUB_BASE = "https://api.github.com";

// GenAI research categories on ArXiv
const ARXIV_CATEGORIES = [
  "cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE"
];

const GENAI_KEYWORDS = [
  "large language model", "LLM", "RAG", "retrieval augmented",
  "diffusion model", "transformer", "fine-tuning", "RLHF",
  "multimodal", "autonomous agent", "chain of thought",
  "generative AI", "foundation model", "instruction tuning",
  "vision language", "text to image"
];

// ── ArXiv Paper Fetching ──────────────────────────────────────────────────────

async function fetchArxivPapers(maxResults = 30) {
  try {
    const query = GENAI_KEYWORDS
      .slice(0, 6)
      .map(k => `all:"${k}"`)
      .join(" OR ");

    const params = {
      search_query: `(${query}) AND (cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV)`,
      start: 0,
      max_results: maxResults,
      sortBy: "submittedDate",
      sortOrder: "descending"
    };

    const response = await axios.get(ARXIV_BASE, { params, timeout: 15000 });
    const parsed = await xml2js.parseStringPromise(response.data);
    const entries = parsed.feed.entry || [];

    const papers = entries.map(entry => ({
      id: entry.id?.[0]?.split("/abs/")[1] || "",
      title: entry.title?.[0]?.replace(/\s+/g, " ").trim() || "",
      authors: (entry.author || []).map(a => a.name?.[0]).filter(Boolean).slice(0, 5),
      abstract: entry.summary?.[0]?.replace(/\s+/g, " ").trim() || "",
      published: entry.published?.[0] || "",
      updated: entry.updated?.[0] || "",
      arxivUrl: entry.id?.[0] || "",
      pdfUrl: entry.id?.[0]?.replace("/abs/", "/pdf/") + ".pdf" || "",
      categories: (entry.category || []).map(c => c.$.term),
      source: "arxiv"
    }));

    console.log(`[ScoutAgent] Fetched ${papers.length} papers from ArXiv`);
    return papers;
  } catch (err) {
    console.error("[ScoutAgent] ArXiv fetch error:", err.message);
    return [];
  }
}

// ── GitHub Repo Fetching ──────────────────────────────────────────────────────

async function fetchGitHubRepos(maxRepos = 20) {
  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `token ${process.env.GITHUB_TOKEN}`
      })
    };

    const queries = [
      "generative AI LLM",
      "large language model fine-tuning",
      "RAG retrieval augmented generation",
      "diffusion model image generation"
    ];

    const allRepos = [];

    for (const q of queries.slice(0, 2)) {
      const response = await axios.get(`${GITHUB_BASE}/search/repositories`, {
        headers,
        params: {
          q: `${q} pushed:>${getDateDaysAgo(14)}`,
          sort: "stars",
          order: "desc",
          per_page: 10
        },
        timeout: 10000
      });

      const repos = (response.data.items || []).map(repo => ({
        id: repo.id,
        name: repo.full_name,
        description: repo.description || "",
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language || "Unknown",
        topics: repo.topics || [],
        updatedAt: repo.updated_at,
        createdAt: repo.created_at,
        openIssues: repo.open_issues_count,
        hasReadme: true,
        license: repo.license?.name || "None",
        source: "github"
      }));

      allRepos.push(...repos);
      await sleep(1000); // Respect rate limits
    }

    // Deduplicate
    const unique = Array.from(new Map(allRepos.map(r => [r.id, r])).values());
    console.log(`[ScoutAgent] Fetched ${unique.length} repos from GitHub`);
    return unique.slice(0, maxRepos);
  } catch (err) {
    console.error("[ScoutAgent] GitHub fetch error:", err.message);
    return [];
  }
}

// ── Hugging Face Models ───────────────────────────────────────────────────────

async function fetchHuggingFaceModels(limit = 10) {
  try {
    const response = await axios.get("https://huggingface.co/api/models", {
      params: {
        sort: "trending",
        limit,
        filter: "text-generation"
      },
      timeout: 10000
    });

    const models = (response.data || []).map(m => ({
      id: m.modelId || m.id,
      name: m.modelId || m.id,
      downloads: m.downloads || 0,
      likes: m.likes || 0,
      tags: m.tags || [],
      url: `https://huggingface.co/${m.modelId || m.id}`,
      source: "huggingface"
    }));

    console.log(`[ScoutAgent] Fetched ${models.length} models from HuggingFace`);
    return models;
  } catch (err) {
    console.error("[ScoutAgent] HuggingFace fetch error:", err.message);
    return [];
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main Scout Run ────────────────────────────────────────────────────────────

async function runScoutAgent() {
  console.log("[ScoutAgent] Starting discovery run...");

  const [papers, repos, models] = await Promise.all([
    fetchArxivPapers(30),
    fetchGitHubRepos(20),
    fetchHuggingFaceModels(10)
  ]);

  return { papers, repos, models, scoutedAt: new Date().toISOString() };
}

module.exports = { runScoutAgent, fetchArxivPapers, fetchGitHubRepos, fetchHuggingFaceModels };
