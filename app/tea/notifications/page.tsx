"use client";

import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface NotificationItem {
  type: string;
  severity: "high" | "medium";
  message: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await fetch(teaUrl("/notifications"), { headers: teaAuthHeaders() }).then(r => r.json());
    if (r.success) setItems(r.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <Bell size={18} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Notifications</h1>
            <p className="text-white/40 text-xs">Things that need your attention today</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-white/30 text-sm">
            <Bell size={32} className="mx-auto mb-3 opacity-20" />
            {loading ? "Loading…" : "Nothing needs your attention right now."}
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className={`flex items-start gap-3 px-4 py-3.5 ${idx > 0 ? "border-t border-white/5" : ""}`}>
              {item.severity === "high" ? (
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              ) : (
                <Info size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              )}
              <p className="text-white/80 text-sm">{item.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
