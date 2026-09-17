import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://demandplanning-backend.onrender.com').replace(/\/$/, '');

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Proxy /v1/* to backend without forwarding the browser Origin header.
  // The Next.js rewrite forwards Origin which triggers CORS rejection on the
  // backend. This middleware intercepts first and makes a clean server→server
  // request instead, so the backend sees no Origin and allows the request.
  if (pathname.startsWith('/v1/')) {
    const target = `${BACKEND}${pathname}${search}`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Strip browser-added headers that cause CORS issues server-side
      if (key === 'origin' || key === 'host' || key === 'referer') return;
      headers.set(key, value);
    });
    headers.set('host', new URL(BACKEND).host);

    let body: BodyInit | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
    }

    try {
      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body: body ? body : undefined,
        // @ts-ignore — Node 18+ duplex requirement
        duplex: 'half',
      });

      const resHeaders = new Headers(upstream.headers);
      // Add permissive CORS so the browser treats the response as same-origin
      resHeaders.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
      resHeaders.set('Access-Control-Allow-Credentials', 'true');

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: resHeaders,
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 502 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/v1/:path*'],
};
