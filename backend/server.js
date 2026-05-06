// ============================================
// OPENSCHOLAR AI - MAIN SERVER
// ============================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { runFullPipeline, getStatus } = require("./services/digestService");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"] }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "OpenScholar AI API",
    version: "1.0.0",
    team: "Team SCAM*€₹$",
    endpoints: [
      "GET  /api/status      - System status",
      "GET  /api/digest      - Latest digest data",
      "POST /api/run         - Trigger pipeline (async)",
      "POST /api/run-sync    - Trigger pipeline (sync, for demos)",
      "GET  /api/papers      - Papers list (filter: label, area, min_score)",
      "GET  /api/repos       - Repos list (filter: label, language)",
      "GET  /api/trends      - Trend data",
      "POST /api/email/send  - Send digest email",
      "POST /api/email/test  - Send test email",
      "GET  /api/search?q=   - Search papers & repos"
    ]
  });
});

// ── Scheduler ─────────────────────────────────────────────────────────────────
// Runs every Monday at 8:00 AM
cron.schedule("0 8 * * 1", async () => {
  console.log("[Scheduler] Weekly digest triggered (Monday 8AM)");
  await runFullPipeline({ skipEmail: false });
}, { timezone: "Asia/Kolkata" });

// Daily silent scan at 2 AM (no email, just refresh data)
cron.schedule("0 2 * * *", async () => {
  console.log("[Scheduler] Daily silent scan triggered");
  await runFullPipeline({ skipEmail: true });
}, { timezone: "Asia/Kolkata" });

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║       OPENSCHOLAR AI - BACKEND         ║`);
  console.log(`║       Team SCAM*€₹$ · MS RIT           ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API docs at http://localhost:${PORT}/`);
  console.log(`\n📅 Scheduler: Weekly digest every Monday 8AM IST`);
  console.log(`📅 Scheduler: Daily scan every day 2AM IST\n`);

  // Check config
  if (!process.env.ANTHROPIC_API_KEY) console.warn("⚠️  ANTHROPIC_API_KEY not set in .env");
  if (!process.env.EMAIL_USER) console.warn("⚠️  EMAIL_USER not set in .env");
  if (!process.env.RECIPIENT_EMAILS) console.warn("⚠️  RECIPIENT_EMAILS not set in .env");
});

module.exports = app;
 
 
 
