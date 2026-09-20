export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';

export async function POST(req: Request) {
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {});
  try {
    const { 
      images, text, class_level, board, subject, chapter_name, target_language,
      includeCompetitive, includeExercise, includeNCERT, questionCount, promptOverride, chunkType, customQuestions
    } = await req.json();

    const qCount = Math.min(questionCount || 15, 200);
    const mode = chunkType || "all";
    
    let systemInstruction = `You are an expert CBSE/School Educational curriculum analyzer, examiner, and master study pack creator.
Your task is to generate a comprehensive Universal Master Study Pack following the official 8-Section Master Template:
1. Executive Summary & Conceptual Mind Map
2. Core Theorems, Formulae & Key Rules
3. Official Curriculum / Textbook Core Exercise Solutions
4. Top Past 10 Years Examination Questions (PYQs)
5. High-Probability Exam Predictions (2026–2027)
6. Multiple Choice Questions (MCQs) & Quiz Bank
7. Common Student Misconceptions & Exam Pitfalls
8. Class Test / Self-Assessment Exam Paper

Ensure the output is strictly structured as the provided JSON schema.`;

    if (target_language) {
        systemInstruction += `\nCRITICAL: The user has requested the explanation language to be ${target_language}. You MUST provide all explanations in ${target_language}. Questions and technical terms can remain in the original language.`;
    }
    if (promptOverride) {
        systemInstruction += `\nADDITIONAL CUSTOM INSTRUCTIONS:\n${promptOverride}`;
    }

    systemInstruction += `\nCRITICAL ARRAY INSTRUCTION: For any array of questions or items, EVERY distinct item MUST be a separate object in the JSON array.`;

    let properties: any = {};
    let required: string[] = [];

    if (mode === "core" || mode === "all") {
        properties.chapter_title = { type: Type.STRING };
        properties.subject = { type: Type.STRING };
        properties.course_grade_semester = { type: Type.STRING };
        properties.subject_code = { type: Type.STRING };
        properties.institution_or_board = { type: Type.STRING };
        properties.conceptual_mind_map = { type: Type.STRING, description: "ASCII / Markdown diagram illustrating the core concepts and subtopics." };
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
            properties: {
              term: { type: Type.STRING },
              meaning: { type: Type.STRING },
              formula: { type: Type.STRING },
              practical_context: { type: Type.STRING }
            }
          }
        };
        
        properties.formula_sheet = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              formula_name: { type: Type.STRING },
              equation: { type: Type.STRING },
              parameters_breakdown: { type: Type.STRING },
              key_rules: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
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
        
        properties.textbook_solutions = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              problem_title: { type: Type.STRING },
              question: { type: Type.STRING },
              step1_given_data: { type: Type.STRING },
              step2_execution: { type: Type.STRING },
              step3_final_answer: { type: Type.STRING }
            }
          }
        };

        properties.pyqs = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
              exam_year: { type: Type.STRING },
              marks: { type: Type.NUMBER },
              marking_scheme: {
                type: Type.OBJECT,
                properties: {
                  introduction_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                  derivation_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                  conclusion_diagram_result: { type: Type.STRING }
                }
              },
              solution: { type: Type.STRING }
            }
          }
        };

        properties.exam_predictions = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question_type: { type: Type.STRING },
              marks: { type: Type.NUMBER },
              question: { type: Type.STRING },
              solution_steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        };

        properties.mcq_quiz_bank = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { label: { type: Type.STRING }, text: { type: Type.STRING } }
                }
              },
              correct_option: { type: Type.STRING },
              explanation: { type: Type.STRING },
              is_assertion_reason: { type: Type.BOOLEAN },
              assertion: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        };

        properties.misconception_pitfalls = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { misconception: { type: Type.STRING }, correction: { type: Type.STRING } }
          }
        };

        properties.class_test_paper = {
          type: Type.OBJECT,
          properties: {
            test_title: { type: Type.STRING },
            max_marks: { type: Type.NUMBER },
            time_minutes: { type: Type.NUMBER },
            section_a_objective: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { q_no: { type: Type.NUMBER }, question: { type: Type.STRING }, marks: { type: Type.NUMBER } } }
            },
            section_b_analytical: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { q_no: { type: Type.NUMBER }, question: { type: Type.STRING }, marks: { type: Type.NUMBER } } }
            },
            section_c_comprehensive: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { q_no: { type: Type.NUMBER }, question: { type: Type.STRING }, marks: { type: Type.NUMBER } } }
            },
            answer_key_and_marking_scheme: { type: Type.STRING }
          }
        };

        properties.common_mistakes = { type: Type.ARRAY, items: { type: Type.STRING } };
        properties.practice_questions = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { question: { type: Type.STRING }, hint: { type: Type.STRING }, difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }, answer: { type: Type.STRING } }
          }
        };

        if (includeCompetitive !== false) {
            properties.competency_questions = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING }, competency_tested: { type: Type.STRING }, answer: { type: Type.STRING } }
              }
            };
        }

        if (includeExercise !== false) {
            properties.exercise_questions = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }
              }
            };
        }

        if (customQuestions) {
            properties.custom_qna = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }
              }
            };
        }
    }

    if (mode === "ncert" || mode === "all") {
        if (includeNCERT !== false) {
            properties.ncert_questions = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }
              }
            };
        }
    }

    const schema = {
      type: Type.OBJECT,
      properties,
      required: required.length > 0 ? required : undefined,
    };

    const promptParts: any[] = [];
    promptParts.push(`Generate Universal Master Study Pack materials for:\nClass: ${class_level}\nBoard: ${board}\nSubject: ${subject || "Unknown"}\nChapter: ${chapter_name || "Unknown"}`);

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

    const generateConfig = {
      model: 'gemini-2.5-flash',
      contents: promptParts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
        maxOutputTokens: 32768
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
        
        const firstBrace = output.indexOf('{');
        const lastBrace = output.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          output = output.substring(firstBrace, lastBrace + 1);
        }
        
        data = JSON.parse(output);
        break;
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
