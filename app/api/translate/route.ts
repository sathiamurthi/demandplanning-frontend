import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, fromLang, toLang } = await req.json();
    if (!text?.trim()) return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
    if (!fromLang || !toLang) return NextResponse.json({ success: false, error: 'Languages required' }, { status: 400 });
    if (fromLang === toLang) return NextResponse.json({ success: true, translation: text });

    const encoded = encodeURIComponent(text.trim());
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${fromLang}|${toLang}&de=paariwalaconnect@gmail.com`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await resp.json();

    if (data.responseStatus !== 200 && data.responseStatus !== '200') {
      return NextResponse.json({ success: false, error: data.responseDetails || 'Translation failed' }, { status: 502 });
    }

    const translation = data.responseData?.translatedText || '';
    return NextResponse.json({ success: true, translation });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Translation error' }, { status: 500 });
  }
}
