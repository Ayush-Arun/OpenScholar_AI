// ============================================
// REPORT AGENT
// Generates beautiful HTML email digest
// ============================================

function generateEmailHTML(digestData) {
  const { papers = [], repos = [], trends = {}, generatedAt } = digestData;
  const date = new Date(generatedAt || Date.now()).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const topPapers = papers.slice(0, 5);
  const topRepos = repos.slice(0, 5);
  const trendsList = trends.topTrends?.slice(0, 5) || [];
  const keywords = trends.hotKeywords?.slice(0, 8) || [];

  const labelColors = {
    "Should Build": "#22c55e",
    "Should Learn": "#3b82f6",
    "Should Watch": "#f59e0b",
    "Should Ignore": "#6b7280"
  };

  const scoreBar = (score) => {
    const pct = Math.min(100, Math.max(0, score));
    const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
    return `<div style="background:#1e1e2e;border-radius:4px;height:6px;width:100%;margin-top:4px;">
      <div style="background:${color};height:6px;border-radius:4px;width:${pct}%;"></div>
    </div>`;
  };

  const papersHTML = topPapers.map((p, i) => `
    <div style="background:#16161f;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <span style="background:#1e1e2e;color:#8b5cf6;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:1px;">#${i + 1} ${p.researchArea || "AI"}</span>
        <span style="background:${labelColors[p.actionLabel] || "#6b7280"}22;color:${labelColors[p.actionLabel] || "#6b7280"};border:1px solid ${labelColors[p.actionLabel] || "#6b7280"}44;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">${p.actionLabel || "Should Watch"}</span>
      </div>
      <h3 style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 8px;line-height:1.4;">${p.title}</h3>
      <p style="color:#94a3b8;font-size:12px;margin:0 0 10px;">${(p.authors || []).slice(0, 3).join(", ")}${p.authors?.length > 3 ? " et al." : ""}</p>
      <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 14px;">${p.tldr || p.abstract?.slice(0, 200) || ""}</p>
      ${p.keyContributions?.length ? `
        <div style="margin-bottom:12px;">
          ${p.keyContributions.slice(0, 2).map(k => `
            <div style="display:flex;align-items:flex-start;margin-bottom:4px;">
              <span style="color:#8b5cf6;margin-right:8px;font-size:14px;">→</span>
              <span style="color:#94a3b8;font-size:12px;">${k}</span>
            </div>`).join("")}
        </div>` : ""}
      <div style="display:flex;gap:16px;margin-bottom:12px;">
        <div style="flex:1;">
          <span style="color:#64748b;font-size:11px;">NOVELTY</span>
          ${scoreBar(p.noveltyScore || 50)}
        </div>
        <div style="flex:1;">
          <span style="color:#64748b;font-size:11px;">PRACTICALITY</span>
          ${scoreBar(p.practicalityScore || 50)}
        </div>
        <div style="flex:1;">
          <span style="color:#64748b;font-size:11px;">OVERALL</span>
          ${scoreBar(p.overallScore || 50)}
        </div>
      </div>
      <a href="${p.arxivUrl || "#"}" style="background:#8b5cf622;color:#8b5cf6;border:1px solid #8b5cf644;font-size:12px;font-weight:600;padding:8px 16px;border-radius:8px;text-decoration:none;display:inline-block;">Read Paper →</a>
    </div>`).join("");

  const reposHTML = topRepos.map((r, i) => `
    <div style="background:#16161f;border:1px solid #2a2a3e;border-radius:12px;padding:18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#f1f5f9;font-size:14px;font-weight:700;">${r.name}</span>
        <span style="background:${labelColors[r.usabilityLabel] || "#6b7280"}22;color:${labelColors[r.usabilityLabel] || "#6b7280"};border:1px solid ${labelColors[r.usabilityLabel] || "#6b7280"}44;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${r.usabilityLabel || "Should Watch"}</span>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:0 0 10px;">${r.quickSummary || r.description || ""}</p>
      <div style="display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="color:#f59e0b;font-size:12px;">⭐ ${(r.stars || 0).toLocaleString()}</span>
        <span style="color:#64748b;font-size:12px;">🍴 ${(r.forks || 0).toLocaleString()}</span>
        <span style="color:#8b5cf6;font-size:12px;">💻 ${r.language || "Unknown"}</span>
        <span style="color:#22c55e;font-size:12px;">🔧 ${r.buildDifficulty || "Medium"}</span>
      </div>
      <a href="${r.url || "#"}" style="background:#8b5cf622;color:#8b5cf6;border:1px solid #8b5cf644;font-size:12px;font-weight:600;padding:6px 14px;border-radius:8px;text-decoration:none;display:inline-block;">View Repo →</a>
    </div>`).join("");

  const trendsHTML = trendsList.map(t => `
    <div style="background:#16161f;border:1px solid #2a2a3e;border-radius:10px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">${t.emoji || "📈"}</span>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="color:#f1f5f9;font-size:13px;font-weight:700;">${t.trend}</span>
          <span style="color:#8b5cf6;font-size:12px;font-weight:700;">${t.momentum}% momentum</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0;">${t.description}</p>
        ${scoreBar(t.momentum)}
      </div>
    </div>`).join("");

  const keywordsHTML = keywords.map(k => `
    <span style="background:#8b5cf622;color:#a78bfa;border:1px solid #8b5cf633;font-size:12px;padding:4px 12px;border-radius:20px;display:inline-block;margin:3px;">${k}</span>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>OpenScholar AI Weekly Digest</title></head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0533 0%,#0d0d1a 50%,#001a33 100%);border:1px solid #2a2a3e;border-radius:16px;padding:32px;margin-bottom:20px;text-align:center;">
      <div style="font-size:11px;letter-spacing:3px;color:#8b5cf6;font-weight:700;text-transform:uppercase;margin-bottom:8px;">WEEKLY DIGEST</div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0 0 4px;letter-spacing:-0.5px;">OpenScholar <span style="color:#8b5cf6;">AI</span></h1>
      <p style="color:#64748b;font-size:13px;margin:8px 0 0;">${date}</p>
      <div style="margin-top:20px;display:flex;justify-content:center;gap:24px;">
        <div style="text-align:center;">
          <div style="color:#8b5cf6;font-size:22px;font-weight:900;">${papers.length}</div>
          <div style="color:#64748b;font-size:11px;letter-spacing:1px;">PAPERS</div>
        </div>
        <div style="width:1px;background:#2a2a3e;"></div>
        <div style="text-align:center;">
          <div style="color:#22c55e;font-size:22px;font-weight:900;">${repos.length}</div>
          <div style="color:#64748b;font-size:11px;letter-spacing:1px;">REPOS</div>
        </div>
        <div style="width:1px;background:#2a2a3e;"></div>
        <div style="text-align:center;">
          <div style="color:#f59e0b;font-size:22px;font-weight:900;">${trendsList.length}</div>
          <div style="color:#64748b;font-size:11px;letter-spacing:1px;">TRENDS</div>
        </div>
      </div>
    </div>

    <!-- Executive Summary -->
    ${trends.weekSummary ? `
    <div style="background:#0f172a;border-left:3px solid #8b5cf6;border-radius:8px;padding:18px;margin-bottom:20px;">
      <div style="color:#8b5cf6;font-size:11px;font-weight:700;letter-spacing:2px;margin-bottom:8px;">EXECUTIVE SUMMARY</div>
      <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">${trends.weekSummary}</p>
    </div>` : ""}

    <!-- Hot Keywords -->
    ${keywords.length ? `
    <div style="margin-bottom:20px;">
      <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:2px;margin-bottom:10px;">🔥 HOT KEYWORDS THIS WEEK</div>
      <div>${keywordsHTML}</div>
    </div>` : ""}

    <!-- Top Papers -->
    <div style="margin-bottom:24px;">
      <h2 style="color:#f1f5f9;font-size:16px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">📄 Top Research Papers</h2>
      ${papersHTML || "<p style='color:#64748b;'>No papers this week.</p>"}
    </div>

    <!-- Top Repos -->
    <div style="margin-bottom:24px;">
      <h2 style="color:#f1f5f9;font-size:16px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">💻 Top GitHub Repositories</h2>
      ${reposHTML || "<p style='color:#64748b;'>No repos this week.</p>"}
    </div>

    <!-- Trend Radar -->
    ${trendsList.length ? `
    <div style="margin-bottom:24px;">
      <h2 style="color:#f1f5f9;font-size:16px;font-weight:800;margin:0 0 14px;letter-spacing:-0.3px;">📡 Trend Radar</h2>
      ${trendsHTML}
    </div>` : ""}

    <!-- Footer -->
    <div style="text-align:center;padding:20px;border-top:1px solid #1e1e2e;margin-top:10px;">
      <p style="color:#475569;font-size:12px;margin:0;">OpenScholar AI by Team SCAM*€₹$ · MS Ramaiah Institute of Technology</p>
      <p style="color:#334155;font-size:11px;margin:6px 0 0;">Powered by Claude AI · Papers from ArXiv · Repos from GitHub</p>
    </div>
  </div>
</body>
</html>`;
}

function generatePlainText(digestData) {
  const { papers = [], repos = [], trends = {} } = digestData;
  let text = `OPENSCHOLAR AI - WEEKLY DIGEST\n${"=".repeat(50)}\n\n`;

  if (trends.weekSummary) {
    text += `EXECUTIVE SUMMARY\n${trends.weekSummary}\n\n`;
  }

  text += `TOP PAPERS\n${"-".repeat(30)}\n`;
  papers.slice(0, 5).forEach((p, i) => {
    text += `${i + 1}. ${p.title}\n`;
    text += `   [${p.actionLabel}] Score: ${p.overallScore}/100\n`;
    text += `   ${p.tldr}\n`;
    text += `   ${p.arxivUrl}\n\n`;
  });

  text += `TOP REPOS\n${"-".repeat(30)}\n`;
  repos.slice(0, 5).forEach((r, i) => {
    text += `${i + 1}. ${r.name} (⭐${r.stars})\n`;
    text += `   [${r.usabilityLabel}] ${r.quickSummary}\n`;
    text += `   ${r.url}\n\n`;
  });

  return text;
}

module.exports = { generateEmailHTML, generatePlainText };
