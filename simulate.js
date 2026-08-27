const { GoogleGenAI, Type } = require('@google/genai');

const AI_KEYS = [
  process.env.GEMINI_API_KEY, // Fallback 1
  process.env.GEMINI_API_KEY, // Fallback 2
];

async function generateContentWithRetryLocal(generateConfig) {
  let lastError = null;
  const maxRetriesPerKey = 2; // Try each key twice if rate limited
  
  // Convert model to array for failover
  const models = Array.isArray(generateConfig.model) ? generateConfig.model : [generateConfig.model, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

  for (const model of models) {
    if (!model) continue;
    generateConfig.model = model;
    
    for (let i = 0; i < AI_KEYS.length; i++) {
      const key = AI_KEYS[i];
      let retries = 0;
      while (retries < maxRetriesPerKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: key });
          console.log(`Trying model: ${model} with key index ${i}`);
          const response = await ai.models.generateContent(generateConfig);
          return response;
        } catch (e) {
          lastError = e;
          const msg = e.message || String(e) || "";
          
          if (msg.includes("404") || msg.includes("not found") || msg.includes("is not supported")) {
            console.warn(`[Gemini] Model ${model} not found/supported. Trying next model...`);
            break; // Break inner retries to try next model
          } else if (msg.includes("You exceeded your current quota")) {
            console.warn(`[Gemini] Hard quota exceeded on key index ${i}. Skipping to next key.`);
            break; // Skip immediately to the next key
          } else if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
            console.warn(`[Gemini] Rate limited on key index ${i}. Waiting 5s before retry...`);
            await new Promise(r => setTimeout(r, 1000)); // fast wait for test
            retries++;
          } else {
            console.warn(`[Gemini] Request failed on key index ${i} with model ${model}. Reason: ${msg}`);
            break;
          }
        }
      }
      
      if (lastError && (lastError.message?.includes("404") || lastError.message?.includes("not found") || lastError.message?.includes("is not supported"))) {
        // Break out of the keys loop and try the next model in the fallback array immediately
        break;
      }
    }
  }
  
  throw lastError;
}

async function run() {
    const class_level = "X";
    const board = "CBSE";
    const subject = "Mathematics";
    const chapter_name = "Real Numbers";
    const qCount = 15;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        core_concepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { concept: { type: Type.STRING }, simple_explanation: { type: Type.STRING } }
          }
        }
      }
    };
    
    const generateConfig = {
      model: 'gemini-3.6-flash',
      contents: `Generate study materials for:\nClass: ${class_level}\nBoard: ${board}\nSubject: ${subject || "Unknown"}\nChapter: ${chapter_name || "Unknown"}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
        maxOutputTokens: 32768
      }
    };
    
    try {
        const response = await generateContentWithRetryLocal(generateConfig);
        console.log("Success!", response.text.substring(0, 100));
    } catch(e) {
        console.log("FAILED WITH ERROR:", e.message);
    }
}
run();
