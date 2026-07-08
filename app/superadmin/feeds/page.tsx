"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Rss, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, ExternalLink,
  Loader2, X, Clock, ChevronRight, Globe, Check,
} from "lucide-react";

const STORE_KEY = "nexus_feeds";

interface Feed {
  id: string; label: string; url: string; category: string;
  active: boolean; lastFetched: string | null; itemCount: number;
}
interface FeedItem {
  title: string; link: string; description: string; pubDate: string;
}

const CATEGORIES = ["Tech", "Finance", "Education", "Jobs", "News", "Government", "Custom"];

const SAMPLE_FEEDS: Omit<Feed, "id" | "lastFetched" | "itemCount">[] = [
  { label: "Hacker News",    url: "https://hnrss.org/frontpage",        category: "Tech",   active: true },
  { label: "Dev.to",         url: "https://dev.to/feed",                category: "Tech",   active: true },
  { label: "MIT Tech Review",url: "https://www.technologyreview.com/feed/", category: "Tech", active: false },
  { label: "Times of India — Jobs", url: "https://timesofindia.indiatimes.com/rssfeeds/-2128938958.cms", category: "Jobs", active: false },
];

function loadFeeds(): Feed[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}
function saveFeeds(f: Feed[]) { localStorage.setItem(STORE_KEY, JSON.stringify(f)); }
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function FeedsPage() {
  const [feeds, setFeeds]       = useState<Feed[]>([]);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ label: "", url: "", category: "Tech" });
  const [preview, setPreview]   = useState<{ feedId: string; title: string; items: FeedItem[] } | null>(null);
  const [fetching, setFetching] = useState<string | null>(null);
  const [error, setError]       = useState("");

  useEffect(() => { setFeeds(loadFeeds()); }, []);

  const persist = (next: Feed[]) => { setFeeds(next); saveFeeds(next); };

  const fetchFeed = useCallback(async (feed: Feed) => {
    setFetching(feed.id); setError("");
    try {
      const r = await fetch(`/api/fetch-feed?url=${encodeURIComponent(feed.url)}`);
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Fetch failed");
      const updated = feeds.map(f =>
        f.id === feed.id ? { ...f, lastFetched: new Date().toISOString(), itemCount: d.count } : f
      );
      persist(updated);
      setPreview({ feedId: feed.id, title: d.feedTitle || feed.label, items: d.items || [] });
    } catch (e: any) {
      setError(e.message);
    }
    setFetching(null);
  }, [feeds]);

  const addFeed = () => {
    if (!form.url.trim() || !form.label.trim()) return;
    const next: Feed = { id: newId(), label: form.label.trim(), url: form.url.trim(), category: form.category, active: true, lastFetched: null, itemCount: 0 };
    persist([...feeds, next]);
    setForm({ label: "", url: "", category: "Tech" });
    setShowAdd(false);
  };

  const seedSamples = () => {
    const existing = new Set(feeds.map(f => f.url));
    const news = SAMPLE_FEEDS.filter(s => !existing.has(s.url)).map(s => ({ ...s, id: newId(), lastFetched: null, itemCount: 0 }));
    persist([...feeds, ...news]);
  };

  const toggleActive = (id: string) => persist(feeds.map(f => f.id === id ? { ...f, active: !f.active } : f));
  const deleteFeed   = (id: string) => { persist(feeds.filter(f => f.id !== id)); if (preview?.feedId === id) setPreview(null); };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/20 rounded-xl flex items-center justify-center">
            <Rss size={18} className="text-teal-500"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Feed Subscriptions</h1>
            <p className="text-xs text-gray-500">Subscribe to RSS/Atom feeds from external sources</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {feeds.length === 0 && (
            <button onClick={seedSamples} className="px-3 py-2 border border-dashed border-teal-300 rounded-lg text-xs font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition">
              Load Sample Feeds
            </button>
          )}
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition">
            <Plus size={15}/>{showAdd ? "Cancel" : "Add Feed"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Subscribe to a Feed</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Label</label>
              <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Hacker News" className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300"/>
            </div>
            <div className="sm:col-span-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Feed URL</label>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="https://example.com/feed" className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-300">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
            <button onClick={addFeed} disabled={!form.url.trim() || !form.label.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition">
              <Plus size={14}/>Add Feed
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feed list */}
        <div className="space-y-2">
          {feeds.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
              <Rss size={28} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm font-semibold text-gray-400">No feeds yet</p>
              <p className="text-xs text-gray-400 mt-1">Add a feed URL above or load sample feeds</p>
            </div>
          ) : feeds.map(f => (
            <div key={f.id}
              className={`bg-white dark:bg-gray-800 border rounded-xl p-4 cursor-pointer transition ${
                preview?.feedId === f.id ? "border-teal-400 ring-1 ring-teal-300" : "border-gray-200 dark:border-gray-700 hover:border-teal-200"
              }`}
              onClick={() => fetchFeed(f)}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.active ? "bg-teal-50 dark:bg-teal-900/20" : "bg-gray-100 dark:bg-gray-700"}`}>
                  <Rss size={15} className={f.active ? "text-teal-500" : "text-gray-400"}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{f.label}</p>
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{f.category}</span>
                    {f.itemCount > 0 && <span className="text-[10px] font-bold text-teal-600">{f.itemCount} items</span>}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{f.url}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={9}/>{fmtAgo(f.lastFetched)}</span>
                    <span className="flex items-center gap-1 text-teal-500"><Globe size={9}/>Click to fetch</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {fetching === f.id
                    ? <Loader2 size={15} className="animate-spin text-teal-500"/>
                    : <RefreshCw size={13} className="text-gray-400"/>
                  }
                  <button onClick={e => { e.stopPropagation(); toggleActive(f.id); }}
                    className="text-gray-400 hover:text-teal-500 transition">
                    {f.active ? <ToggleRight size={18} className="text-teal-500"/> : <ToggleLeft size={18}/>}
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteFeed(f.id); }}
                    className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview panel */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col">
          {!preview ? (
            <div className="flex-1 flex items-center justify-center py-16 text-center">
              <div>
                <ChevronRight size={24} className="text-gray-200 mx-auto mb-2"/>
                <p className="text-sm font-semibold text-gray-400">Click a feed to preview</p>
                <p className="text-xs text-gray-400 mt-1">Latest items will appear here</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{preview.title}</p>
                <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"><X size={14}/></button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                {preview.items.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">No items found</div>
                ) : preview.items.map((item, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <a href={item.link || "#"} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-gray-900 dark:text-white hover:text-teal-600 leading-snug line-clamp-2 flex items-start gap-1">
                          {item.title}
                          {item.link && <ExternalLink size={9} className="shrink-0 mt-0.5 opacity-40"/>}
                        </a>
                        {item.description && (
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        {item.pubDate && (
                          <p className="text-[10px] text-gray-300 mt-1">
                            {new Date(item.pubDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800/30 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5"><Check size={13}/>How Feed Subscriptions Work</p>
        <ul className="text-xs text-teal-700 dark:text-teal-400 space-y-1 pl-4 list-disc">
          <li>Paste any public RSS or Atom feed URL and click "Add Feed"</li>
          <li>Click a feed card to fetch and preview the latest items (server-side, no CORS issues)</li>
          <li>Toggle feeds active/inactive to control which ones are aggregated on the dashboard</li>
          <li>Fetched items can be surfaced on the main NexusOS dashboard as a "Live Feed" widget</li>
        </ul>
      </div>
    </div>
  );
}
