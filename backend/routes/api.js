// ============================================
// API ROUTES
// ============================================

const express = require("express");
const router = express.Router();
const { runFullPipeline, getStatus, getLatestDigest } = require("../services/digestService");
const { sendDigest, sendTestEmail } = require("../services/emailService");
const { fetchArxivPapers } = require("../agents/scoutAgent");
const { analyzePaper } = require("../agents/analystAgent");
const { validateIdea } = require("../agents/ideasAgent");
const { generatePitch } = require("../agents/pitchAgent");

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
router.get("/trends", (req, res) => {
  const digest = getLatestDigest();
  res.json(digest?.trends || { topTrends: [], weekSummary: "", hotKeywords: [] });
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

module.exports = router;
