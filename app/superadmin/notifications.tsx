"use client";
import { useState } from "react";
import { Bell, Send, Users, Building2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demandplanning-backend.onrender.com";
function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("nexus_superadmin_token") || "";
}

type Target = "all" | "tenant" | "user";

export default function Notifications() {
  const [target, setTarget]   = useState<Target>("all");
  const [targetId, setTargetId] = useState("");
  const [title, setTitle]     = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus]   = useState<"idle"|"ok"|"err">("idle");
  const [errMsg, setErrMsg]   = useState("");

  const send = async () => {
    if (!message.trim() || !title.trim()) return;
    if ((target === "tenant" || target === "user") && !targetId.trim()) return;
    setSending(true); setStatus("idle");
    try {
      const r = await fetch(`${API}/v1/superadmin/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          target,
          targetId: target === "all" ? undefined : targetId.trim(),
          title: title.trim(),
          message: message.trim(),
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || `Error ${r.status}`);
      setStatus("ok");
      setTitle(""); setMessage(""); setTargetId("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (e: any) {
      setErrMsg(e.message); setStatus("err");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
          <Bell size={18} className="text-blue-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Send Notification</h1>
          <p className="text-xs text-gray-500">Push a platform notification to all users, a tenant, or a specific user</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        {/* Target selector */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 block">Send To</label>
          <div className="flex gap-2">
            {([
              { id:"all",    label:"All Users",   icon:<Users size={13}/> },
              { id:"tenant", label:"A Tenant",    icon:<Building2 size={13}/> },
              { id:"user",   label:"One User",    icon:<Bell size={13}/> },
            ] as const).map(t => (
              <button key={t.id} onClick={() => { setTarget(t.id); setTargetId(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${target === t.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300"}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target ID */}
        {(target === "tenant" || target === "user") && (
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">
              {target === "tenant" ? "Tenant ID" : "User ID"}
            </label>
            <input value={targetId} onChange={e => setTargetId(e.target.value)}
              placeholder={target === "tenant" ? "Enter tenant ID…" : "Enter user ID…"}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"/>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Notification Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. New feature available"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"/>
        </div>

        {/* Message */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            placeholder="Write your notification message here…"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"/>
          <p className="text-[10px] text-gray-400 mt-1">{message.length}/500 characters</p>
        </div>

        {status === "err" && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg px-4 py-3">
            <AlertCircle size={14}/>{errMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={send} disabled={sending || !message.trim() || !title.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition">
            {sending ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
            {sending ? "Sending…" : "Send Notification"}
          </button>
          {status === "ok" && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
              <CheckCircle size={14}/>Notification sent
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
