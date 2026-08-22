import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image_base64, mime_type, tenantId } = await req.json();
    if (!image_base64) {
      return NextResponse.json({ success: false, error: 'image_base64 is required' }, { status: 400 });
    }

    // Try to fetch categories from backend using a direct fetch or skip if it fails
    let catList = 'No predefined categories provided.';
    try {
      // Just use the env var for the backend URL
      const backendBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://demandplanning-backend.onrender.com';
      const catRes = await fetch(`${backendBase}/v1/tenants/${tenantId}/categories`, {
        headers: { 'Authorization': req.headers.get('authorization') || '' }
      });
      const catJson = await catRes.json();
      if (catJson.success && Array.isArray(catJson.data)) {
        catList = catJson.data.map((c: any) => `- ID: ${c.id}, Name: ${c.name}`).join('\n');
      }
    } catch(e) {
      console.warn('Failed to fetch categories', e);
    }

    const prompt = `Extract all pharmaceutical or inventory items from this invoice image.
Return a JSON array of objects, where each object has these exact keys:
- name (string)
- currentStock (number, quantity)
- mrp (number)
- purchasePrice (number)
- batchNumber (string)
- expiryDate (string, format MM/YYYY)
- categoryId (string, strictly matching the best category ID from the list below, or null if none match)
- categoryName (string, the name of the matched category, or null)

Available categories:
${catList}

If a field is missing, use null or an appropriate default. Do not wrap the JSON in markdown code blocks, just return the raw JSON array.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured on Vercel' }, { status: 500 });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mime_type || "image/jpeg",
                data: image_base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const aiReq = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const aiRes = await aiReq.json();
    if (!aiRes.candidates || !aiRes.candidates[0].content.parts[0].text) {
      return NextResponse.json({ success: false, error: 'AI failed to extract text' }, { status: 500 });
    }

    const text = aiRes.candidates[0].content.parts[0].text;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch(err) {
      const match = text.match(/\`\`\`(?:json)?([\s\S]*?)\`\`\`/);
      parsed = match ? JSON.parse(match[1]) : [];
    }

    return NextResponse.json({ success: true, data: Array.isArray(parsed) ? parsed : [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
