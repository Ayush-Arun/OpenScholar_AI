// ============================================
// API ROUTES
// ============================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { runFullPipeline, getStatus, getLatestDigest } = require("../services/digestService");
const { sendDigest, sendTestEmail } = require("../services/emailService");
const { fetchArxivPapers } = require("../agents/scoutAgent");
const { fetchLatestPapers } = require("../services/arxivService");
const { analyzePaper } = require("../agents/analystAgent");
const { validateIdea } = require("../agents/ideasAgent");
const { generatePitch } = require("../agents/pitchAgent");
const { chatWithResearch, generateTrends, explainPaper } = require("../services/claudeService");
const { analyzeImageAndFetchPapers, generateBuildPlan } = require("../services/imageResearchService");
const { fetchPapersFromQuery, buildArxivQuery, queryCache } = require("../services/webSearchService");

// In-memory cache for paper explanations
const explanationCache = {};

// ── Multer (memory storage – no disk write) ───────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

// GET /api/status - System status
router.get("/status", (req, res) => {
  res.json({ ok: true, ...getStatus() });
});

// GET /api/digest - Get latest digest
router.get("/digest", (req, res) => {
  const digest = getLatestDigest();
  if (!digest) {
    return res.json({
      message: "No digest generated yet. Run /api/run to generate one.",
      papers: [], repos: [], trends: {}, stats: {}
    });
  }
  res.json(digest);
});

// POST /api/run - Trigger full pipeline
router.post("/run", async (req, res) => {
  const { skipEmail, recipients } = req.body || {};
  console.log("[API] Manual pipeline trigger received");

  // Respond immediately, run in background
  res.json({ message: "Pipeline started. Poll /api/status for progress." });

  runFullPipeline({ skipEmail: skipEmail ?? false, recipients }).catch(err => {
    console.error("[API] Pipeline error:", err.message);
  });
});

// POST /api/pipeline/run - Alias for trigger full pipeline (per requirements)
router.post("/pipeline/run", async (req, res) => {
  const { skipEmail, recipients } = req.body || {};
  console.log("[API] Pipeline/run trigger received");

  res.json({ message: "Pipeline started. Poll /api/status for progress." });

  runFullPipeline({ skipEmail: skipEmail ?? true, recipients }).catch(err => {
    console.error("[API] Pipeline error:", err.message);
  });
});

// GET /api/papers/fetch - Standalone fetch
router.get("/papers/fetch", async (req, res) => {
  try {
    const papers = await fetchLatestPapers(30);
    res.json({ success: true, count: papers.length, papers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/papers/search - Dynamic web search by query with caching
router.post("/papers/search", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ success: false, error: "query (string) is required" });
  }

  const digest = getLatestDigest();
  const localPapers = digest?.papers || [];

  // Score local papers first
  const { calculateSimilarity } = require("../services/webSearchService");
  const scored = localPapers.map(p => ({
    paper: p,
    score: calculateSimilarity(query, `${p.title} ${p.abstract} ${p.researchArea}`)
  }));
  scored.sort((a, b) => b.score - a.score);
  const bestLocalScore = scored[0]?.score || 0;
  const topLocal = scored.filter(s => s.score >= 2).map(s => s.paper);

  if (topLocal.length >= 3) {
    // Local data is sufficient
    return res.json({
      source: "local",
      arxivQuery: null,
      fromCache: false,
      papers: topLocal.slice(0, 15),
      answer: ""
    });
  }

  // Fetch from web
  try {
    const arxivQuery = buildArxivQuery(query);
    const { papers, fromCache } = await fetchPapersFromQuery(query, 15);
    res.json({
      source: "web",
      arxivQuery,
      fromCache,
      papers,
      answer: ""
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Could not fetch papers from web. Try again." });
  }
});

// POST /api/run-sync - Trigger pipeline and wait (for demo)
router.post("/run-sync", async (req, res) => {
  const { skipEmail } = req.body || {};
  const result = await runFullPipeline({ skipEmail: skipEmail ?? true });
  res.json(result);
});

// GET /api/papers - Get papers from latest digest
router.get("/papers", (req, res) => {
  const digest = getLatestDigest();
  const papers = digest?.papers || [];
  const { label, area, min_score } = req.query;

  let filtered = papers;
  if (label) filtered = filtered.filter(p => p.actionLabel === label);
  if (area) filtered = filtered.filter(p => p.researchArea?.toLowerCase().includes(area.toLowerCase()));
  if (min_score) filtered = filtered.filter(p => (p.overallScore || 0) >= parseInt(min_score));

  res.json({ count: filtered.length, papers: filtered });
});

// GET /api/repos - Get repos from latest digest
router.get("/repos", (req, res) => {
  const digest = getLatestDigest();
  const repos = digest?.repos || [];
  const { label, language } = req.query;

  let filtered = repos;
  if (label) filtered = filtered.filter(r => r.usabilityLabel === label);
  if (language) filtered = filtered.filter(r => r.language?.toLowerCase() === language.toLowerCase());

  res.json({ count: filtered.length, repos: filtered });
});

// GET /api/trends - Get trends
router.get("/trends", async (req, res) => {
  const digest = getLatestDigest();
  if (!digest || !digest.papers || digest.papers.length === 0) {
    return res.json({ topTrends: [], weekSummary: "No papers available for trend analysis.", trends: [] });
  }
  
  // If we already generated trends for this digest (cached), return them
  if (digest.generatedTrends) {
    return res.json(digest.generatedTrends);
  }

  try {
    const trendsResult = await generateTrends(digest.papers);
    // Cache it in the digest
    digest.generatedTrends = trendsResult;
    res.json(trendsResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/research-chat - Ask questions about papers (local RAG → web fallback)
router.post("/research-chat", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "question required" });

  const digest = getLatestDigest();
  try {
    const result = await chatWithResearch(question, digest);
    res.json(result); // now always includes: source, answer, sources, fetchedPapers
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/papers/:id/explain - Explain a paper
router.post("/papers/:id/explain", async (req, res) => {
  const { mode } = req.body; // beginner, developer, researcher
  const paperId = req.params.id; // using index or arxiv id
  
  const cacheKey = `${paperId}_${mode}`;
  if (explanationCache[cacheKey]) {
    return res.json(explanationCache[cacheKey]);
  }

  const digest = getLatestDigest();
  if (!digest || !digest.papers) return res.status(400).json({ error: "No papers available" });

  // Find paper by ID or index
  let paper = digest.papers.find(p => p.id === paperId || p.arxivUrl?.includes(paperId));
  if (!paper) {
    // Fallback to array index if id is just a number
    const idx = parseInt(paperId, 10);
    if (!isNaN(idx) && idx >= 0 && idx < digest.papers.length) {
      paper = digest.papers[idx];
    }
  }

  if (!paper) return res.status(404).json({ error: "Paper not found" });

  try {
    const result = await explainPaper(paper, mode || "beginner");
    explanationCache[cacheKey] = result;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email/send - Manually send digest
router.post("/email/send", async (req, res) => {
  const digest = getLatestDigest();
  if (!digest) return res.status(400).json({ error: "No digest available to send" });

  const { recipients } = req.body;
  const result = await sendDigest(digest, recipients);
  res.json(result);
});

// POST /api/email/test - Send test email
router.post("/email/test", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  const result = await sendTestEmail(email);
  res.json(result);
});

// GET /api/search - Search papers and repos
router.get("/search", (req, res) => {
  const digest = getLatestDigest();
  const { q } = req.query;
  if (!q || !digest) return res.json({ papers: [], repos: [] });

  const query = q.toLowerCase();
  const papers = digest.papers.filter(p =>
    p.title?.toLowerCase().includes(query) ||
    p.abstract?.toLowerCase().includes(query) ||
    p.researchArea?.toLowerCase().includes(query)
  );
  const repos = digest.repos.filter(r =>
    r.name?.toLowerCase().includes(query) ||
    r.description?.toLowerCase().includes(query) ||
    r.topics?.some(t => t.toLowerCase().includes(query))
  );

  res.json({ papers, repos });
});

// GET /api/ideas - Get build ideas from latest digest
router.get("/ideas", (req, res) => {
  const digest = getLatestDigest();
  const ideas = digest?.buildIdeas || [];
  res.json({ count: ideas.length, ideas });
});

// POST /api/validate - Validate a user-typed idea
router.post("/validate", async (req, res) => {
  const { idea } = req.body;
  if (!idea || typeof idea !== "string") {
    return res.status(400).json({ error: "idea (string) is required in request body" });
  }
  console.log(`[API] Validating idea: ${idea.slice(0, 60)}...`);
  const digest = getLatestDigest();
  const result = await validateIdea(idea, digest);
  res.json(result);
});

// POST /api/ideas/:index/pitch - Generate pitch for a specific idea
router.post("/ideas/:index/pitch", async (req, res) => {
  const digest = getLatestDigest();
  const idx = parseInt(req.params.index, 10);

  if (!digest?.buildIdeas?.length) {
    return res.status(400).json({ error: "No ideas available. Run the pipeline first." });
  }
  if (isNaN(idx) || idx < 0 || idx >= digest.buildIdeas.length) {
    return res.status(400).json({ error: `Index out of range. Available: 0–${digest.buildIdeas.length - 1}` });
  }

  const idea = digest.buildIdeas[idx];
  console.log(`[API] Generating pitch for idea[${idx}]: ${idea.name}`);
  const result = await generatePitch(idea);
  res.json(result);
});

// POST /api/image-research - Snap2Research: analyze image and fetch related papers
router.post("/image-research", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image file provided. Upload an image with field name 'image'." });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    console.log(`[API] Snap2Research request: ${req.file.originalname} (${req.file.size} bytes, ${mimeType})`);

    const { imageAnalysis, papers } = await analyzeImageAndFetchPapers(base64Image, mimeType);

    res.json({
      success: true,
      imageAnalysis,
      papers
    });
  } catch (err) {
    console.error("[API] Snap2Research error:", err.message);
    res.status(err.code === "NO_RESEARCH_SIGNAL" ? 422 : 500).json({
      success: false,
      error: err.message || "Failed to analyze image. Please try again."
    });
  }
});

// POST /api/snap2research/build-plan - Generate full project blueprint from image analysis
router.post("/snap2research/build-plan", async (req, res) => {
  try {
    const { imageAnalysis, papers } = req.body;
    if (!imageAnalysis || !imageAnalysis.mainProblem) {
      return res.status(400).json({ success: false, error: "imageAnalysis is required." });
    }
    console.log("[API] Generating build plan for:", imageAnalysis.mainProblem?.slice(0, 60));
    const buildPlan = await generateBuildPlan(imageAnalysis, papers || []);
    res.json({ success: true, buildPlan });
  } catch (err) {
    console.error("[API] Build plan error:", err.message);
    res.status(500).json({ success: false, error: err.message || "Failed to generate build plan." });
  }
});

module.exports = router;
