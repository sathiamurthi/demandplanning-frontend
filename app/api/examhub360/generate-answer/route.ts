import { NextResponse } from "next/server";
import { generateContentWithRetry } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { question, chapter_name, subject, class_level, target_language, chunkType, board } = body;

        let systemInstruction = `You are an expert AI teacher generating an answer for a single question.
Class: ${class_level || "Unknown"}
Board: ${board || "Unknown"}
Subject: ${subject || "Unknown"}
Chapter: ${chapter_name || "Unknown"}

Provide a highly detailed, step-by-step, accurate answer to the following question. If it involves math or science, explain the steps clearly.
IMPORTANT: Format any math or formulas using valid Markdown/LaTeX.`;

        if (target_language) {
            systemInstruction += `\nCRITICAL: You MUST provide the explanation in ${target_language}.`;
        }
        
        if (chunkType === "ncert") {
            systemInstruction += `\nThis is an NCERT / Textual question. Provide the standard accepted textbook answer expected in exams.`;
        } else if (chunkType === "exercise") {
            systemInstruction += `\nThis is a textbook exercise question. Provide the standard accepted answer.`;
        } else if (chunkType === "competency") {
            systemInstruction += `\nThis is a competency-based/HOTS question. Focus on logical reasoning and application of concepts.`;
        } else if (chunkType === "custom_qna") {
             systemInstruction += `\nAnswer this custom question accurately based on the syllabus.`;
        }

        const schema = {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING }
            },
            required: ["answer"]
        };

        const result = await generateContentWithRetry({
            contents: [question],
            model: ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2,
                maxOutputTokens: 4096
            }
        });

        const dataStr = result.text!.substring(result.text!.indexOf('{'), result.text!.lastIndexOf('}') + 1);
        const parsed = JSON.parse(dataStr);
        return NextResponse.json({ success: true, answer: parsed.answer });

    } catch (error: any) {
        console.error("Answer Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
