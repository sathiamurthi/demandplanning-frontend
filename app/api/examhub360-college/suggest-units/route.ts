export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';



function getStandardUnits(subject: string): string[] {
  const subjLower = (subject || "").toLowerCase();
  if (subjLower.includes("math") || subjLower.includes("calculus") || subjLower.includes("algebra")) {
    return [
      "Unit I: Differential Calculus & Applications",
      "Unit II: Integral Calculus & Improper Integrals",
      "Unit III: Vector Calculus & Field Theorems",
      "Unit IV: Ordinary & Partial Differential Equations",
      "Unit V: Laplace Transforms & Fourier Analysis"
    ];
  }
  return [
    "Unit I: Fundamental Concepts & Theoretical Foundations",
    "Unit II: Analytical Methods & Problem Formulation",
    "Unit III: System Modeling & Performance Analysis",
    "Unit IV: Advanced Applications & Case Studies",
    "Unit V: Emerging Trends & Future Scope"
  ];
}

export async function POST(req: Request) {
  try {
    const { images, text, collegeSemester, collegeDegree, subject, state } = await req.json();

    if (!images?.length && !text && (!collegeSemester || !collegeDegree || !subject)) {
      return NextResponse.json({ success: false, error: "Class, collegeDegree, and subject are required if no syllabus document is provided" }, { status: 400 });
    }

    const systemInstruction = `You are an expert curriculum analyzer.
Your task is to provide a complete list of units for the selected degree, semester, subject, and state.
If the user provides syllabus/index images or text, extract the units exactly as they appear in the source. You do not need to know the subject or class if it is not provided.
If no source is provided, use your internal knowledge to provide the standard curriculum units for the specified collegeDegree, class, and subject.
Only return a JSON array of strings containing the unit names in chronological order.`;

    const schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of unit names"
    };

    const promptParts: any[] = [];
    promptParts.push(`List the units for:\nState: ${state || "Not state-specific"}\nSemester: ${collegeSemester || "Semester 1"}\nDegree/Course: ${collegeDegree || "B.Tech"}\nSubject: ${subject || "Mathematics"}`);

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

    const generateConfig = {
      model: ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'],
      contents: promptParts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    };

    let data: string[] = [];
    try {
      const response = await generateContentWithRetry(generateConfig);
      let output = (response.text || "").trim();
      
      let cleaned = output.replace(/```json/gi, "").replace(/```/g, "").trim();
      const firstBracket = cleaned.indexOf("[");
      const lastBracket = cleaned.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        data = parsed;
      } else if (typeof parsed === "object" && Array.isArray((parsed as any).units)) {
        data = (parsed as any).units;
      } else if (typeof parsed === "object" && Array.isArray((parsed as any).data)) {
        data = (parsed as any).data;
      }
    } catch (e) {
      console.warn("[suggest-units] AI parse error, using standard fallback unit list");
    }

    if (!data || data.length === 0) {
      data = getStandardUnits(subject);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating units:", error);
    const fallbackData = getStandardUnits("Mathematics");
    return NextResponse.json({ success: true, data: fallbackData });
  }
}
