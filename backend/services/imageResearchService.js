const axios = require("axios");
const xml2js = require("xml2js");
const { buildArxivQuery, rerankPapers } = require("./webSearchService");
const { generateAIResponse } = require("../services/aiRouter");
const OpenAI = require("openai");

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

  try {
    if (!openai) {
      throw new Error("OpenAI API key missing. Please set OPENAI_API_KEY in your .env file.");
    }
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
  } catch (err) {
    console.error("[Snap2Research] Vision analysis failed:", err.message);
    throw err;
  }
}

// ── Step 2: Search arXiv with extracted queries ───────────────────────────────

async function searchArxivForQueries(queries = [], maxResultsTotal = 10) {
  const allPapers = [];
  const seen = new Set();

  // Use up to 3 best queries to avoid rate-limiting
  const topQueries = queries.slice(0, 3);

  for (const query of topQueries) {
    try {
      // Use the stricter cascading query builder from webSearchService
      const searchQuery = buildArxivQuery(query);
      
      const params = {
        search_query: searchQuery,
        start: 0,
        max_results: Math.ceil(maxResultsTotal / topQueries.length) + 5, // Fetch extra for reranking
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

  return allPapers;
}

// ── Step 3: Generate Full Project Build Plan ───────────────────────────────────

async function generateBuildPlan(imageAnalysis, papers = []) {
  console.log("[Snap2Research] Generating build plan...");

  const paperContext = papers.slice(0, 4).map((p, i) => 
    `Paper ${i+1}: ${p.title}\nAbstract: ${p.abstract.slice(0, 300)}...`
  ).join("\n\n");

  const prompt = `You are a project architect. Based on the following research image analysis and related papers, generate a COMPREHENSIVE project blueprint for a buildable AI application.

IMAGE ANALYSIS:
Problem: ${imageAnalysis.mainProblem}
Keywords: ${imageAnalysis.researchKeywords.join(", ")}
Domains: ${imageAnalysis.possibleDomains.join(", ")}

RESEARCH CONTEXT:
${paperContext}

Return JSON only:
{
  "projectTitle": "Catchy name",
  "tagline": "Tweet length hook",
  "difficultyLevel": "Beginner | Intermediate | Advanced",
  "estimatedTime": "2-4 weeks",
  "problemStatement": "2-3 sentences explaining the core issue",
  "proposedSolution": "How it uses AI specifically",
  "uniqueAngle": "What makes it special",
  "coreFeatures": [
    {"feature": "Feature name", "description": "Details", "priority": "Must-have | Nice-to-have"}
  ],
  "techStack": {
    "frontend": ["React", "Tailwind"],
    "backend": ["Node/Express", "Python"],
    "ai_ml": ["OpenAI", "PyTorch"],
    "database": ["Pinecone", "Supabase"]
  },
  "datasetsAndAPIs": [
    {"name": "Name", "purpose": "Why use it", "url": "Link if any"}
  ],
  "architecture": {
    "overview": "High level flow",
    "components": [
      {"name": "Comp Name", "role": "What it does"}
    ]
  },
  "roadmap": [
    {
      "week": 1,
      "days": "Day 1-7",
      "phase": "Foundation",
      "tasks": ["Task 1", "Task 2"]
    },
    {
      "week": 2,
      "days": "Day 8-14",
      "phase": "Deployment",
      "tasks": ["Task 3", "Task 4"]
    }
  ],
  "successMetrics": ["Metric 1"]
}
Rules:
- Be specific, not generic. 
- Use the tech stack mentioned in the context (React/Node) unless a different one is better for AI (e.g. Python for ML parts).
- Ensure the roadmap covers all 14 days.`;

  const content = await generateAIResponse(prompt, { useJson: true });
  const cleaned = content.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
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
  const rawPapers = await searchArxivForQueries(queriesToUse, 15);

  // 4. Rerank for maximum relevance using the aggregate of queries and problem
  const aggregateQuery = `${mainProblem} ${researchKeywords.join(" ")}`;
  const papers = rerankPapers(rawPapers, aggregateQuery, 1).slice(0, 10);

  console.log(`[Snap2Research] Returned ${papers.length} relevant papers.`);

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

module.exports = { analyzeImageAndFetchPapers, generateBuildPlan };
