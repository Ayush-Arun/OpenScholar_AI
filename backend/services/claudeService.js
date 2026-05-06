const { generateAIResponse } = require("./aiRouter");
const { fetchPapersFromQuery, generateRAGAnswerFromWeb, calculateSimilarity } = require("./webSearchService");

// LOCAL RAG threshold — if best local paper scores below this, go to the web
const LOCAL_RELEVANCE_THRESHOLD = 2;

async function chatWithResearch(question, digest) {
  const localPapers = digest?.papers || [];

  // ── Score local papers ────────────────────────────────────────────────────
  let topDocs = [];
  let maxScore = 0;

  if (localPapers.length > 0) {
    const scoredPapers = localPapers.map(p => {
      const textToSearch = `${p.title} ${p.abstract} ${p.keyContributions?.join(" ")} ${p.researchArea}`;
      return { paper: p, score: calculateSimilarity(question, textToSearch) };
    });
    scoredPapers.sort((a, b) => b.score - a.score);
    maxScore = scoredPapers[0]?.score || 0;
    topDocs = scoredPapers.slice(0, 5).filter(sp => sp.score > 0 || scoredPapers.indexOf(sp) < 3).map(sp => sp.paper);
  }

  // ── Decide: local or web? ─────────────────────────────────────────────────
  const useWeb = maxScore < LOCAL_RELEVANCE_THRESHOLD;

  if (useWeb) {
    console.log(`[ChatRAG] Local score too low (${maxScore}), falling back to web for: "${question}"`);
    try {
      const { papers: webPapers } = await fetchPapersFromQuery(question, 15);
      if (webPapers.length === 0) {
        return {
          source: "web",
          answer: "Could not fetch papers from web. Try again.",
          sources: [],
          fetchedPapers: []
        };
      }

      const answer = await generateRAGAnswerFromWeb(question, webPapers);

      return {
        source: "web",
        answer,
        sources: webPapers.slice(0, 5).map(p => ({
          title: p.title,
          authors: p.authors?.slice(0, 3).join(", "),
          url: p.arxivUrl,
          relevanceReason: "Fetched live from arXiv for your query."
        })),
        fetchedPapers: webPapers.slice(0, 10).map(p => ({
          title: p.title,
          authors: p.authors || [],
          abstract: p.abstract,
          publishedDate: p.published,
          arxivUrl: p.arxivUrl,
          pdfUrl: p.pdfUrl,
          categories: p.categories || []
        }))
      };
    } catch (err) {
      console.error("[ChatRAG] Web fallback error:", err.message);
      return {
        source: "web",
        answer: "Could not fetch papers from web. Try again.",
        sources: [],
        fetchedPapers: []
      };
    }
  }

  // ── Local RAG path ────────────────────────────────────────────────────────
  const contextText = topDocs.map((p, i) => `
[Paper ${i + 1}]
Title: ${p.title}
Authors: ${p.authors?.join(", ")}
Abstract: ${p.abstract}
Link: ${p.arxivUrl || p.pdfUrl || ""}
`).join("\n");

  const prompt = `You are a research assistant. Answer the user question using ONLY the provided paper context.

Question: ${question}

Relevant paper context:
${contextText}

Return your answer in the following structure exactly (using Markdown):
### 1. Direct answer
(your answer here)

### 2. Important details
(details here)

### 3. Related papers
(list the papers you used)

### 4. Suggested next step
(what the user should look into next)

If the context is insufficient to answer the question, say so honestly.`;

  try {
    const answer = await generateAIResponse(prompt, { system: "You are a helpful AI research assistant." });

    const sources = topDocs.map(p => ({
      title: p.title,
      authors: p.authors?.join(", "),
      url: p.arxivUrl || p.pdfUrl,
      relevanceReason: "Matched keywords from your query."
    }));

    return {
      source: "local",
      answer,
      sources,
      fetchedPapers: []
    };
  } catch (err) {
    console.error("[ChatRAG] AI Error:", err.message);
    throw new Error("Failed to generate research chat response.");
  }
}


async function generateTrends(papers) {
  if (!papers || papers.length === 0) {
    return {
      weeklySummary: "No papers analyzed this week.",
      trends: []
    };
  }

  const topicsText = papers.map(p => `${p.title} - ${p.researchArea} - ${p.categories?.join(",")}`).join("\n");
  
  const prompt = `You are an AI research trend analyst. Based on these papers and extracted topics, summarize the current GenAI research trends.

Papers/Topics:
${topicsText}

Return ONLY valid JSON in this exact structure:
{
  "weeklySummary": "A 2-3 sentence engaging summary of the overall landscape.",
  "trends": [
    {
      "topic": "Trend Name (e.g. RAG, Multimodal)",
      "count": 5,
      "direction": "up", // must be "up", "stable", or "down"
      "explanation": "Why this is trending based on the papers.",
      "relatedPapers": ["Paper Title 1", "Paper Title 2"]
    }
  ]
}
Note: Since we don't have historical data, mark direction as "stable" or "up" based on your intuition of the field.`;

  try {
    const content = await generateAIResponse(prompt, { useJson: true });
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse JSON from AI response");
  } catch (err) {
    console.error("[Trends] AI Error:", err.message);
    throw new Error("Failed to generate trends analysis.");
  }
}

async function explainPaper(paper, mode) {
  const prompt = `You are an expert AI research mentor. Explain this research paper for a ${mode} audience.

Paper title: ${paper.title}
Authors: ${paper.authors?.join(", ")}
Abstract: ${paper.abstract}

Return your explanation in this exact structure using Markdown:

### 1. Simple explanation
(Your content)

### 2. Problem solved
(Your content)

### 3. Core method
(Your content)

### 4. Why it matters
(Your content)

### 5. Difficulty level
(Your content)

### 6. Buildable project idea
(Your content)

Keep it clear, practical, and useful for students/developers.`;

  try {
    const answer = await generateAIResponse(prompt);
    return { explanation: answer };
  } catch (err) {
    console.error("[Explain] AI Error:", err.message);
    throw new Error("Failed to generate paper explanation.");
  }
}

module.exports = {
  chatWithResearch,
  generateTrends,
  explainPaper
};
