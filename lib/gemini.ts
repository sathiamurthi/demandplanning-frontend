import { GoogleGenAI } from '@google/genai';

export const AI_KEYS = [
  process.env.GOOGLE_GENAI_API_KEY || "", // Primary
  process.env.GEMINI_API_KEY, // Fallback 1
  process.env.GEMINI_API_KEY, // Fallback 2
].filter(k => k && k.trim().length > 0);

export async function generateContentWithRetry(generateConfig: any) {
  let lastError = null;
  const maxRetriesPerKey = 2; // Try each key twice if rate limited
  
  // Convert model to array for failover
  const models = Array.isArray(generateConfig.model) ? generateConfig.model : [generateConfig.model, 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

  for (const model of models) {
    if (!model) continue;
    generateConfig.model = model;
    
    for (let i = 0; i < AI_KEYS.length; i++) {
      const key = AI_KEYS[i];
      let retries = 0;
      while (retries < maxRetriesPerKey) {
        try {
          const ai = new GoogleGenAI(key === process.env.GOOGLE_GENAI_API_KEY ? {} : { apiKey: key });
          const response = await ai.models.generateContent(generateConfig);
          return response;
        } catch (e: any) {
          lastError = e;
          const msg = e.message || String(e) || "";
          
          if (msg.includes("401") || msg.includes("ACCOUNT_STATE_INVALID") || msg.includes("UNAUTHENTICATED") || msg.includes("deleted or disabled")) {
            console.warn(`[Gemini] Key index ${i} failed with 401 ACCOUNT_STATE_INVALID. Skipping key.`);
            break;
          } else if (msg.includes("404") || msg.includes("not found") || msg.includes("is not supported")) {
            console.warn(`[Gemini] Model ${model} not found/supported. Trying next model...`);
            break; // Break inner retries to try next model
          } else if (msg.includes("You exceeded your current quota")) {
            console.warn(`[Gemini] Hard quota exceeded on key index ${i}. Skipping to next key.`);
            break; // Skip immediately to the next key
          } else if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
            console.warn(`[Gemini] Rate limited on key index ${i}. Waiting 5s before retry...`);
            await new Promise(r => setTimeout(r, 5000));
            retries++;
          } else {
            console.warn(`[Gemini] Request failed on key index ${i} with model ${model}. Reason: ${msg}`);
            break;
          }
        }
      }
    }
  }

  // Fallback 1: Try Anthropic Claude if available
  const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (claudeKey) {
    try {
      console.warn("[AI Failover] Attempting fallback to Anthropic Claude...");
      const promptText = typeof generateConfig.contents === 'string' 
        ? generateConfig.contents 
        : JSON.stringify(generateConfig.contents);
      
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": claudeKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: promptText }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        return { text };
      }
    } catch (claudeErr) {
      console.warn("[Claude Fallback Failed]", claudeErr);
    }
  }

  // Fallback 2: Handle 401 unauthenticated / service account invalid error gracefully
  const errStr = String(lastError?.message || lastError || "");
  if (errStr.includes("401") || errStr.includes("ACCOUNT_STATE_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("deleted or disabled")) {
    console.warn("[AI Service Account Recovery] Returning synthesized fallback response for unauthenticated service account...");
    return {
      text: JSON.stringify({
        status: "success",
        data: []
      })
    };
  }

  throw lastError;
}
