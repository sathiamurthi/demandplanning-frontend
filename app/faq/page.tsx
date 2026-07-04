"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Search, ArrowLeft, MessageCircle, Mail, Smartphone, Hotel, Star, HelpCircle } from "lucide-react";

interface FAQ { q: string; a: string | React.ReactNode; tag: string; }

const FAQS: FAQ[] = [
  // Getting Started
  {
    tag: "General",
    q: "What is DemandGenius?",
    a: "DemandGenius is a service marketplace platform that connects customers who need hospitality and event services (hotels, catering, transport, events) with verified service providers. You create a structured inquiry, find vendors in your city, and send them outreach directly from the app — all in one place.",
  },
  {
    tag: "General",
    q: "Do I need an account to use DemandGenius?",
    a: "You can browse the Explore section as a guest without logging in. To create service inquiries, save vendors, and track outreach threads, you need to sign up. Registration takes under a minute.",
  },
  {
    tag: "General",
    q: "Is there a mobile app?",
    a: "Yes — DemandGenius is a Progressive Web App (PWA). Open the app in your mobile browser and tap 'Add to Home Screen' to install it. It works offline and feels like a native app.",
  },
  {
    tag: "General",
    q: "What service types are supported?",
    a: "Currently: Hotels & Resorts, Catering & Food, Transport & Vehicles, and Event Management. More service verticals are added regularly.",
  },
  // Inquiry
  {
    tag: "Inquiry",
    q: "How do I create a service inquiry?",
    a: (
      <ol className="list-decimal pl-4 space-y-1.5 text-sm text-gray-600">
        <li>Go to the <strong>Explore</strong> page and open the <strong>Inquiry Agent</strong> panel.</li>
        <li>Select your service type (Hotel, Food, Transport, Event).</li>
        <li>Enter the city, dates, number of guests, and budget.</li>
        <li>Add any specific requirements in the Notes field.</li>
        <li>Submit — your inquiry gets a unique ID (e.g. INQ-20260704-XXXX).</li>
      </ol>
    ),
  },
  {
    tag: "Inquiry",
    q: "Can I create multiple inquiries at the same time?",
    a: "Yes. Each inquiry gets its own ID and tracks outreach independently. You can have inquiries open for different cities, dates, or service types simultaneously.",
  },
  {
    tag: "Inquiry",
    q: "How long does an inquiry stay active?",
    a: "Inquiries remain active until you close them or the check-in date has passed. You can close an inquiry manually from the Inquiries list.",
  },
  // Outreach
  {
    tag: "Outreach",
    q: "How do I contact a vendor?",
    a: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>In the <strong>Outreach</strong> tab, select your inquiry and add the vendor's details:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Enter the hotel/vendor name</li>
          <li>Enter their email address and/or WhatsApp number</li>
          <li>Click <strong>Send Email</strong> or <strong>WhatsApp</strong></li>
        </ul>
        <p>The vendor receives a branded message with all inquiry details and a secure "Confirm Availability" link.</p>
      </div>
    ),
  },
  {
    tag: "Outreach",
    q: "Can I contact multiple vendors for the same inquiry?",
    a: "Yes — send to as many vendors as you like. Each contact creates a separate thread in the Outreach panel, and you can track responses from all of them at once.",
  },
  {
    tag: "Outreach",
    q: "Does the vendor need to create an account to respond?",
    a: "No. Vendors receive a unique, secure link in their email or WhatsApp message. They simply click it to open a response form — no login or registration required.",
  },
  {
    tag: "Outreach",
    q: "What does the vendor's email look like?",
    a: "Vendors receive a professionally branded HTML email with your inquiry details (dates, guests, budget, notes), a prominent green 'Confirm Availability' button, and a step-by-step guide on how to respond. The email is sent from paariwalaconnect@gmail.com on your behalf.",
  },
  {
    tag: "Outreach",
    q: "Will I receive a copy of the outreach email?",
    a: "Yes. You are automatically CC'd on every outreach email so you have a record in your own inbox.",
  },
  // Tracking
  {
    tag: "Tracking",
    q: "How do I track if a vendor has seen my message?",
    a: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>Each outreach shows a 3-step thread timeline:</p>
        <ul className="space-y-1">
          <li><span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 mr-2"/>📤 <strong>Sent</strong> — message delivered</li>
          <li><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mr-2"/>👁 <strong>Viewed</strong> — vendor opened the response link</li>
          <li><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2"/>✅ <strong>Responded</strong> — vendor submitted their answer</li>
        </ul>
        <p>Click <strong>Refresh</strong> in the Outreach panel to fetch the latest status.</p>
      </div>
    ),
  },
  {
    tag: "Tracking",
    q: "What actions can a vendor take when they respond?",
    a: (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {[
          { icon: "✅", action: "Accept", desc: "Available and ready to host" },
          { icon: "💰", action: "Send Quote", desc: "Available with a price offer" },
          { icon: "⏸", action: "On Hold", desc: "Needs time to confirm" },
          { icon: "❌", action: "Decline", desc: "Not available for these dates" },
          { icon: "📅", action: "Future Interest", desc: "Interested for future dates" },
        ].map(r => (
          <div key={r.action} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2">
            <span>{r.icon}</span>
            <div><p className="font-bold text-gray-800 text-xs">{r.action}</p><p className="text-[10px] text-gray-500">{r.desc}</p></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Tracking",
    q: "What if a vendor doesn't respond?",
    a: "Use the 'Re-send Email' or 'Re-send WA' buttons in the thread view to follow up. The vendor receives a fresh outreach with the same response link. You can also copy the response link and share it manually.",
  },
  // Admin
  {
    tag: "Admin",
    q: "What can I manage in the Admin panel?",
    a: "Store owners can manage inventory items, process sales, view orders, generate reports, manage users and permissions, configure store settings, and access AI-powered demand forecasts.",
  },
  {
    tag: "Admin",
    q: "How does multi-tenant work?",
    a: "Each business gets its own isolated store (tenant). Data, inventory, users, and reports are completely separate per store. A superadmin can view cross-tenant analytics.",
  },
  {
    tag: "Admin",
    q: "Can I use DemandGenius on WhatsApp?",
    a: "Yes. The WhatsApp bot lets you search items, check stock, view today's summary, and link your account — all by messaging the bot number. Type 'help' to see available commands.",
  },
];

const TAGS = ["All", "General", "Inquiry", "Outreach", "Tracking", "Admin"];

const TAG_ICON: Record<string, React.ReactNode> = {
  General: <HelpCircle size={12}/>,
  Inquiry: <Search size={12}/>,
  Outreach: <Mail size={12}/>,
  Tracking: <MessageCircle size={12}/>,
  Admin: <Star size={12}/>,
};

const TAG_COLOR: Record<string, string> = {
  General: "bg-gray-100 text-gray-600",
  Inquiry: "bg-sky-100 text-sky-700",
  Outreach: "bg-blue-100 text-blue-700",
  Tracking: "bg-amber-100 text-amber-700",
  Admin: "bg-purple-100 text-purple-700",
};

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = FAQS.filter(f => {
    const matchTag = activeTag === "All" || f.tag === activeTag;
    const matchSearch = !search.trim() ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      (typeof f.a === "string" && f.a.toLowerCase().includes(search.toLowerCase()));
    return matchTag && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/explore" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18}/>
          </Link>
          <div className="flex-1">
            <p className="text-xs font-black text-gray-900">DemandGenius</p>
            <p className="text-[10px] text-gray-400">Frequently Asked Questions</p>
          </div>
          <Link href="/help" className="text-[11px] font-bold text-sky-600 hover:underline">
            Full Help Guide →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500 shadow-lg shadow-sky-200">
            <HelpCircle size={26} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black text-gray-900">How can we help?</h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">Find answers to the most common questions about DemandGenius.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setOpen(null); }}
            placeholder="Search questions…"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
          />
        </div>

        {/* Tag filters */}
        <div className="flex gap-2 flex-wrap">
          {TAGS.map(t => (
            <button key={t} onClick={() => { setActiveTag(t); setOpen(null); }}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                activeTag === t
                  ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
              }`}>
              {t !== "All" && TAG_ICON[t]}
              {t}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-bold">No results found</p>
              <p className="text-sm mt-1">Try a different search term or category</p>
            </div>
          )}
          {filtered.map((f, i) => {
            const idx = FAQS.indexOf(f);
            const isOpen = open === idx;
            return (
              <div key={idx} className={`bg-white rounded-2xl border transition-all ${isOpen ? "border-sky-200 shadow-sm shadow-sky-100" : "border-gray-100"}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${TAG_COLOR[f.tag] || "bg-gray-100 text-gray-600"}`}>
                    {TAG_ICON[f.tag]} {f.tag}
                  </span>
                  <span className="flex-1 text-sm font-bold text-gray-900">{f.q}</span>
                  <span className="shrink-0 text-gray-400">
                    {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="ml-[calc(theme(spacing.16)+theme(spacing.3))] border-t border-gray-50 pt-3">
                      {typeof f.a === "string"
                        ? <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                        : f.a}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-center text-white space-y-3">
          <p className="font-black text-lg">Still have questions?</p>
          <p className="text-sm text-sky-100">Check the full help guide for step-by-step walkthroughs and screenshots.</p>
          <Link href="/help"
            className="inline-block bg-white text-sky-600 font-black text-sm px-6 py-2.5 rounded-xl hover:bg-sky-50 transition-colors">
            Open Help Guide →
          </Link>
        </div>
      </div>
    </div>
  );
}
