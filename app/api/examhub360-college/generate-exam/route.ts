export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';



export async function POST(req: Request) {
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {});
  try {
    const { subject, course, state, questionsText, questionsImages, patternText, patternImages, includeCompetitive, includeExercise, includeNCERT, questionCount, promptOverride } = await req.json();

    if (!subject) {
      return NextResponse.json({ success: false, error: "Subject is required" }, { status: 400 });
    }

    let instructionBase = `You are an expert exam setter and educator for 2026-2027 competitive and school exams.
Your task is to generate highly relevant practice questions and detailed answers based on the provided course, state, subject, previous questions, and target patterns.
Course: ${course || "Unknown"}
State: ${state || "Not state-specific"}
Generate EXACTLY ${questionCount || 50} questions. `;

    let mix = [];
    if (includeCompetitive) mix.push("competitive exam style questions");
    if (includeExercise) mix.push("standard curriculum exercise questions");
    if (includeNCERT) mix.push("NCERT textual questions and answers");

    if (mix.length > 0) {
      instructionBase += `Include a mix of: ${mix.join(", ")}. `;
    }

    let systemInstruction = instructionBase + `
Analyze the provided previous questions to understand the baseline, and analyze the provided pattern to understand the structure, difficulty, and format required.
Output a JSON array of objects, where each object has a 'question', 'options' (array of strings, if applicable, otherwise empty), 'answer', and 'explanation'.`;

    if (promptOverride) {
        systemInstruction += `\nADDITIONAL CUSTOM INSTRUCTIONS:\n${promptOverride}`;
    }

    systemInstruction += `\nCRITICAL JSON INSTRUCTION FOR MATH/SCIENCE: If you generate LaTeX equations, you MUST strictly double-escape all backslashes inside your JSON strings so that the output remains valid JSON (e.g. use \\\\frac{1}{2} instead of \\frac{1}{2}, and \\\\sqrt instead of \\sqrt). Failure to double-escape will cause fatal JSON parsing errors!`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "answer", "explanation"]
      }
    };

    const promptParts: any[] = [];
    promptParts.push(`Course: ${course || "Unknown"}\nState: ${state || "Not state-specific"}\nSubject: ${subject}\n`);

    if (questionsText) {
      promptParts.push(`Previous Questions:\n${questionsText}\n`);
    }

    if (questionsImages && questionsImages.length > 0) {
      promptParts.push("Images of Previous Questions:");
      for (const img of questionsImages) {
        promptParts.push({
          inlineData: {
            data: img.image_base64.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: img.mime_type || "image/jpeg"
          }
        });
      }
    }

    if (patternText) {
      promptParts.push(`\n2026-2027 Exam Pattern & Guidelines:\n${patternText}\n`);
    }

    if (patternImages && patternImages.length > 0) {
      promptParts.push("Images of Exam Pattern:");
      for (const img of patternImages) {
        promptParts.push({
          inlineData: {
            data: img.image_base64.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: img.mime_type || "image/jpeg"
          }
        });
      }
    }

    promptParts.push(`\nPlease generate the new practice questions and answers matching the 2026-2027 pattern requirements.`);

    let response;
    const generateConfig = {
      model: 'gemini-2.5-flash',
      contents: promptParts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    };

    response = await generateContentWithRetry(generateConfig);

    let output = response.text || "";
    output = output.trim();
    if (output.startsWith("```json")) {
      output = output.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (output.startsWith("```")) {
      output = output.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    let data = null;
    try {
      data = JSON.parse(output);
      if (!Array.isArray(data)) {
        throw new Error("Expected an array");
      }
    } catch (e) {
      console.error("Failed to parse JSON from AI", output);
      return NextResponse.json({ success: false, error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating exam prep:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
