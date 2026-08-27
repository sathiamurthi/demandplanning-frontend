export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';

const ai = new GoogleGenAI();

export async function POST(req: Request) {
  try {
    const { 
      images, text, class_level, board, subject, chapter_name, target_language,
      includeCompetitive, includeExercise, includeNCERT, questionCount, promptOverride, chunkType, customQuestions
    } = await req.json();

    const qCount = Math.min(questionCount || 15, 15);
    const mode = chunkType || "all";
    
    let systemInstruction = `You are an expert CBSE/Educational curriculum analyzer and curriculum developer.
Your task is to analyze the provided syllabus/pattern images or text for a specific chapter and generate a partial study guide.

Ensure the output is strictly structured as the provided JSON schema.`;

    if (target_language) {
        systemInstruction += `\nCRITICAL: The user has requested the explanation language to be ${target_language}. You MUST provide all explanations in ${target_language}. Questions and technical terms can remain in the original language.`;
    }
    if (promptOverride) {
        systemInstruction += `\nADDITIONAL CUSTOM INSTRUCTIONS:\n${promptOverride}`;
    }

    // Removed double-escape instruction as responseSchema handles it automatically
    systemInstruction += `\nCRITICAL ARRAY INSTRUCTION: For any array of questions (e.g. competency, practice, exercise, ncert), DO NOT consolidate multiple questions and answers into a single string. EVERY distinct question MUST be a separate object in the JSON array.`;

    let properties: any = {};
    let required: string[] = [];

    if (mode === "core" || mode === "all") {
        systemInstruction += `\n\nFor this request, ONLY generate the Core Concepts, Key Terms, Study Plan, and Quick Reference.`;
        properties.chapter_title = { type: Type.STRING };
        properties.subject = { type: Type.STRING };
        properties.story_telling_explanation = { type: Type.STRING, description: "A creative, fun, story-like explanation of the chapter to get students hooked." };
        properties.core_concepts = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { concept: { type: Type.STRING }, simple_explanation: { type: Type.STRING }, why_it_matters: { type: Type.STRING } }
          }
        };
        properties.key_terms = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { term: { type: Type.STRING }, meaning: { type: Type.STRING } }
          }
        };
        properties.study_plan = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { step: { type: Type.NUMBER }, focus: { type: Type.STRING }, time_minutes: { type: Type.NUMBER }, activity: { type: Type.STRING } }
          }
        };
        properties.quick_reference = { type: Type.ARRAY, items: { type: Type.STRING } };
        required = ["chapter_title", "subject", "core_concepts", "key_terms", "study_plan", "quick_reference"];
    }

    if (mode === "questions" || mode === "all" || mode === "practice" || mode === "competency" || mode === "exercise" || mode === "custom_qna") {
        
        if (mode === "practice" || mode === "questions" || mode === "all") {
            systemInstruction += `\n\nFor this request, ONLY generate Practice Questions & Common Mistakes. DO NOT include core concepts.\nCRITICAL INSTRUCTION: Generate approx ${qCount} questions in total. Keep answers concise.`;
            properties.common_mistakes = { type: Type.ARRAY, items: { type: Type.STRING } };
            properties.practice_questions = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING }, hint: { type: Type.STRING }, difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] } }
              }
            };
            if (mode === "practice" || mode === "questions") required.push("common_mistakes", "practice_questions");
        }

        if ((mode === "competency" || mode === "questions" || mode === "all") && includeCompetitive !== false) {
            systemInstruction += `\n\nFor this request, ONLY generate Competency/Competitive Questions.\nCRITICAL INSTRUCTION: Generate approx ${qCount} questions.`;
            properties.competency_questions = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING }, competency_tested: { type: Type.STRING } }
              }
            };
            if (mode === "competency") required.push("competency_questions");
        }

        if ((mode === "exercise" || mode === "questions" || mode === "all") && includeExercise !== false) {
            systemInstruction += `\n\nFor this request, ONLY generate Exercise/Textbook Questions.\nCRITICAL INSTRUCTION: Generate approx ${qCount} questions.`;
            properties.exercise_questions = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING } }
              }
            };
            if (mode === "exercise") required.push("exercise_questions");
        }

        if ((mode === "custom_qna" || mode === "questions" || mode === "all") && customQuestions) {
            systemInstruction += `\nCRITICAL INSTRUCTION: The user has provided custom specific questions that they want explicitly answered. Extract them and include them in the 'custom_qna' property.`;
            properties.custom_qna = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING } }
              }
            };
            if (mode === "custom_qna") required.push("custom_qna");
        }
    }

    if (mode === "ncert" || mode === "all") {
        systemInstruction += `\n\nFor this request, ONLY extract NCERT / Textual Questions.`;
        if (includeNCERT !== false) {
            properties.ncert_questions = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING } }
              }
            };
            if (mode === "ncert") {
                required = ["ncert_questions"];
            }
        }
    }

    const schema = {
      type: Type.OBJECT,
      properties,
      required: required.length > 0 ? required : undefined,
    };

    const promptParts: any[] = [];
    promptParts.push(`Generate study materials for:\nClass: ${class_level}\nBoard: ${board}\nSubject: ${subject || "Unknown"}\nChapter: ${chapter_name || "Unknown"}`);

    if (text) {
      promptParts.push(`\nSource Material / Syllabus Text:\n${text}`);
    }
    
    if (customQuestions && (mode === "questions" || mode === "all")) {
      promptParts.push(`\nCUSTOM USER QUESTIONS TO ANSWER AND INCLUDE:\n${customQuestions}`);
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
      model: 'gemini-3.6-flash',
      contents: promptParts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7, // Lower temperature to reduce hallucination and malformed JSON
        maxOutputTokens: 32768 // Dramatically increased to prevent JSON truncation on math/equations
      }
    };
    let output = "";
    let data = null;
    let attempts = 0;
    let lastErrorMsg = "";

    while (attempts < 2) {
      attempts++;
      try {
        const response = await generateContentWithRetry(generateConfig);
        output = response.text || "";
        output = output.trim();
        
        // Bulletproof JSON extraction: find the first { and last }
        const firstBrace = output.indexOf('{');
        const lastBrace = output.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          output = output.substring(firstBrace, lastBrace + 1);
        }
        
        data = JSON.parse(output);
        break; // Successfully parsed!
      } catch (e: any) {
        console.error(`JSON parse failed on attempt ${attempts}`, e.message);
        lastErrorMsg = e.message;
      }
    }

    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: "AI returned invalid JSON: " + lastErrorMsg,
        raw_snippet: output.substring(0, 500) + "..." + output.substring(output.length - 500)
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating study guide:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
