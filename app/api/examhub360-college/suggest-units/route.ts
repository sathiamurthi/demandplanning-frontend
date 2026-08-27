export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';



export async function POST(req: Request) {
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {});
  try {
    const { images, text, collegeSemester, collegeDegree, subject } = await req.json();

    if (!images?.length && !text && (!collegeSemester || !collegeDegree || !subject)) {
      return NextResponse.json({ success: false, error: "Class, collegeDegree, and subject are required if no syllabus document is provided" }, { status: 400 });
    }

    const systemInstruction = `You are an expert curriculum analyzer.
Your task is to provide a complete list of units.
If the user provides syllabus/index images or text, extract the units exactly as they appear in the source. You do not need to know the subject or class if it is not provided.
If no source is provided, use your internal knowledge to provide the standard curriculum units for the specified collegeDegree, class, and subject.
Only return a JSON array of strings containing the unit names in chronological order.`;

    const schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of unit names"
    };

    const promptParts: any[] = [];
    promptParts.push(`List the units for:\nSemester: ${collegeSemester}\nDegree: ${collegeDegree}\nSubject: ${subject}`);

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
    console.error("Error generating units:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
