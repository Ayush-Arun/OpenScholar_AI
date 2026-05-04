const axios = require("axios");
const xml2js = require("xml2js");

const ARXIV_BASE = "http://export.arxiv.org/api/query";

async function fetchLatestPapers(maxResults = 30) {
  try {
    const params = {
      search_query: 'all:"large language models" OR all:"retrieval augmented generation" OR all:"AI agents" OR all:"multimodal"',
      start: 0,
      max_results: maxResults,
      sortBy: "submittedDate",
      sortOrder: "descending"
    };

    let response;
    try {
      response = await axios.get(ARXIV_BASE, { params, timeout: 25000 });
    } catch (err) {
      if (err.response && err.response.status === 429) {
        console.log("[ArxivService] Rate limit hit (429), retrying after 10s...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        response = await axios.get(ARXIV_BASE, { params, timeout: 25000 });
      } else {
        throw err;
      }
    }

    const parsed = await xml2js.parseStringPromise(response.data);
    const entries = parsed.feed.entry || [];

    const papers = entries.map(entry => ({
      id: entry.id?.[0]?.split("/abs/")[1] || "",
      title: entry.title?.[0]?.replace(/\s+/g, " ").trim() || "",
      authors: (entry.author || []).map(a => a.name?.[0]).filter(Boolean),
      abstract: entry.summary?.[0]?.replace(/\s+/g, " ").trim() || "",
      published: entry.published?.[0] || "",
      updated: entry.updated?.[0] || "",
      arxivUrl: entry.id?.[0] || "",
      pdfUrl: entry.id?.[0]?.replace("/abs/", "/pdf/") + ".pdf" || "",
      categories: (entry.category || []).map(c => c.$.term),
      source: "arxiv"
    }));

    console.log(`[ArxivService] Successfully fetched ${papers.length} papers from ArXiv`);
    return papers;
  } catch (err) {
    console.error("[ArxivService] ArXiv fetch error:", err.message);
    throw new Error("Failed to fetch papers from ArXiv");
  }
}

module.exports = { fetchLatestPapers };
