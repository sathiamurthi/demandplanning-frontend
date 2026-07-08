"use client";
import { useState, useEffect } from "react";
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

export interface Ad {
  id: string; title: string; body: string; cta: string; ctaUrl: string;
  bg: string; textLight: boolean;
  pages: string[]; active: boolean;
  validFrom: string; validTo: string;
  clicks: number; impressions: number;
}

const STORE_KEY    = "nexus_ads";
const DISMISS_KEY  = "nexus_ads_dismissed";

function getActiveAds(page: string): Ad[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const ads: Ad[] = JSON.parse(raw);
    const now = Date.now();
    const dismissed: string[] = JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]");
    return ads.filter(a =>
      a.active &&
      a.pages.includes(page) &&
      (!a.validFrom || new Date(a.validFrom).getTime() <= now) &&
      (!a.validTo   || new Date(a.validTo).getTime()   >= now) &&
      !dismissed.includes(a.id)
    );
  } catch { return []; }
}

function record(id: string, field: "clicks" | "impressions") {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const ads: Ad[] = JSON.parse(raw);
    const idx = ads.findIndex(a => a.id === id);
    if (idx >= 0) {
      ads[idx][field] = (ads[idx][field] || 0) + 1;
      localStorage.setItem(STORE_KEY, JSON.stringify(ads));
    }
  } catch {}
}

export function AdBanner({ page }: { page: string }) {
  const [ads, setAds]   = useState<Ad[]>([]);
  const [idx, setIdx]   = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const active = getActiveAds(page);
    setAds(active);
    if (active[0]) record(active[0].id, "impressions");
  }, [page]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => {
      setIdx(i => {
        const next = (i + 1) % ads.length;
        record(ads[next].id, "impressions");
        return next;
      });
    }, 7000);
    return () => clearInterval(t);
  }, [ads]);

  const dismiss = (id: string) => {
    try {
      const list: string[] = JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]");
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...list, id]));
    } catch {}
    setAds(prev => {
      const next = prev.filter(a => a.id !== id);
      if (next[0]) { setIdx(0); record(next[0].id, "impressions"); }
      return next;
    });
  };

  const prev = () => setIdx(i => (i - 1 + ads.length) % ads.length);
  const next = () => setIdx(i => (i + 1) % ads.length);

  if (!mounted || ads.length === 0) return null;
  const ad = ads[idx % ads.length];
  const light = ad.textLight !== false;

  return (
    <div className="px-4 pt-3">
      <div
        className="relative flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden"
        style={{ background: ad.bg || "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
      >
        {/* Decorative blobs */}
        <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none"/>
        <span className="absolute -left-4 bottom-0 w-16 h-16 rounded-full bg-white/5 pointer-events-none"/>

        {ads.length > 1 && (
          <button onClick={prev} className={`shrink-0 relative z-10 ${light?"text-white/60 hover:text-white":"text-gray-500 hover:text-gray-800"} transition`}>
            <ChevronLeft size={15}/>
          </button>
        )}

        <div className="flex-1 min-w-0 relative z-10">
          <p className={`text-xs font-black truncate leading-tight ${light ? "text-white" : "text-gray-900"}`}>{ad.title}</p>
          <p className={`text-[11px] mt-0.5 truncate ${light ? "text-white/80" : "text-gray-600"}`}>{ad.body}</p>
        </div>

        {ad.cta && ad.ctaUrl && (
          <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => record(ad.id, "clicks")}
            className={`shrink-0 relative z-10 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              light ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-900/10 hover:bg-gray-900/20 text-gray-900"
            }`}>
            {ad.cta} <ExternalLink size={10}/>
          </a>
        )}

        {ads.length > 1 && (
          <button onClick={next} className={`shrink-0 relative z-10 ${light?"text-white/60 hover:text-white":"text-gray-500 hover:text-gray-800"} transition`}>
            <ChevronRight size={15}/>
          </button>
        )}

        <button onClick={() => dismiss(ad.id)} className={`shrink-0 relative z-10 transition ${light?"text-white/50 hover:text-white":"text-gray-400 hover:text-gray-700"}`}>
          <X size={14}/>
        </button>

        <span className={`absolute bottom-0.5 right-2 text-[9px] uppercase tracking-wider ${light?"text-white/30":"text-gray-400/60"}`}>Sponsored</span>

        {ads.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {ads.map((_, i) => (
              <span key={i} onClick={() => setIdx(i)}
                className={`w-1 h-1 rounded-full cursor-pointer transition ${i === idx % ads.length ? (light?"bg-white":"bg-gray-700") : (light?"bg-white/30":"bg-gray-300")}`}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
