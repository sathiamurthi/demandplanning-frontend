import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface FeedItem {
  title: string; link: string; description: string; pubDate: string;
}

function extractField(block: string, tag: string): string {
  // CDATA
  const cRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const cM = cRe.exec(block);
  if (cM) return cM[1].trim();
  // Regular text
  const tRe = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i");
  const tM = tRe.exec(block);
  if (tM) return tM[1].trim();
  // Atom link href
  if (tag === "link") {
    const hM = /<link[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i.exec(block);
    if (hM) return hM[1];
  }
  return "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function parseBlocks(xml: string, tag: "item" | "entry"): FeedItem[] {
  const items: FeedItem[] = [];
  const re = new RegExp(`<${tag}[\\s>]([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const title = stripHtml(extractField(b, "title"));
    const link  = extractField(b, "link").trim();
    const desc  = stripHtml(
      extractField(b, "description") || extractField(b, "summary") || extractField(b, "content:encoded") || extractField(b, "content")
    ).slice(0, 280);
    const date  = extractField(b, "pubDate") || extractField(b, "published") || extractField(b, "updated");
    if (title) items.push({ title, link, description: desc, pubDate: date });
  }
  return items;
}

function parseFeedTitle(xml: string): string {
  const m =
    /<channel>[\s\S]*?<title[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/title>/.exec(xml) ||
    /<channel>[\s\S]*?<title[^>]*>([^<]*)<\/title>/i.exec(xml) ||
    /<feed[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/i.exec(xml);
  return m ? stripHtml(m[1]) : "";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NexusOS-FeedReader/1.0 (platform feed aggregator)",
        "Accept": "application/rss+xml, application/atom+xml, text/xml, application/xml, */*",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from feed`);

    const xml = await res.text();
    const isAtom = /<feed[\s>]/i.test(xml);
    const items = isAtom ? parseBlocks(xml, "entry") : parseBlocks(xml, "item");
    const feedTitle = parseFeedTitle(xml);

    return NextResponse.json({
      success: true,
      feedTitle: feedTitle || url,
      isAtom,
      count: items.length,
      items: items.slice(0, 20),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
