"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, Hotel, Utensils, Car, Calendar, Mail,
  Smartphone, MessageCircle, CheckCircle, Clock, Eye, BarChart3,
  Users, Settings, ShieldCheck, Zap, Globe, ChevronRight, Star,
  FileText, Send, RefreshCw, Copy, HelpCircle, Layers,
} from "lucide-react";

const NAV = [
  { id: "overview",   label: "Overview",          icon: <Layers size={13}/> },
  { id: "explore",    label: "Explore & Search",   icon: <Search size={13}/> },
  { id: "inquiry",    label: "Service Inquiry",    icon: <FileText size={13}/> },
  { id: "outreach",   label: "Vendor Outreach",    icon: <Send size={13}/> },
  { id: "tracking",   label: "Thread Tracking",    icon: <MessageCircle size={13}/> },
  { id: "vendor",     label: "Vendor: How to Respond", icon: <CheckCircle size={13}/> },
  { id: "admin",      label: "Admin Panel",        icon: <BarChart3 size={13}/> },
  { id: "whatsapp",   label: "WhatsApp Bot",       icon: <Smartphone size={13}/> },
  { id: "tips",       label: "Tips & Best Practices", icon: <Star size={13}/> },
];

function Section({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0">{icon}</div>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Card({ title, children, accent = "sky" }: { title?: string; children: React.ReactNode; accent?: string }) {
  const border = accent === "green" ? "border-green-100 bg-green-50/50" : accent === "amber" ? "border-amber-100 bg-amber-50/50" : accent === "purple" ? "border-purple-100 bg-purple-50/50" : "border-gray-100 bg-white";
  return (
    <div className={`rounded-2xl border p-5 ${border}`}>
      {title && <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">{title}</p>}
      {children}
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center shrink-0">{n}</div>
        <div className="w-px flex-1 bg-gray-100 mt-2"/>
      </div>
      <div className="pb-5 flex-1">
        <p className="font-bold text-gray-900 text-sm">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Badge({ label, color = "sky" }: { label: string; color?: string }) {
  const cls = color === "green" ? "bg-green-100 text-green-700" : color === "amber" ? "bg-amber-100 text-amber-700" : color === "red" ? "bg-red-100 text-red-700" : color === "purple" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700";
  return <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/explore" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18}/>
          </Link>
          <div className="flex-1">
            <p className="text-xs font-black text-gray-900">DemandGenius</p>
            <p className="text-[10px] text-gray-400">User Help Guide</p>
          </div>
          <Link href="/faq" className="text-[11px] font-bold text-sky-600 hover:underline hidden sm:block">
            FAQ →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar nav */}
        <aside className="w-52 shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Contents</p>
            {NAV.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={`w-full flex items-center gap-2.5 text-left text-[12px] font-bold px-3 py-2 rounded-xl transition-all ${
                  activeSection === n.id
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                <span className="shrink-0">{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-12 min-w-0">

          {/* Hero */}
          <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap size={24} className="text-white"/>
              </div>
              <div>
                <h1 className="text-2xl font-black">DemandGenius</h1>
                <p className="text-sky-200 text-sm">Complete User Guide</p>
              </div>
            </div>
            <p className="text-sky-100 leading-relaxed max-w-xl">
              DemandGenius connects customers who need services — hotels, catering, transport, events — with the right vendors. This guide covers everything from creating your first inquiry to tracking vendor responses.
            </p>
            <div className="flex gap-2 mt-5 flex-wrap">
              {["Multi-tenant SaaS", "Email & WhatsApp Outreach", "Real-time Thread Tracking", "No vendor login needed"].map(t => (
                <span key={t} className="text-[11px] font-bold bg-white/15 px-3 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          {/* 1. Overview */}
          <Section id="overview" title="Platform Overview" icon={<Layers size={14}/>}>
            <Card>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                DemandGenius is built around a simple workflow: <strong>you create an inquiry → find vendors → send outreach → track responses</strong>. Vendors respond via a secure link with no login required.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Hotel size={18}/>, label: "Hotels", color: "bg-blue-50 text-blue-600" },
                  { icon: <Utensils size={18}/>, label: "Catering", color: "bg-orange-50 text-orange-600" },
                  { icon: <Car size={18}/>, label: "Transport", color: "bg-green-50 text-green-600" },
                  { icon: <Calendar size={18}/>, label: "Events", color: "bg-purple-50 text-purple-600" },
                ].map(s => (
                  <div key={s.label} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${s.color.split(" ")[0]}`}>
                    <span className={s.color}>{s.icon}</span>
                    <span className="text-xs font-bold text-gray-700">{s.label}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="How it works">
              <div className="space-y-0">
                {[
                  { n: 1, title: "Create a Service Inquiry", desc: "Describe what you need — city, dates, guests, budget, requirements." },
                  { n: 2, title: "Find Vendors", desc: "Search Google Maps, JustDial, MakeMyTrip directly from the app. Get hotel names, emails, and WhatsApp numbers." },
                  { n: 3, title: "Send 1-Click Outreach", desc: "Paste vendor details and click Send Email or WhatsApp. A branded inquiry message goes out instantly." },
                  { n: 4, title: "Track Responses", desc: "The thread view shows Sent → Viewed → Responded status for each vendor in real time." },
                  { n: 5, title: "Get Confirmed", desc: "Vendor accepts, sends a quote, or puts on hold. You get notified immediately and see their response in the thread." },
                ].map(s => <Step key={s.n} {...s}/>)}
              </div>
            </Card>
          </Section>

          {/* 2. Explore */}
          <Section id="explore" title="Explore & Search" icon={<Search size={14}/>}>
            <Card>
              <p className="text-sm text-gray-600 leading-relaxed">
                The <strong>Explore</strong> page is the heart of DemandGenius. Browse services, view vendor listings, search by city, and initiate inquiries — all without logging in.
              </p>
            </Card>
            <Card title="Features">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: "City-based Search", desc: "Find services in any city across India. Results are pulled from our vendor network." },
                  { title: "Quick Search Links", desc: "One-click links to Google Maps, JustDial, MakeMyTrip, and TripAdvisor to find vendor contacts." },
                  { title: "Guest Mode", desc: "Browse without an account. Your session is saved locally." },
                  { title: "AI Assistant", desc: "Chat with the AI for personalised recommendations based on your requirements." },
                  { title: "Inquiry Agent Panel", desc: "Side panel with tabs for creating inquiries, outreach, and tracking — everything in one view." },
                  { title: "PWA Install", desc: "Works as a native app on mobile. Tap 'Add to Home Screen' in your browser." },
                ].map(f => (
                  <div key={f.title} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-black text-gray-800">{f.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* 3. Inquiry */}
          <Section id="inquiry" title="Service Inquiry" icon={<FileText size={14}/>}>
            <Card>
              <p className="text-sm text-gray-600 leading-relaxed">An <strong>Inquiry</strong> is a structured service request. Each one gets a unique ID (e.g. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">INQ-20260704-21A7</code>) and is the anchor for all your vendor outreach.</p>
            </Card>
            <Card title="Creating an Inquiry">
              <div className="space-y-0">
                <Step n={1} title='Open the "Inquiry Agent" panel' desc="From the Explore page, click the Inquiry Agent tab in the right-side panel."/>
                <Step n={2} title="Select service type" desc="Choose Hotel, Catering, Transport, or Event. Fields adapt to your selection."/>
                <Step n={3} title="Fill in the details" desc="Enter the city, check-in/check-out dates, number of guests, budget per night (optional), and any special requirements."/>
                <Step n={4} title="Submit" desc="Your inquiry is saved with a unique ID. It appears in the Inquiries list and stays active until you close it or the dates pass."/>
              </div>
            </Card>
            <Card title="Inquiry Fields" accent="sky">
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  { field: "City *", desc: "Where the service is needed" },
                  { field: "Service Type *", desc: "Hotel, Catering, Transport, or Event" },
                  { field: "Check-in Date *", desc: "Start date of service" },
                  { field: "Check-out Date", desc: "End date (for hotels, multi-day events)" },
                  { field: "Guests *", desc: "Number of people / pax / vehicles" },
                  { field: "Budget", desc: "Per night / per head / per km (optional)" },
                  { field: "Requirements", desc: "Special requests, preferences, notes" },
                ].map(r => (
                  <div key={r.field} className="flex gap-2">
                    <ChevronRight size={12} className="text-sky-400 mt-1 shrink-0"/>
                    <div>
                      <span className="font-bold text-gray-800 text-xs">{r.field}</span>
                      <span className="text-[11px] text-gray-500 ml-1">— {r.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* 4. Outreach */}
          <Section id="outreach" title="Vendor Outreach" icon={<Send size={14}/>}>
            <Card>
              <p className="text-sm text-gray-600 leading-relaxed">
                After creating an inquiry, go to the <strong>Outreach tab</strong>. Select your inquiry, add vendor details, and send — no copy-pasting, no manual drafting. The app builds and sends the message for you.
              </p>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="Send via Email" accent="sky">
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={16} className="text-sky-500"/>
                  <span className="text-sm font-black text-gray-800">Email Outreach</span>
                </div>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><span className="font-bold text-sky-600 shrink-0">1.</span> Enter the hotel/vendor name</li>
                  <li className="flex gap-2"><span className="font-bold text-sky-600 shrink-0">2.</span> Enter their email address</li>
                  <li className="flex gap-2"><span className="font-bold text-sky-600 shrink-0">3.</span> Click <strong>Send Email</strong></li>
                </ol>
                <div className="mt-3 bg-sky-50 rounded-xl p-3 text-[11px] text-sky-700 space-y-1">
                  <p>✓ Branded HTML email with your inquiry details</p>
                  <p>✓ Green "Confirm Availability" button</p>
                  <p>✓ CC copy sent to your own inbox</p>
                  <p>✓ Secure response link embedded</p>
                </div>
              </Card>

              <Card title="Send via WhatsApp" accent="sky">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone size={16} className="text-green-500"/>
                  <span className="text-sm font-black text-gray-800">WhatsApp Outreach</span>
                </div>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><span className="font-bold text-green-600 shrink-0">1.</span> Enter the hotel/vendor name</li>
                  <li className="flex gap-2"><span className="font-bold text-green-600 shrink-0">2.</span> Enter their WhatsApp number (with country code, e.g. 91XXXXXXXXXX)</li>
                  <li className="flex gap-2"><span className="font-bold text-green-600 shrink-0">3.</span> Click <strong>WhatsApp</strong></li>
                </ol>
                <div className="mt-3 bg-green-50 rounded-xl p-3 text-[11px] text-green-700 space-y-1">
                  <p>✓ Sent via Meta Cloud API — no browser redirect</p>
                  <p>✓ Formatted message with inquiry details</p>
                  <p>✓ Delivered directly to vendor's WhatsApp</p>
                </div>
              </Card>
            </div>

            <Card title="What the vendor receives">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden text-sm">
                <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3">
                  <p className="text-white font-black">DemandGenius</p>
                  <p className="text-sky-200 text-xs">New Service Inquiry — Action Required</p>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-gray-700">Hello <strong>Grand Hotel</strong>,</p>
                  <p className="text-gray-600 text-xs leading-relaxed">A customer is looking for <strong>Hotel</strong> services in <strong>Kotagiri</strong> through DemandGenius...</p>
                  <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                    <p className="font-black text-gray-500 uppercase tracking-wide text-[10px] mb-2">Request Details</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-gray-400">Check-in</span><span className="font-bold">2026-07-10</span>
                      <span className="text-gray-400">Check-out</span><span className="font-bold">2026-07-12</span>
                      <span className="text-gray-400">Guests</span><span className="font-bold">4</span>
                      <span className="text-gray-400">Budget</span><span className="font-bold">Rs.3000/night</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="inline-block bg-green-500 text-white text-xs font-black px-5 py-2 rounded-xl">✓ Confirm Availability</span>
                  </div>
                </div>
              </div>
            </Card>
          </Section>

          {/* 5. Tracking */}
          <Section id="tracking" title="Thread Tracking" icon={<MessageCircle size={14}/>}>
            <Card>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every outreach is tracked as a <strong>thread</strong>. You can see exactly where each vendor is in the response lifecycle — in real time.
              </p>
            </Card>
            <Card title="Status Timeline">
              <div className="space-y-0">
                {[
                  { dot: "bg-sky-500", icon: "📤", label: "Sent", desc: "Outreach delivered to vendor via email or WhatsApp." },
                  { dot: "bg-amber-400", icon: "👁", label: "Viewed", desc: "Vendor opened the 'Confirm Availability' link in the email." },
                  { dot: "bg-green-500", icon: "✅", label: "Responded", desc: "Vendor submitted their response: Accept, Quote, Hold, Decline, or Future Interest." },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${s.dot} shrink-0 mt-1`}/>
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1"/>}
                    </div>
                    <div className={`${i < arr.length - 1 ? "pb-5" : ""} flex-1`}>
                      <p className="font-bold text-gray-900 text-sm">{s.icon} {s.label}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Vendor Response Types" accent="green">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { icon: "✅", action: "Accept", desc: "Available and ready to host", color: "green" },
                  { icon: "💰", action: "Quote", desc: "Available with a price offer", color: "sky" },
                  { icon: "⏸", action: "Hold", desc: "Checking availability, will confirm soon", color: "amber" },
                  { icon: "❌", action: "Decline", desc: "Not available for these dates", color: "red" },
                  { icon: "📅", action: "Future Interest", desc: "Interested for upcoming dates", color: "purple" },
                ].map(r => (
                  <div key={r.action} className="bg-white rounded-xl p-3 border border-gray-100 space-y-1">
                    <p className="text-lg">{r.icon}</p>
                    <p className="text-xs font-black text-gray-800">{r.action}</p>
                    <p className="text-[10px] text-gray-400">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Actions">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <RefreshCw size={14} className="text-sky-500 mt-0.5 shrink-0"/>
                  <div><strong>Refresh</strong> — Pull latest status from backend. Use this after sending outreach or when waiting for vendor responses.</div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={14} className="text-sky-500 mt-0.5 shrink-0"/>
                  <div><strong>Re-send Email</strong> — Send a follow-up email to the same vendor on the same inquiry thread.</div>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone size={14} className="text-green-500 mt-0.5 shrink-0"/>
                  <div><strong>Re-send WA</strong> — Send a WhatsApp follow-up.</div>
                </div>
                <div className="flex items-start gap-3">
                  <Copy size={14} className="text-gray-400 mt-0.5 shrink-0"/>
                  <div><strong>Copy Link</strong> — Copy the vendor's unique response link to share it manually (e.g. paste in SMS).</div>
                </div>
              </div>
            </Card>
          </Section>

          {/* 6. Vendor Response */}
          <Section id="vendor" title="For Vendors: How to Respond" icon={<CheckCircle size={14}/>}>
            <Card accent="green">
              <p className="text-sm text-gray-600 leading-relaxed">
                As a <strong>vendor (hotel, caterer, transport provider)</strong>, you receive a WhatsApp message or email when a customer needs your services. <strong>No account or login is required</strong> to respond.
              </p>
            </Card>
            <Card title="Steps to respond">
              <div className="space-y-0">
                <Step n={1} title="Receive the inquiry" desc="You'll get an email or WhatsApp message with the customer's full requirements — city, dates, guests, budget."/>
                <Step n={2} title="Click 'Confirm Availability'" desc="Tap the green button in the email or the link in WhatsApp. Your browser opens a secure response form — no login needed."/>
                <Step n={3} title="Choose your response" desc="Select Accept, Send Quote, Hold, Decline, or Future Interest."/>
                <Step n={4} title="Add details (optional)" desc="If quoting: enter your price per night/head. Add a message or your contact name."/>
                <Step n={5} title="Submit" desc="The customer sees your response immediately in their outreach thread. Done!"/>
              </div>
            </Card>
            <Card title="Response form fields" accent="amber">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex gap-2"><ChevronRight size={12} className="text-amber-400 mt-1 shrink-0"/><div><strong>Your name</strong> — contact person's name (required)</div></div>
                <div className="flex gap-2"><ChevronRight size={12} className="text-amber-400 mt-1 shrink-0"/><div><strong>Action</strong> — Accept / Quote / Hold / Decline / Future Interest (required)</div></div>
                <div className="flex gap-2"><ChevronRight size={12} className="text-amber-400 mt-1 shrink-0"/><div><strong>Quote amount</strong> — your price (only when choosing "Quote")</div></div>
                <div className="flex gap-2"><ChevronRight size={12} className="text-amber-400 mt-1 shrink-0"/><div><strong>Message</strong> — any note to the customer (optional, max 1000 chars)</div></div>
              </div>
            </Card>
          </Section>

          {/* 7. Admin */}
          <Section id="admin" title="Admin Panel" icon={<BarChart3 size={14}/>}>
            <Card>
              <p className="text-sm text-gray-600 leading-relaxed">
                The Admin panel is for <strong>store owners and managers</strong>. Each business gets its own isolated store with its own inventory, sales, users, and reports.
              </p>
            </Card>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: <Layers size={15}/>, title: "Inventory", desc: "Add, edit, and categorise products. Set reorder levels, prices, units, and supplier details.", color: "bg-blue-50 text-blue-600" },
                { icon: <BarChart3 size={15}/>, title: "Sales & Billing", desc: "Process sales, generate bills, apply coupons, manage payment modes (cash, UPI, credit).", color: "bg-green-50 text-green-600" },
                { icon: <FileText size={15}/>, title: "Reports", desc: "Daily, weekly, monthly reports. Revenue, top items, low-stock alerts, trend charts.", color: "bg-purple-50 text-purple-600" },
                { icon: <Users size={15}/>, title: "User Management", desc: "Invite team members, assign roles (Admin, Manager, Staff), set permissions.", color: "bg-amber-50 text-amber-600" },
                { icon: <Settings size={15}/>, title: "Store Settings", desc: "Store name, logo, address, contact info, tax rates, and display preferences.", color: "bg-rose-50 text-rose-600" },
                { icon: <ShieldCheck size={15}/>, title: "AI Demand Insights", desc: "Claude AI analyses your sales history to forecast demand and suggest restocking.", color: "bg-sky-50 text-sky-600" },
              ].map(f => (
                <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${f.color.split(" ")[0]}`}>
                    <span className={f.color}>{f.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">{f.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Card title="Access levels">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 font-black text-gray-600">Role</th>
                      <th className="text-left py-2 font-black text-gray-600">Inventory</th>
                      <th className="text-left py-2 font-black text-gray-600">Sales</th>
                      <th className="text-left py-2 font-black text-gray-600">Reports</th>
                      <th className="text-left py-2 font-black text-gray-600">Users</th>
                      <th className="text-left py-2 font-black text-gray-600">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { role: "Admin", inv: "✅", sales: "✅", rep: "✅", users: "✅", set: "✅" },
                      { role: "Manager", inv: "✅", sales: "✅", rep: "✅", users: "View", set: "❌" },
                      { role: "Staff", inv: "View", sales: "✅", rep: "❌", users: "❌", set: "❌" },
                    ].map(r => (
                      <tr key={r.role}>
                        <td className="py-2 font-bold text-gray-800">{r.role}</td>
                        <td className="py-2">{r.inv}</td>
                        <td className="py-2">{r.sales}</td>
                        <td className="py-2">{r.rep}</td>
                        <td className="py-2">{r.users}</td>
                        <td className="py-2">{r.set}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>

          {/* 8. WhatsApp Bot */}
          <Section id="whatsapp" title="WhatsApp Bot" icon={<Smartphone size={14}/>}>
            <Card>
              <p className="text-sm text-gray-600 leading-relaxed">
                DemandGenius has a WhatsApp bot for quick lookups and commands — no need to open the browser app. Link your account once and get instant access to your store data.
              </p>
            </Card>
            <Card title="Available commands">
              <div className="space-y-2">
                {[
                  { cmd: "hi / hello / help", desc: "Show the welcome message and all available commands" },
                  { cmd: "stores", desc: "List all stores in the network" },
                  { cmd: "stores [city]", desc: "Filter stores by city (e.g. 'stores bangalore')" },
                  { cmd: "[product name]", desc: "Search for a product across all stores (public, no login)" },
                  { cmd: "link [email] [password]", desc: "Link your DemandGenius account to this WhatsApp number" },
                  { cmd: "low stock", desc: "View items below their reorder level (requires linked account)" },
                  { cmd: "today", desc: "Today's sales summary for your store" },
                  { cmd: "me", desc: "View your linked account info" },
                  { cmd: "logout", desc: "Unlink this WhatsApp number from your account" },
                ].map(c => (
                  <div key={c.cmd} className="flex gap-3 items-start">
                    <code className="bg-gray-900 text-green-400 text-[10px] font-mono px-2 py-0.5 rounded shrink-0 mt-0.5 whitespace-nowrap">{c.cmd}</code>
                    <p className="text-sm text-gray-600">{c.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Note" accent="amber">
              <p className="text-sm text-gray-600">Phone numbers are for <strong>paid users only</strong>. The bot never shows contact numbers in search results or responses.</p>
            </Card>
          </Section>

          {/* 9. Tips */}
          <Section id="tips" title="Tips & Best Practices" icon={<Star size={14}/>}>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "⚡",
                  title: "Send to multiple vendors",
                  desc: "Don't wait for one response — send outreach to 5–10 vendors in parallel. The thread view tracks all of them independently.",
                },
                {
                  icon: "📸",
                  title: "Be specific in requirements",
                  desc: "Add details like room type, AC/non-AC, vegetarian/non-veg, special dietary needs. More detail = faster, better vendor responses.",
                },
                {
                  icon: "🔄",
                  title: "Follow up if no response",
                  desc: "If a vendor has 'Viewed' but not responded after 24 hours, use 'Re-send Email' or 'Re-send WA' to nudge them.",
                },
                {
                  icon: "📋",
                  title: "Use the Copy Link option",
                  desc: "The response link works on any channel — paste it into SMS, Telegram, or a phone call to give vendors another way to respond.",
                },
                {
                  icon: "📱",
                  title: "Install as PWA",
                  desc: "Add DemandGenius to your home screen for instant access. Works offline and loads faster than a browser tab.",
                },
                {
                  icon: "🔔",
                  title: "Hit Refresh after sending",
                  desc: "After sending outreach, click Refresh in the Outreach panel. Once a vendor views the link, the status updates to 'Viewed' instantly.",
                },
                {
                  icon: "💬",
                  title: "Use AI Assistant for ideas",
                  desc: "Not sure what to ask for? Chat with the AI in the Explore panel — it can suggest vendors, estimate budgets, and help you draft requirements.",
                },
                {
                  icon: "📅",
                  title: "Set a realistic budget",
                  desc: "Including a budget range helps vendors self-qualify. You'll get fewer mismatched responses and faster confirmations.",
                },
              ].map(t => (
                <div key={t.title} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3">
                  <span className="text-2xl shrink-0">{t.icon}</span>
                  <div>
                    <p className="text-xs font-black text-gray-900">{t.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer CTA */}
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-8 text-center text-white space-y-4">
            <p className="text-xl font-black">Ready to get started?</p>
            <p className="text-sky-100 text-sm">Create your first service inquiry in under 2 minutes.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/explore" className="bg-white text-sky-600 font-black text-sm px-6 py-2.5 rounded-xl hover:bg-sky-50 transition-colors">
                Open Explore →
              </Link>
              <Link href="/faq" className="bg-white/10 text-white font-black text-sm px-6 py-2.5 rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                View FAQ
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
