// ============================================
// ANALYST AGENT
// Uses Claude API to score & summarize papers
// Scores: Relevance, Novelty, Clarity, Practicality
// ============================================

const { generateAIResponse } = require("../services/aiRouter");

// ── Paper Analysis ────────────────────────────────────────────────────────────

async function analyzePaper(paper) {
  try {
    const prompt = `You are an expert GenAI research analyst. Analyze this research paper and return ONLY valid JSON.

Paper Title: ${paper.title}
Authors: ${paper.authors?.join(", ")}
Abstract: ${paper.abstract}
Published: ${paper.published}

Return this exact JSON structure (no markdown, no explanation):
{
  "methodology": "2-3 sentence description of the approach/method used",
  "keyContributions": ["contribution 1", "contribution 2", "contribution 3"],
  "datasets": ["dataset1", "dataset2"],
  "relevanceScore": 85,
  "noveltyScore": 78,
  "clarityScore": 82,
  "practicalityScore": 70,
  "adoptionScore": 75,
  "overallScore": 78,
  "actionLabel": "Should Watch",
  "tldr": "One sentence summary of what this paper does and why it matters",
  "keyTakeaway": "What a developer/researcher should do with this paper",
  "researchArea": "LLMs | RAG | Diffusion | Agents | Multimodal | Other",
  "complexity": "Beginner | Intermediate | Advanced"
}

Scoring rules:
- relevanceScore: 0-100, how relevant to GenAI practitioners
- noveltyScore: 0-100, how novel/innovative vs existing work
- clarityScore: 0-100, how clear and well-written
- practicalityScore: 0-100, how implementable in practice
- adoptionScore: 0-100, likelihood of real-world adoption
- overallScore: weighted average
- actionLabel must be exactly one of: "Should Build", "Should Learn", "Should Watch", "Should Ignore"
  * Should Build: overallScore >= 80 and practicalityScore >= 75
  * Should Learn: overallScore >= 65 and noveltyScore >= 70
  * Should Watch: overallScore >= 50
  * Should Ignore: overallScore < 50`;

    const content = await generateAIResponse(prompt, { useJson: true });
    const cleaned = content.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return { ...paper, ...analysis, analyzedAt: new Date().toISOString() };
  } catch (err) {
    console.error(`[AnalystAgent] Error analyzing paper: ${paper.title?.slice(0, 50)}`, err.message);
    return {
      ...paper,
      methodology: "Analysis unavailable",
      keyContributions: [],
      datasets: [],
      relevanceScore: 50,
      noveltyScore: 50,
      clarityScore: 50,
      practicalityScore: 50,
      adoptionScore: 50,
      overallScore: 50,
      actionLabel: "Should Watch",
      tldr: paper.abstract?.slice(0, 200) || "",
      keyTakeaway: "Review manually",
      researchArea: "Other",
      complexity: "Intermediate"
    };
  }
}

// ── Repo Analysis ─────────────────────────────────────────────────────────────

async function analyzeRepo(repo) {
  try {
    const prompt = `You are an expert code reviewer specializing in GenAI repositories. Analyze this GitHub repository and return ONLY valid JSON.

Repository: ${repo.name}
Description: ${repo.description}
Stars: ${repo.stars}
Forks: ${repo.forks}
Language: ${repo.language}
Topics: ${repo.topics?.join(", ")}
License: ${repo.license}
Open Issues: ${repo.openIssues}
Last Updated: ${repo.updatedAt}

Return this exact JSON structure (no markdown, no explanation):
{
  "completenessScore": 75,
  "freshnessScore": 80,
  "buildFeasibilityScore": 70,
  "documentationScore": 65,
  "reproducibilityScore": 72,
  "repoOverallScore": 72,
  "usabilityLabel": "Should Build",
  "techStack": ["Python", "PyTorch"],
  "useCase": "What this repo does in one line",
  "buildDifficulty": "Easy | Medium | Hard",
  "targetAudience": "Researchers | Developers | Both",
  "quickSummary": "2-3 sentences on what this repo offers and who should use it"
}

Scoring rules:
- completenessScore: based on stars, forks, topics richness
- freshnessScore: based on last update date (recent = higher)
- buildFeasibilityScore: estimate from language, issues, forks
- documentationScore: estimate from description quality
- reproducibilityScore: estimate from stars/forks ratio
- usabilityLabel must be exactly: "Should Build", "Should Learn", "Should Watch", or "Should Ignore"`;

    const content = await generateAIResponse(prompt, { useJson: true });
    const cleaned = content.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return { ...repo, ...analysis, analyzedAt: new Date().toISOString() };
  } catch (err) {
    console.error(`[AnalystAgent] Error analyzing repo: ${repo.name}`, err.message);
    return {
      ...repo,
      completenessScore: 60,
      freshnessScore: 60,
      buildFeasibilityScore: 60,
      documentationScore: 60,
      reproducibilityScore: 60,
      repoOverallScore: 60,
      usabilityLabel: "Should Watch",
      techStack: [repo.language],
      useCase: repo.description || "",
      buildDifficulty: "Medium",
      targetAudience: "Developers",
      quickSummary: repo.description || "No summary available"
    };
  }
}

// ── Trend Detection ───────────────────────────────────────────────────────────

async function detectTrends(papers, repos) {
  try {
    const paperTitles = papers.slice(0, 15).map(p => p.title).join("\n");
    const repoTopics = repos.slice(0, 10).flatMap(r => r.topics).join(", ");

    const prompt = `You are a GenAI trend analyst. Based on these recent papers and repos, identify key trends.

Recent Paper Titles:
${paperTitles}

Trending Repo Topics: ${repoTopics}

Return ONLY valid JSON:
{
  "topTrends": [
    {"trend": "Trend name", "momentum": 85, "description": "What's happening", "emoji": "🚀"},
    {"trend": "Trend name", "momentum": 72, "description": "What's happening", "emoji": "🧠"},
    {"trend": "Trend name", "momentum": 68, "description": "What's happening", "emoji": "⚡"},
    {"trend": "Trend name", "momentum": 60, "description": "What's happening", "emoji": "🔬"},
    {"trend": "Trend name", "momentum": 55, "description": "What's happening", "emoji": "🎯"}
  ],
  "weekSummary": "2-3 sentence executive summary of what happened this week in GenAI research",
  "hotKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"]
}`;

    const content = await generateAIResponse(prompt, { useJson: true });
    const cleaned = content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[AnalystAgent] Trend detection error:", err.message);
    return {
      topTrends: [],
      weekSummary: "Trend analysis unavailable this week.",
      hotKeywords: []
    };
  }
}

// ── Batch Analysis ────────────────────────────────────────────────────────────

async function runAnalystAgent(scoutData) {
  console.log("[AnalystAgent] Starting analysis...");

  const { papers = [], repos = [] } = scoutData;

  // Analyze top papers (limit to avoid rate limits)
  const topPapers = papers.slice(0, 15);
  const analyzedPapers = [];

  for (const paper of topPapers) {
    const result = await analyzePaper(paper);
    analyzedPapers.push(result);
    await sleep(500); // Rate limit buffer
  }

  // Analyze top repos
  const topRepos = repos.slice(0, 10);
  const analyzedRepos = [];

  for (const repo of topRepos) {
    const result = await analyzeRepo(repo);
    analyzedRepos.push(result);
    await sleep(300);
  }

  // Sort by score
  analyzedPapers.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
  analyzedRepos.sort((a, b) => (b.repoOverallScore || 0) - (a.repoOverallScore || 0));

  // Detect trends
  const trends = await detectTrends(analyzedPapers, analyzedRepos);

  console.log(`[AnalystAgent] Analyzed ${analyzedPapers.length} papers, ${analyzedRepos.length} repos`);

  return {
    papers: analyzedPapers,
    repos: analyzedRepos,
    trends,
    analyzedAt: new Date().toISOString()
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { runAnalystAgent, analyzePaper, analyzeRepo, detectTrends };
