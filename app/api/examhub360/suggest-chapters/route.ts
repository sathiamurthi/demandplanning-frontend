export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';



function getStandardChapters(subj: string, cls: string): string[] {
  const subjectLower = (subj || "").toLowerCase();
  const isClass12 = (cls || "").includes("12");

  if (subjectLower.includes("math")) {
    return isClass12
      ? [
          "Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants",
          "Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals",
          "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"
        ]
      : [
          "Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations",
          "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry",
          "Some Applications of Trigonometry", "Circles", "Areas Related to Circles", "Surface Areas and Volumes",
          "Statistics", "Probability"
        ];
  }

  if (subjectLower.includes("physic")) {
    return [
      "Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity",
      "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction",
      "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments",
      "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"
    ];
  }

  if (subjectLower.includes("chemist")) {
    return [
      "Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements",
      "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"
    ];
  }

  return [
    "Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals",
    "Carbon and its Compounds", "Life Processes", "Control and Coordination",
    "How do Organisms Reproduce?", "Heredity", "Light - Reflection and Refraction",
    "The Human Eye and the Colorful World", "Electricity", "Magnetic Effects of Electric Current", "Our Environment"
  ];
}

export async function POST(req: Request) {
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
    promptParts.push(`List the chapters for:\nClass: ${class_level || "Class 10"}\nBoard: ${board || "CBSE"}\nSubject: ${subject || "Mathematics"}`);

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
      } else if (typeof parsed === "object" && Array.isArray((parsed as any).chapters)) {
        data = (parsed as any).chapters;
      } else if (typeof parsed === "object" && Array.isArray((parsed as any).data)) {
        data = (parsed as any).data;
      }
    } catch (e) {
      console.warn("[suggest-chapters] AI parse error, using standard fallback curriculum list");
    }

    if (!data || data.length === 0) {
      data = getStandardChapters(subject, class_level);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating chapters:", error);
    const fallbackData = getStandardChapters("Mathematics", "Class 10");
    return NextResponse.json({ success: true, data: fallbackData });
  }
}
