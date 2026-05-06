const OpenAI = require("openai");
const Anthropic = require("@anthropic-ai/sdk");
const { HfInference } = require("@huggingface/inference");

// Lazy initialization or null check to avoid crashing if keys are missing
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

let hf = null;
if (process.env.HUGGINGFACE_API_KEY) {
  hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
}

/**
 * Multi-API Fallback AI Router
 * @param {string} prompt - The user prompt
 * @param {Object} options - { useJson: boolean, system: string }
 */
async function generateAIResponse(prompt, options = {}) {
  const { useJson = false, system = "You are a helpful research assistant." } = options;

  // 1. Try OpenAI
  try {
    if (!openai) throw new Error("OpenAI client not initialized (missing API key)");
    console.log("[AI Router] Using OpenAI");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      response_format: useJson ? { type: "json_object" } : undefined,
      max_tokens: 2000
    });
    return response.choices[0]?.message?.content || "";
  } catch (err) {
    console.warn("[AI Router] OpenAI failed, switching to Claude:", err.message);
  }

  // 2. Try Claude
  try {
    if (!anthropic) throw new Error("Claude client not initialized (missing API key)");
    console.log("[AI Router] Using Claude");
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: system,
      messages: [{ role: "user", content: prompt }]
    });
    return response.content[0].text;
  } catch (err) {
    console.warn("[AI Router] Claude failed, switching to HuggingFace:", err.message);
  }

  // 3. Try HuggingFace
  try {
    if (!hf) throw new Error("HuggingFace client not initialized (missing API key)");
    console.log("[AI Router] Using HuggingFace");
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: `<s>[INST] ${system}\n\n${prompt} [/INST]`,
      parameters: {
        max_new_tokens: 1500,
        return_full_text: false
      }
    });
    return response.generated_text;
  } catch (err) {
    console.warn("[AI Router] HuggingFace failed:", err.message);
  }

  // 4. Final Fallback
  return useJson 
    ? JSON.stringify({ error: "AI services are temporarily unavailable. Showing basic results." })
    : "AI services are temporarily unavailable. Showing basic results.";
}

module.exports = { generateAIResponse };
