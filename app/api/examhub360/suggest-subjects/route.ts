export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI();

export async function POST(req: Request) {
  try {
    const { class_level, board } = await req.json();

    if (!class_level || !board) {
      return NextResponse.json({ success: false, error: "Class and board are required" }, { status: 400 });
    }

    const systemInstruction = `You are an expert curriculum analyzer.
Your task is to provide a complete list of typical school subjects for a given Board and Class level.
Only return a JSON array of strings containing the subject names. Ensure it includes core subjects and common electives. Keep subject names standard (e.g. "Mathematics", "Physics", "History").`;

    const schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of subject names"
    };

    const promptParts = [`List the subjects for:\nClass: ${class_level}\nBoard: ${board}`];

    const fallbackAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let response;
    const generateConfig = {
      model: 'gemini-3.6-flash',
      contents: promptParts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    };

    try {
      response = await ai.models.generateContent(generateConfig);
    } catch (e: any) {
      console.warn("Primary AI failed, trying fallback key...", e.message);
      response = await fallbackAi.models.generateContent(generateConfig);
    }

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
    console.error("Error generating subjects:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
