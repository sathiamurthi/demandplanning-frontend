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
          <div className="w-10 h-10 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center justify-center">
            <Bell size={18} className="text-yellow-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-gray-500 text-xs">Things that need your attention today</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-gray-600 text-sm">
            <Bell size={32} className="mx-auto mb-3 opacity-20" />
            {loading ? "Loading…" : "Nothing needs your attention right now."}
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className={`flex items-start gap-3 px-4 py-3.5 ${idx > 0 ? "border-t border-gray-100" : ""}`}>
              {item.severity === "high" ? (
                <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Info size={16} className="text-yellow-600 shrink-0 mt-0.5" />
              )}
              <p className="text-gray-900/80 text-sm">{item.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
