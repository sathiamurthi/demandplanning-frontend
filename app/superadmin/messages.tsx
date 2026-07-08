"use client";
import { useState } from "react";
import { MessageSquare, Send, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demandplanning-backend.onrender.com";
function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("nexus_superadmin_token") || "";
}

export default function Messages() {
  const [receiverId, setReceiverId] = useState("");
  const [subject, setSubject]       = useState("");
  const [content, setContent]       = useState("");
  const [sending, setSending]       = useState(false);
  const [status, setStatus]         = useState<"idle"|"ok"|"err">("idle");
  const [errMsg, setErrMsg]         = useState("");

  const send = async () => {
    if (!receiverId.trim() || !content.trim()) return;
    setSending(true); setStatus("idle");
    try {
      const r = await fetch(`${API}/v1/superadmin/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ receiverId: receiverId.trim(), subject: subject.trim(), content: content.trim() }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || `Error ${r.status}`);
      setStatus("ok");
      setReceiverId(""); setSubject(""); setContent("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (e: any) {
      setErrMsg(e.message); setStatus("err");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
          <MessageSquare size={18} className="text-indigo-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Send Message</h1>
          <p className="text-xs text-gray-500">Send a direct platform message to a specific tenant or user</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Recipient ID</label>
          <input value={receiverId} onChange={e => setReceiverId(e.target.value)}
            placeholder="Tenant ID or User ID…"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Message subject (optional)…"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Message</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
            placeholder="Write your message here…"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        </div>

        {status === "err" && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg px-4 py-3">
            <AlertCircle size={14}/>{errMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={send} disabled={sending || !receiverId.trim() || !content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition">
            {sending ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
            {sending ? "Sending…" : "Send Message"}
          </button>
          {status === "ok" && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
              <CheckCircle size={14}/>Message sent
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <Info size={13} className="shrink-0 mt-0.5"/>
        Messages are delivered as in-platform inbox notifications. Find tenant and user IDs in the <strong>Tenants</strong> and <strong>Users</strong> sections.
      </div>
    </div>
  );
}
