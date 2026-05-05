// ============================================
// IDEAS AGENT
// Generates actionable project ideas from
// analyzed papers & repos using Claude API
// ============================================

const { generateAIResponse } = require("../services/aiRouter");

// ── Generate Project Ideas ────────────────────────────────────────────────────

async function generateIdeas(papers = [], repos = []) {
  try {
    const topPapers = papers
      .slice(0, 10)
      .map(
        (p, i) =>
          `${i + 1}. [${p.actionLabel || "Should Watch"}] ${p.title} — ${p.tldr || p.abstract?.slice(0, 120) || ""}`
      )
      .join("\n");

    const topRepos = repos
      .slice(0, 8)
      .map(
        (r, i) =>
          `${i + 1}. [${r.usabilityLabel || "Should Watch"}] ${r.name} (⭐${r.stars}) — ${r.quickSummary || r.description || ""}`
      )
      .join("\n");

    const prompt = `You are an expert AI innovation strategist helping students and developers discover what to build next.

Based on these recent AI research papers and trending GitHub repositories, generate 5 highly practical, original project ideas.

TOP RESEARCH PAPERS:
${topPapers}

TRENDING REPOS:
${topRepos}

For each idea, think about what a student or indie developer can realistically build in a hackathon or 2-4 weeks.

Return ONLY valid JSON array (no markdown, no explanation):
[
  {
    "name": "Project name (catchy, specific)",
    "problem": "The real-world problem this solves (1-2 sentences)",
    "solution": "How this project solves it using AI (2-3 sentences)",
    "targetUsers": "Who benefits from this (students, doctors, developers, etc.)",
    "mvpFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
    "techStack": ["React", "Node.js", "Claude API", "MongoDB"],
    "difficulty": "Easy | Medium | Hard",
    "impactScore": 8.5,
    "pitchLine": "One powerful sentence pitch",
    "learningRoadmap": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
    "inspirationSource": "Which paper or repo inspired this idea",
    "actionLabel": "BUILD | LEARN | EXPLORE",
    "estimatedTime": "1 week | 2 weeks | 1 month",
    "uniqueAngle": "What makes this different from existing solutions"
  }
]

Make all 5 ideas distinct. Prioritize ideas that are innovative, practical, and have a clear MVP path.`;

    const content = await generateAIResponse(prompt, { useJson: true });
    const cleaned = content.replace(/```json|```/g, "").trim();
    const ideas = JSON.parse(cleaned);

    console.log(`[IdeasAgent] Generated ${ideas.length} project ideas`);
    return ideas;
  } catch (err) {
    console.error("[IdeasAgent] Error generating ideas:", err.message);
    return getFallbackIdeas();
  }
}

// ── Validate User Idea ─────────────────────────────────────────────────────────

async function validateIdea(ideaText, digest = null) {
  try {
    let contextStr = "";
    if (digest && digest.papers && digest.papers.length > 0) {
      const topPapers = digest.papers.slice(0, 5).map(p => `- ${p.title}: ${p.tldr || p.abstract?.slice(0,100)}`).join("\n");
      const trends = digest.trends?.topTrends?.map(t => t.trend).join(", ") || "";
      contextStr = `
RECENT RESEARCH & TRENDS CONTEXT:
Trending Topics: ${trends}
Recent Papers:
${topPapers}

IMPORTANT: Evaluate this idea specifically against the context of these recent research papers and trends. Point out specific problems and solutions that align with these papers (e.g., if the idea uses Cloud Computing, LLMs, or RAG, connect it to the research).`;
    }

    const prompt = `You are an AI product strategist and hackathon judge. A developer wants to know if they should build this idea.

Idea: "${ideaText}"
${contextStr}

Evaluate this idea based on:
- Alignment with recent research (mention specific problems/solutions from the context if applicable)
- Market demand
- Technical feasibility
- Innovation level
- Competition level
- MVP simplicity
- AI/ML applicability

Return ONLY valid JSON (no markdown):
{
  "verdict": "BUILD | LEARN | EXPLORE | SKIP",
  "verdictReason": "Clear reason for the verdict, explicitly connecting their idea to recent research problems/solutions (2-3 sentences)",
  "marketDemand": 7,
  "feasibility": 8,
  "innovation": 6,
  "competition": "Low | Medium | High",
  "mvpTime": "1 week | 2 weeks | 1 month | 3 months",
  "suggestedTwist": "One unique angle that would make this stand out based on recent trends",
  "techStack": ["Suggested", "Tech", "Stack"],
  "nextStep": "The single most important first step to start building this",
  "similarProjects": ["Example 1", "Example 2"],
  "winningFeature": "The one feature that would make judges love this"
}`;

    const content = await generateAIResponse(prompt, { useJson: true });
    const cleaned = content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[IdeasAgent] Error validating idea:", err.message);
    return {
      verdict: "EXPLORE",
      verdictReason: "Unable to analyze at this time. Try again in a moment.",
      marketDemand: 5,
      feasibility: 5,
      innovation: 5,
      competition: "Medium",
      mvpTime: "2 weeks",
      suggestedTwist: "Add an AI-powered component to differentiate",
      techStack: ["React", "Node.js", "AI API"],
      nextStep: "Define your target user and core value proposition",
      similarProjects: [],
      winningFeature: "Unique AI-powered insight"
    };
  }
}

// ── Fallback Ideas ─────────────────────────────────────────────────────────────

function getFallbackIdeas() {
  return [
    {
      name: "AI Research Assistant for Students",
      problem: "Students spend hours manually reading and summarizing research papers.",
      solution: "An app that fetches the latest AI papers, summarizes them with Claude, and suggests which ones to read based on your learning goals.",
      targetUsers: "Students, researchers, self-learners",
      mvpFeatures: ["ArXiv paper fetcher", "AI summary", "Relevance scoring", "Reading list"],
      techStack: ["React", "Node.js", "Claude API", "MongoDB"],
      difficulty: "Medium",
      impactScore: 8.2,
      pitchLine: "Stop reading papers. Start understanding research.",
      learningRoadmap: ["Learn REST APIs", "Integrate ArXiv API", "Add Claude AI summaries", "Build React dashboard"],
      inspirationSource: "OpenScholar AI pipeline",
      actionLabel: "BUILD",
      estimatedTime: "2 weeks",
      uniqueAngle: "Personalized research feed based on your skill level"
    },
    {
      name: "RAG-Powered Code Documentation Generator",
      problem: "Developers hate writing documentation and codebases quickly become unmaintainable.",
      solution: "Upload your codebase and get AI-generated documentation, README files, and inline comments using RAG to understand context.",
      targetUsers: "Developers, open source maintainers, engineering teams",
      mvpFeatures: ["File upload", "RAG chunking", "AI doc generation", "Export to Markdown"],
      techStack: ["Python", "LangChain", "Claude API", "Vector DB"],
      difficulty: "Medium",
      impactScore: 7.8,
      pitchLine: "Your code, documented in seconds.",
      learningRoadmap: ["Learn RAG basics", "Build file parser", "Add vector embeddings", "Integrate Claude"],
      inspirationSource: "RAG research papers",
      actionLabel: "BUILD",
      estimatedTime: "2 weeks",
      uniqueAngle: "Context-aware docs that understand your entire codebase"
    }
  ];
}

module.exports = { generateIdeas, validateIdea };
