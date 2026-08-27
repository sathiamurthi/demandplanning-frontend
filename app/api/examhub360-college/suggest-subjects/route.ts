export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';

const ai = new GoogleGenAI();

export async function POST(req: Request) {
  try {
    const { collegeSemester, collegeDegree } = await req.json();

    if (!collegeSemester || !collegeDegree) {
      return NextResponse.json({ success: false, error: "Class and collegeDegree are required" }, { status: 400 });
    }

    const systemInstruction = `You are an expert curriculum analyzer.
Your task is to provide a complete list of typical school subjects for a given Board and Class level.
Only return a JSON array of strings containing the subject names. Ensure it includes core subjects and common electives. Keep subject names standard (e.g. "Mathematics", "Physics", "History").`;

    const schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of subject names"
    };

    const promptParts = [`List the subjects for:\nSemester: ${collegeSemester}\nDegree: ${collegeDegree}`];

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
    console.error("Error generating subjects:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
