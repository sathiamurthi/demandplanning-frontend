export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';



export async function POST(req: Request) {
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {});
  try {
    const { images, text, class_level, board, subject } = await req.json();

    if (!images?.length && !text && (!class_level || !board || !subject)) {
      return NextResponse.json({ success: false, error: "Class, board, and subject are required if no syllabus document is provided" }, { status: 400 });
    }

    const systemInstruction = `You are an expert curriculum analyzer.
Your task is to provide a complete list of chapters.
If the user provides syllabus/index images or text, extract the chapters exactly as they appear in the source. You do not need to know the subject or class if it is not provided.
If no source is provided, use your internal knowledge to provide the standard curriculum chapters for the specified board, class, and subject.
Only return a JSON array of strings containing the chapter names in chronological order.`;

    const schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of chapter names"
    };

    const promptParts: any[] = [];
    promptParts.push(`List the chapters for:\nClass: ${class_level}\nBoard: ${board}\nSubject: ${subject}`);

    if (text) {
      promptParts.push(`\nSource Material (Syllabus/Index):\n${text}`);
    }

    if (images && images.length > 0) {
      for (const img of images) {
        promptParts.push({
          inlineData: {
            data: img.image_base64.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: img.mime_type || "image/jpeg"
          }
        });
      }
    }

    const fallbackAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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
    console.error("Error generating chapters:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
