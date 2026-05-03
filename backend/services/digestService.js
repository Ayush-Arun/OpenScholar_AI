// ============================================
// DIGEST ORCHESTRATOR
// Runs the full pipeline: Scout → Analyst → Ideas → Email
// ============================================

const { runScoutAgent } = require("../agents/scoutAgent");
const { runAnalystAgent } = require("../agents/analystAgent");
const { generateIdeas } = require("../agents/ideasAgent");
const { sendDigest } = require("./emailService");

// In-memory store for latest digest (replace with MongoDB in production)
let latestDigest = null;
let isRunning = false;
let lastRunAt = null;
let runHistory = [];

async function runFullPipeline(options = {}) {
  if (isRunning) {
    console.log("[Orchestrator] Pipeline already running, skipping...");
    return { skipped: true, reason: "Pipeline already running" };
  }

  isRunning = true;
  const startTime = Date.now();
  console.log("\n[Orchestrator] ====== PIPELINE START ======");

  try {
    // Step 1: Scout
    console.log("[Orchestrator] Step 1/3: Running Scout Agent...");
    const scoutData = await runScoutAgent();

    if (!scoutData.papers.length && !scoutData.repos.length) {
      throw new Error("Scout Agent returned no data");
    }

    // Step 2: Analyst
    console.log("[Orchestrator] Step 2/3: Running Analyst Agent...");
    const analysisData = await runAnalystAgent(scoutData);

    // Step 3: Ideas Generator
    console.log("[Orchestrator] Step 3/4: Running Ideas Agent...");
    let buildIdeas = [];
    try {
      buildIdeas = await generateIdeas(analysisData.papers, analysisData.repos);
    } catch (ideaErr) {
      console.warn("[Orchestrator] Ideas Agent skipped:", ideaErr.message);
    }

    // Step 4: Compile digest
    const digestData = {
      papers: analysisData.papers,
      repos: analysisData.repos,
      trends: analysisData.trends,
      models: scoutData.models || [],
      buildIdeas,
      generatedAt: new Date().toISOString(),
      stats: {
        papersScanned: scoutData.papers.length,
        papersAnalyzed: analysisData.papers.length,
        reposScanned: scoutData.repos.length,
        reposAnalyzed: analysisData.repos.length,
        ideasGenerated: buildIdeas.length,
        processingTimeMs: Date.now() - startTime
      }
    };

    latestDigest = digestData;
    lastRunAt = new Date().toISOString();

    // Step 5: Send email (unless test mode)
    if (!options.skipEmail) {
      console.log("[Orchestrator] Step 4/4: Sending email digest...");
      const emailResult = await sendDigest(digestData, options.recipients);
      digestData.emailResult = emailResult;
    } else {
      console.log("[Orchestrator] Step 4/4: Skipping email (test mode)");
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Orchestrator] ====== PIPELINE DONE in ${duration}s ======\n`);

    // Keep last 10 run records
    runHistory.unshift({
      runAt: lastRunAt,
      papers: digestData.stats.papersAnalyzed,
      repos: digestData.stats.reposAnalyzed,
      durationMs: Date.now() - startTime,
      success: true
    });
    if (runHistory.length > 10) runHistory.pop();

    return { success: true, digest: digestData, duration };
  } catch (err) {
    console.error("[Orchestrator] Pipeline error:", err.message);
    runHistory.unshift({ runAt: new Date().toISOString(), success: false, error: err.message });
    return { success: false, error: err.message };
  } finally {
    isRunning = false;
  }
}

function getStatus() {
  return {
    isRunning,
    lastRunAt,
    hasDigest: !!latestDigest,
    digestGeneratedAt: latestDigest?.generatedAt,
    stats: latestDigest?.stats || null,
    runHistory: runHistory.slice(0, 5)
  };
}

function getLatestDigest() {
  return latestDigest;
}

module.exports = { runFullPipeline, getStatus, getLatestDigest };
