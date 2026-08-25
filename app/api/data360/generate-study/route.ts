import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI();

export async function POST(req: Request) {
  try {
    const { images, text, class_level, board, subject, chapter_name, target_language } = await req.json();

    const systemInstruction = `You are an expert CBSE/Educational curriculum analyzer and curriculum developer.
Your task is to analyze the provided syllabus/pattern images or text for a specific chapter and generate a complete study guide.
The user is specifically asking for:
1. Core Concepts, Key Terms, and a Study Plan.
2. Competency-Based Questions (Analytical, Logical, Application-based) with step-by-step answers.
3. Exercise Questions (standard curriculum questions) with step-by-step answers.

${target_language ? `CRITICAL: The user has requested the explanation language to be ${target_language}. You MUST provide all explanations (story telling, simple explanations, why it matters, hints, meanings) in ${target_language}. Questions and technical terms can remain in the original language.` : ''}

Ensure the output is strictly structured as the provided JSON schema.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        chapter_title: { type: Type.STRING },
        subject: { type: Type.STRING },
        story_telling_explanation: { type: Type.STRING },
        core_concepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING },
              simple_explanation: { type: Type.STRING },
              why_it_matters: { type: Type.STRING }
            }
          }
        },
        key_terms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { term: { type: Type.STRING }, meaning: { type: Type.STRING } }
          }
        },
        study_plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.NUMBER },
              focus: { type: Type.STRING },
              time_minutes: { type: Type.NUMBER },
              activity: { type: Type.STRING }
            }
          }
        },
        quick_reference: { type: Type.ARRAY, items: { type: Type.STRING } },
        practice_questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              hint: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }
            }
          }
        },
        common_mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
        competency_questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              competency_tested: { type: Type.STRING }
            }
          }
        },
        exercise_questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            }
          }
        }
      },
      required: ["chapter_title", "subject", "core_concepts", "competency_questions", "exercise_questions"]
    };

    const promptParts: any[] = [];
    promptParts.push(`Generate a study guide for:\nClass: ${class_level}\nBoard: ${board}\nSubject: ${subject || "Unknown"}\nChapter: ${chapter_name || "Unknown"}`);

    if (text) {
      promptParts.push(`\nSource Material / Syllabus Text:\n${text}`);
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptParts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const output = response.text || "";
    let data = null;
    try {
      data = JSON.parse(output);
    } catch (e) {
      console.error("Failed to parse JSON from AI", output);
      return NextResponse.json({ success: false, error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating study guide:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
