import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { marks, subject, chapter, class_level } = await req.json();

    const prompt = `You are an expert academic counselor and tutor.\nA student in ${class_level} studying "${subject}" (specifically for the topic/chapter "${chapter}") has provided their recent test scores.\nMarks provided:\n${Object.entries(marks).map(([k, v]) => `${k}: ${v || 'N/A'}`).join('\n')}\n\nAnalyze their performance trend, identify potential areas of struggle based on typical patterns in this subject, and provide actionable, personalized study tips to help them improve.\n\nReturn the response STRICTLY as a JSON object with this exact structure:\n{\n  "analysis": "A 2-3 sentence analysis of their performance trend.",\n  "tips": [\n    "Actionable tip 1",\n    "Actionable tip 2",\n    "Actionable tip 3",\n    "Actionable tip 4"\n  ]\n}\n`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    let text = response.text || "";
    text = text.replace(/\n/g, "").trim();
    
    return NextResponse.json({ success: true, ...JSON.parse(text) });
  } catch (error: any) {
    console.error("Tips Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
