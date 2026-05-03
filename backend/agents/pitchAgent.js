// ============================================
// PITCH AGENT
// Generates pitch content, PPT outline and
// demo script for a given project idea
// ============================================

const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePitch(idea) {
  try {
    const prompt = `You are a world-class startup pitch coach and hackathon winner. Generate a complete pitch package for this project idea.

Project: ${idea.name}
Problem: ${idea.problem}
Solution: ${idea.solution}
Target Users: ${idea.targetUsers}
Tech Stack: ${(idea.techStack || []).join(", ")}
MVP Features: ${(idea.mvpFeatures || []).join(", ")}
Impact Score: ${idea.impactScore}/10

Return ONLY valid JSON (no markdown):
{
  "elevatorPitch": "A compelling 3-sentence elevator pitch that hooks judges immediately",
  "oneLiner": "Single power sentence — the tweet-length pitch",
  "problemStatement": "Vivid, emotional description of the problem (2-3 sentences)",
  "solutionStatement": "Clear explanation of how the product solves it (2-3 sentences)",
  "marketSize": "Estimated market opportunity with a specific number",
  "whyNow": "Why this idea is perfectly timed for today's market (2 sentences)",
  "competitiveAdvantage": "What makes this uniquely better than alternatives",
  "demoScript": [
    "Step 1: Open the dashboard and show...",
    "Step 2: Click generate and demonstrate...",
    "Step 3: Show the result and explain...",
    "Step 4: Reveal the key wow feature..."
  ],
  "pptOutline": [
    {"slide": 1, "title": "Problem", "content": "Key point for this slide"},
    {"slide": 2, "title": "Solution", "content": "Key point for this slide"},
    {"slide": 3, "title": "Demo", "content": "Key point for this slide"},
    {"slide": 4, "title": "Tech Stack", "content": "Key point for this slide"},
    {"slide": 5, "title": "Market & Impact", "content": "Key point for this slide"},
    {"slide": 6, "title": "Team & Ask", "content": "Key point for this slide"}
  ],
  "judgesHook": "The one thing that will make judges remember this project",
  "callToAction": "What you want judges / investors to do after the pitch"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const pitch = JSON.parse(cleaned);

    console.log(`[PitchAgent] Generated pitch for: ${idea.name}`);
    return { success: true, pitch };
  } catch (err) {
    console.error("[PitchAgent] Error generating pitch:", err.message);
    return {
      success: false,
      error: err.message,
      pitch: {
        elevatorPitch: `${idea.name} solves ${idea.problem} by leveraging AI to ${idea.solution}`,
        oneLiner: idea.pitchLine || `${idea.name} — built for ${idea.targetUsers}`,
        problemStatement: idea.problem,
        solutionStatement: idea.solution,
        marketSize: "Large and growing market",
        whyNow: "AI capabilities have reached the point where this is now feasible and impactful.",
        competitiveAdvantage: idea.uniqueAngle || "AI-first approach with superior UX",
        demoScript: ["Open the app", "Show the main feature", "Demonstrate AI output", "Show impact metrics"],
        pptOutline: [
          { slide: 1, title: "Problem", content: idea.problem },
          { slide: 2, title: "Solution", content: idea.solution },
          { slide: 3, title: "Demo", content: "Live demonstration" },
          { slide: 4, title: "Tech Stack", content: (idea.techStack || []).join(", ") },
          { slide: 5, title: "Impact", content: `Score: ${idea.impactScore}/10` },
          { slide: 6, title: "Team", content: "Our team and next steps" }
        ],
        judgesHook: idea.pitchLine || "Remember us for our practical AI innovation",
        callToAction: "Try the live demo at our booth"
      }
    };
  }
}

module.exports = { generatePitch };
