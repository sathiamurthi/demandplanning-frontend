"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// ── Types ────────────────────────────────────────────────────
interface InquirySnapshot {
  inqId: string;
  hotelType: string;
  city: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  roomType: string;
  budget?: string;
  requirements?: string;
}

interface OutreachRecord {
  id: string;
  token: string;
  inquiry_id: string;
  inquiry_snapshot: InquirySnapshot;
  hotel_name: string;
  hotel_email?: string;
  hotel_phone?: string;
  city?: string;
  status: "Sent" | "Viewed" | "Responded";
  hotel_action?: string;
  hotel_quote?: string;
  hotel_message?: string;
  hotel_contact_name?: string;
  responded_at?: string;
  created_at: string;
}

const ACTION_OPTIONS = [
  {
    id: "Accept",
    label: "Accept",
    desc: "We are available and happy to host this guest",
    icon: "✅",
    color: "border-green-400 bg-green-50 text-green-800",
    activeColor: "border-green-500 bg-green-100 ring-2 ring-green-400",
  },
  {
    id: "Quote",
    label: "Send Quote",
    desc: "We are available — here is our pricing",
    icon: "💰",
    color: "border-sky-300 bg-sky-50 text-sky-800",
    activeColor: "border-sky-500 bg-sky-100 ring-2 ring-sky-400",
  },
  {
    id: "Hold",
    label: "On Hold",
    desc: "Need to check availability — will confirm soon",
    icon: "⏸",
    color: "border-amber-300 bg-amber-50 text-amber-800",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-400",
  },
  {
    id: "Future",
    label: "Future Interest",
    desc: "Not available now but interested for future dates",
    icon: "📅",
    color: "border-purple-300 bg-purple-50 text-purple-800",
    activeColor: "border-purple-500 bg-purple-100 ring-2 ring-purple-400",
  },
  {
    id: "Reject",
    label: "Cannot Accommodate",
    desc: "Unable to accommodate this inquiry",
    icon: "❌",
    color: "border-red-200 bg-red-50 text-red-700",
    activeColor: "border-red-400 bg-red-100 ring-2 ring-red-300",
  },
];

// ── Inner component (needs useSearchParams → must be inside Suspense) ──
function HotelRespondInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [phase, setPhase] = useState<"loading" | "form" | "submitted" | "error">("loading");
  const [record, setRecord] = useState<OutreachRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [contactName, setContactName] = useState("");
  const [action, setAction] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Load inquiry on mount ──
  useEffect(() => {
    if (!token) { setErrorMsg("No inquiry link found. Please check the link."); setPhase("error"); return; }
    fetch(`/v1/public/hotel-response/${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setErrorMsg(data.error || "Inquiry not found."); setPhase("error"); return; }
        setRecord(data.data);
        if (data.data.status === "Responded") { setPhase("submitted"); } else { setPhase("form"); }
      })
      .catch(() => { setErrorMsg("Network error. Please check your connection and try again."); setPhase("error"); });
  }, [token]);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!contactName.trim()) { setFormError("Please enter your name."); return; }
    if (!action) { setFormError("Please select a response option."); return; }
    if (action === "Quote" && !quoteAmount) { setFormError("Please enter a quote amount."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const resp = await fetch(`/v1/public/hotel-response/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: contactName.trim(),
          action,
          quote_amount: action === "Quote" ? parseFloat(quoteAmount) : undefined,
          message: message.trim() || undefined,
        }),
      });
      const data = await resp.json();
      if (!data.success) { setFormError(data.error || "Submission failed."); setSubmitting(false); return; }
      setRecord(r => r ? { ...r, ...data.data } : r);
      setPhase("submitted");
    } catch {
      setFormError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  const snap: InquirySnapshot | null = record?.inquiry_snapshot || null;
  const nights = snap?.checkIn && snap?.checkOut
    ? Math.ceil((new Date(snap.checkOut).getTime() - new Date(snap.checkIn).getTime()) / 86400000)
    : null;

  // ── Loading ──
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🏨</span>
          </div>
          <p className="text-sky-700 font-semibold text-sm">Loading inquiry details…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-lg font-black text-gray-900 mb-2">Link Error</h1>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
          <p className="text-gray-400 text-xs mt-4">If you received this link in an email or WhatsApp, please ensure you copied the full URL.</p>
        </div>
      </div>
    );
  }

  // ── Already submitted ──
  if (phase === "submitted") {
    const actionLabel = ACTION_OPTIONS.find(a => a.id === (record?.hotel_action || action))?.label || record?.hotel_action;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-black text-gray-900">Response Submitted!</h1>
            <p className="text-gray-500 text-sm mt-1">The customer has been notified automatically.</p>
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inquiry</span>
              <span className="text-xs font-black text-sky-600">{record?.inquiry_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Response</span>
              <span className="text-xs font-black text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">{actionLabel}</span>
            </div>
            {record?.hotel_quote && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quote</span>
                <span className="text-sm font-black text-green-700">₹{record.hotel_quote}/night</span>
              </div>
            )}
            {record?.hotel_message && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 italic">"{record.hotel_message}"</div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400">
            Powered by <span className="font-bold text-sky-600">DemandGenius</span> Inquiry Agent
          </p>
        </div>
      </div>
    );
  }

  // ── Main form ──
  const selectedAction = ACTION_OPTIONS.find(a => a.id === action);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Brand header */}
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-sky-100">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-base">🏨</span>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-semibold leading-none">DemandGenius</p>
              <p className="text-xs font-black text-gray-900 leading-tight">Inquiry Response Portal</p>
            </div>
          </div>
        </div>

        {/* Inquiry details card */}
        {snap && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 p-4 text-white">
              <p className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">New Guest Inquiry</p>
              <h2 className="text-lg font-black mt-0.5">{snap.inqId}</h2>
              <p className="text-sky-200 text-xs mt-0.5">
                {snap.hotelType} · {snap.city}
                {record?.hotel_name ? ` · To: ${record.hotel_name}` : ""}
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { icon: "📅", label: "Check-in",  val: snap.checkIn },
                { icon: "📅", label: "Check-out", val: snap.checkOut },
                { icon: "👥", label: "Guests",    val: `${snap.guests} person${+snap.guests !== 1 ? "s" : ""}` },
                { icon: "🛏",  label: "Room Type", val: snap.roomType },
                { icon: "💰", label: "Budget",    val: snap.budget ? `₹${snap.budget}/night` : "Flexible" },
                { icon: "🌙", label: "Nights",    val: nights ? `${nights} night${nights !== 1 ? "s" : ""}` : "—" },
              ].map(d => (
                <div key={d.label} className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">{d.icon} {d.label}</p>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">{d.val}</p>
                </div>
              ))}
            </div>
            {snap.requirements && (
              <div className="px-4 pb-4">
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-800">
                  <span className="font-bold">Special Requirements: </span>{snap.requirements}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Response form */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-5">
          <h3 className="font-black text-gray-900 text-sm">Your Response</h3>

          {/* Contact name */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Your Name at the Hotel *</label>
            <input
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="e.g. Anita Sharma, Front Desk Manager"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Action selection */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-2">How would you like to respond? *</label>
            <div className="space-y-2">
              {ACTION_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAction(opt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    action === opt.id ? opt.activeColor : opt.color
                  }`}
                >
                  <span className="text-xl shrink-0">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-bold leading-tight">{opt.label}</p>
                    <p className="text-[10px] opacity-75 mt-0.5">{opt.desc}</p>
                  </div>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    action === opt.id ? "border-current bg-current" : "border-current opacity-40"
                  }`}>
                    {action === opt.id && <div className="w-2 h-2 rounded-full bg-white"/>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quote amount — shown only for Quote action */}
          {action === "Quote" && (
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Quote Amount (₹ per night) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={e => setQuoteAmount(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full border border-sky-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>
          )}

          {/* Optional message */}
          {action && (
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                Message to Guest{" "}
                <span className="text-gray-300 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder={
                  action === "Accept"  ? "e.g. We are delighted to host you! Please contact us to confirm." :
                  action === "Quote"   ? "e.g. Includes breakfast and airport transfer." :
                  action === "Hold"    ? "e.g. We will confirm by tomorrow evening." :
                  action === "Future"  ? "e.g. We would love to host you for different dates." :
                  "e.g. Unfortunately we are fully booked for these dates."
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
              />
            </div>
          )}

          {/* Error */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2.5 rounded-xl">
              {formError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !action || !contactName.trim()}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-black py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                Submitting…
              </>
            ) : (
              <>
                {selectedAction?.icon || "📤"} Submit Response
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-gray-300">
            Your response will be sent to the customer immediately.
            This link can only be used once.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 py-2">
          Powered by <span className="font-bold text-sky-500">DemandGenius</span> · Inquiry Agent
        </p>
      </div>
    </div>
  );
}

// Suspense boundary required for useSearchParams in Next.js App Router
export default function HotelRespondPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 animate-pulse mx-auto mb-3"/>
            <p className="text-sky-600 text-sm font-semibold">Loading…</p>
          </div>
        </div>
      }
    >
      <HotelRespondInner />
    </Suspense>
  );
}
