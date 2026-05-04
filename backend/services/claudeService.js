const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "your_key_here"
});

// Helper for basic TF-IDF / Keyword scoring for simple RAG
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

async function chatWithResearch(question, digest) {
  if (!digest || !digest.papers || digest.papers.length === 0) {
    return {
      answer: "I don't have any research papers in my context right now. Please run the pipeline first.",
      sources: []
    };
  }

  // Simple Retrieval: Score papers based on keyword overlap
  const scoredPapers = digest.papers.map(p => {
    const textToSearch = `${p.title} ${p.abstract} ${p.keyContributions?.join(" ")} ${p.researchArea}`;
    return {
      paper: p,
      score: calculateSimilarity(question, textToSearch)
    };
  });

  // Sort and pick top 5
  scoredPapers.sort((a, b) => b.score - a.score);
  const topDocs = scoredPapers.slice(0, 5).filter(sp => sp.score > 0 || scoredPapers.indexOf(sp) < 3).map(sp => sp.paper);

  const contextText = topDocs.map((p, i) => `
[Paper ${i+1}]
Title: ${p.title}
Authors: ${p.authors?.join(", ")}
Abstract: ${p.abstract}
Link: ${p.arxivUrl || p.pdfUrl || ''}
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
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Using haiku for speed
      max_tokens: 1000,
      system: "You are a helpful AI research assistant.",
      messages: [{ role: "user", content: prompt }]
    });

    const sources = topDocs.map(p => ({
      title: p.title,
      authors: p.authors?.join(", "),
      url: p.arxivUrl || p.pdfUrl,
      relevanceReason: "Matched keywords from your query."
    }));

    return {
      answer: response.content[0].text,
      sources
    };
  } catch (err) {
    console.error("[Claude RAG] Error:", err.message);
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
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });

    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse JSON from Claude");
  } catch (err) {
    console.error("[Claude Trends] Error:", err.message);
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
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }]
    });

    return { explanation: response.content[0].text };
  } catch (err) {
    console.error("[Claude Explain] Error:", err.message);
    throw new Error("Failed to generate paper explanation.");
  }
}

module.exports = {
  chatWithResearch,
  generateTrends,
  explainPaper
};
