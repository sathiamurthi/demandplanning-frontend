import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize SDK. Assumes process.env.GEMINI_API_KEY is set.
const ai = new GoogleGenAI();

export async function POST(req: Request) {
  try {
    const { text, context } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const isSales = context === 'sales';

    const systemInstruction = isSales
      ? `You are a Point of Sale assistant. The user will dictate an order in English, Tamil, or Tanglish (Tamil written in English).
Extract the items and their quantities. 
Return a JSON array of objects, where each object has:
- name: string (the identified item name in English)
- quantity: number (the identified quantity, default to 1 if not specified)
Example input: "rendu paracetamol kudu oru dolo 650"
Example output: [{"name": "paracetamol", "quantity": 2}, {"name": "dolo 650", "quantity": 1}]`
      : `You are an Inventory Master Setup assistant. The user will dictate a list of new items to add to their store in English, Tamil, or Tanglish.
Extract the item details line by line.
Return a JSON array of objects, where each object has:
- name: string (the identified item name in English)
- price: number (the identified price, or 0 if not mentioned)
- category: string (the identified category or "General" if not mentioned)
- unit: string (e.g. "Piece", "Box", "Kg")
Example input: "puthu item add pannu name maggi price fifty rupees category grocery"
Example output: [{"name": "maggi", "price": 50, "category": "grocery", "unit": "Piece"}]`;

    const schema = isSales 
      ? {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
            },
            required: ["name", "quantity"],
          }
        }
      : {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING },
              unit: { type: Type.STRING },
            },
            required: ["name", "price"],
          }
        };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const output = response.text();
    let data = [];
    try {
      data = JSON.parse(output ?? "[]");
    } catch (e) {
      console.error("Failed to parse JSON from AI", output);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error parsing voice text:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
