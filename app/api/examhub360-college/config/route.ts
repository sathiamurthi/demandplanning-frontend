import { NextResponse } from 'next/server';

// Temporary in-memory state for demo purposes. 
// In a real app, this would connect to Postgres/Redis.
let globalConfig = {
  tier: "free",
  enableQuestionBank: true,
  enableDemoMode: true
};

export async function GET() {
  return NextResponse.json({ success: true, data: globalConfig });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    globalConfig = { ...globalConfig, ...body };
    return NextResponse.json({ success: true, data: globalConfig });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
