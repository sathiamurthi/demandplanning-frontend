"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import {
  BarChart3, Package, TrendingUp, Shield, ArrowRight, Star,
  Zap, Globe, Users, Truck, Leaf, Pill, Wrench, ShoppingCart,
  CheckCircle, ChevronRight, LayoutDashboard, Bell, Search,
  MapPin, Phone, CreditCard, FileText, Brain, RefreshCw, Navigation2,
} from "lucide-react";

/* â”€â”€ INDUSTRIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const industries = [
  {
    icon: ShoppingCart,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/50",
    title: "Grocery & Retail",
    desc: "Track perishables, manage shelf-life, auto-reorder before stockouts.",
    link: "/login",
  },
  {
    icon: Wrench,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20 hover:border-orange-500/50",
    title: "Auto Parts",
    desc: "SKU-level parts inventory with supplier lead times and demand forecasting.",
    link: "/login",
  },
  {
    icon: Pill,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20 hover:border-pink-500/50",
    title: "Pharma & Medical",
    desc: "Batch tracking, expiry alerts, and regulatory-ready audit trails.",
    link: "/login",
  },
  {
    icon: Leaf,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20 hover:border-green-500/50",
    title: "Tea Procurement",
    desc: "Full grower-to-factory workflow: collections, dispatch, settlements, payments.",
    link: "/tea",
    badge: "Live Demo â†’",
  },
];

/* â”€â”€ FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const features = [
  {
    icon: BarChart3,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    title: "Real-Time Analytics",
    desc: "Live dashboards with sales velocity, stock turns, and revenue tracking â€” updated every minute.",
  },
  {
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    title: "AI-Powered Forecasting",
    desc: "Claude-powered demand predictions that reduce over-ordering by up to 35% and stockouts by 40%.",
  },
  {
    icon: Package,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "Smart Inventory",
    desc: "Multi-unit tracking (kg, pcs, boxes), barcode support, batch numbers, and expiry management.",
  },
  {
    icon: Bell,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    title: "Intelligent Alerts",
    desc: "Reorder reminders, expiry warnings, and anomaly detection before they become problems.",
  },
  {
    icon: Users,
    color: "text-green-400",
    bg: "bg-green-500/10",
    title: "Multi-User Roles",
    desc: "Owner, manager, staff â€” each with fine-grained permissions and a full audit log.",
  },
  {
    icon: Globe,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    title: "Public Store Search",
    desc: "Customers can find your store on the Explore page â€” with map links and product search.",
  },
  {
    icon: Truck,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    title: "Procurement & POs",
    desc: "Raise purchase orders, track supplier deliveries, and auto-update stock on receipt.",
  },
  {
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-500/10",
    title: "Enterprise Security",
    desc: "JWT auth, RBAC, rate limiting, CORS, audit logs, and per-tenant data isolation.",
  },
];

/* â”€â”€ USER JOURNEYS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const journeys = [
  {
    role: "Store Owner",
    color: "text-indigo-400",
    dot: "bg-indigo-400",
    steps: [
      { icon: LayoutDashboard, label: "View live dashboard" },
      { icon: Bell,            label: "Receive low-stock alerts" },
      { icon: FileText,        label: "Raise purchase orders" },
      { icon: BarChart3,       label: "Review AI sales forecast" },
      { icon: CreditCard,      label: "Track revenue & payments" },
    ],
  },
  {
    role: "Staff / Manager",
    color: "text-green-400",
    dot: "bg-green-400",
    steps: [
      { icon: Package,    label: "Add & update inventory" },
      { icon: ShoppingCart, label: "Record sales at POS" },
      { icon: Search,     label: "Search items by barcode" },
      { icon: Truck,      label: "Receive purchase orders" },
      { icon: FileText,   label: "Generate stock reports" },
    ],
  },
  {
    role: "Guest / Customer",
    color: "text-yellow-400",
    dot: "bg-yellow-400",
    steps: [
      { icon: Search,  label: "Search all local stores" },
      { icon: MapPin,  label: "Filter by location / pin" },
      { icon: Globe,   label: "Open store on Google Maps" },
      { icon: Phone,   label: "Reveal store phone number" },
      { icon: Package, label: "Browse available products" },
    ],
  },
  {
    role: "Tea Procurement",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    steps: [
      { icon: Leaf,    label: "Register growers & rates" },
      { icon: Package, label: "Log daily collections" },
      { icon: Truck,   label: "Dispatch to factory" },
      { icon: CreditCard, label: "Settle factory invoices" },
      { icon: Users,   label: "Pay growers weekly" },
    ],
  },
];

/* â”€â”€ BENEFITS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const benefits = [
  { stat: "40%",  label: "Fewer stockouts",       sub: "AI reorder recommendations" },
  { stat: "3Ã—",   label: "Faster invoicing",      sub: "Automated PO & receipt flow" },
  { stat: "100%", label: "Audit-ready",            sub: "Every action logged" },
  { stat: "âˆž",    label: "Tenants & stores",       sub: "True multi-tenant SaaS" },
];

/* â”€â”€ TESTIMONIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const testimonials = [
  {
    name: "Ravi Kumar",
    role: "FreshMart, Bangalore",
    text: "Went from spreadsheets to live dashboards in one day. Stockouts dropped by half.",
  },
  {
    name: "Priya Mehta",
    role: "MedCare Pharmacy, Indiranagar",
    text: "Expiry tracking alone saved us ₹80K in write-offs last quarter.",
  },
  {
    name: "ABC Tea Agency",
    role: "Nilgiris, Tamil Nadu",
    text: "The tea module handles our entire grower-to-factory workflow end to end.",
  },
];

/* ──── COMPONENT ────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#07090f] text-white flex flex-col overflow-x-hidden">

      {/* ──── NAV ──── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/4 backdrop-blur-xl border border-white/8 rounded-2xl px-5 py-3 shadow-xl shadow-black/20">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">DemandGenius</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/explore" className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/6 transition-all">
              <Search size={11} /> Explore
            </Link>
            <Link href="/tea" className="flex items-center gap-1.5 text-green-400/80 hover:text-green-300 text-xs px-3 py-1.5 rounded-lg hover:bg-green-500/8 transition-all">
              <Leaf size={11} /> TeaLeaf Collect Pro
            </Link>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Link href="/login" className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/6 transition-all">
              Log in
            </Link>
            <Link href="/register" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-medium transition-all">
              Get Started
            </Link>
          </nav>
          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <Link href="/explore" className="text-xs border border-white/15 text-white/70 px-3 py-1.5 rounded-lg">Explore</Link>
            <Link href="/login" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg">Login</Link>
          </div>
        </div>
      </header>

      {/* ──── HERO ──── */}
      <section className="relative px-4 pt-28 pb-20 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-32 left-1/3 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
        </div>

        <div className={`relative transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full mb-6">
            <Zap size={11} /> AI-powered · Multi-tenant · Domain-specific
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            DemandGenius<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              smart local commerce
            </span>
          </h1>

          <p className="mt-4 text-white/50 max-w-xl mx-auto text-sm">
            Interactive multi-tenant ecosystem connecting store owners, tea brokers, and local search visitors through intelligent forecasting and verified geo-location maps.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            {/* Card 1: Store Owner */}
            <div className="bg-[#0f1218] border border-indigo-500/20 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/40 hover:-translate-y-1 transition-all shadow-xl shadow-indigo-950/10">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-indigo-400 font-black bg-indigo-500/10 px-2.5 py-1 rounded-full">I AM A Merchant / Owner</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/25 shrink-0">
                    <BarChart3 className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">DemandGenius Business</h3>
                    <p className="text-[10px] text-white/40">Inventory & forecasting suite</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-6">
                  Manage stock levels dynamically, access AI-powered forecast reports, customize system settings, and broadcast offer alerts to WhatsApp verified customers.
                </p>
              </div>
              <div className="flex gap-2.5 pt-4 border-t border-white/5">
                <Link href="/register" className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors">
                  Register
                </Link>
                <Link href="/login" className="flex-1 text-center border border-white/10 hover:bg-white/5 text-white/80 text-xs font-medium py-2.5 rounded-lg transition-colors">
                  Login
                </Link>
              </div>
            </div>

            {/* Card 2: Visitor / Explorer */}
            <div className="bg-[#0f1218] border border-orange-500/20 rounded-2xl p-6 flex flex-col justify-between hover:border-orange-500/40 hover:-translate-y-1 transition-all shadow-xl shadow-orange-950/10">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-orange-400 font-black bg-orange-500/10 px-2.5 py-1 rounded-full">I AM A Customer / Explorer</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/25 shrink-0">
                    <Navigation2 className="text-orange-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Local Explorer</h3>
                    <p className="text-[10px] text-white/40">Verified nearby directory</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-6">
                  <strong>Our Aim:</strong> To instantly connect you with verified local pharmacies, restaurants, grocers, and hotels. Find real-time coordinates, products, and direct contact options.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <Link href="/explore" className="block text-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-500/15">
                  Explore Nearby
                </Link>
              </div>
            </div>

            {/* Card 3: Tea Procurement */}
            <div className="bg-[#0f1218] border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all shadow-xl shadow-emerald-950/10">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-black bg-emerald-500/10 px-2.5 py-1 rounded-full">I AM A Tea Broker / Grower</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/25 shrink-0">
                    <Leaf className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">TeaLeaf Collect</h3>
                    <p className="text-[10px] text-white/40">Supply-chain & settlements</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-6">
                  Record daily batch collections from tea growers, manage dispatcher logistics, generate factory invoices, track settlements, and initiate secure weekly grower payments.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <Link href="/tea" className="block text-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors">
                  Open Tea Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ BENEFIT STATS â”€â”€ */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b) => (
            <div key={b.stat} className="bg-white/4 border border-white/8 rounded-2xl p-5 text-center hover:border-white/15 transition">
              <div className="text-3xl font-black text-white">{b.stat}</div>
              <div className="text-sm font-semibold text-white/80 mt-1">{b.label}</div>
              <div className="text-xs text-white/40 mt-0.5">{b.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ INDUSTRY VERTICALS â”€â”€ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Built for your industry</h2>
            <p className="text-white/40 mt-2 text-sm">Domain-specific workflows, not generic software.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <Link key={ind.title} href={ind.link}
                  className={`group relative bg-[#0f1218] border ${ind.border} rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl`}>
                  {ind.badge && (
                    <span className="absolute top-3 right-3 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                      {ind.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 ${ind.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={20} className={ind.color} />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2">{ind.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{ind.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-white/30 group-hover:text-white/60 transition">
                    Explore <ChevronRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* â”€â”€ FEATURES GRID â”€â”€ */}
      <section className="px-4 pb-20 bg-[#0a0c12]">
        <div className="max-w-5xl mx-auto pt-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Everything you need</h2>
            <p className="text-white/40 mt-2 text-sm">From day-1 setup to enterprise scale â€” no add-ons required.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-[#0d1017] border border-white/6 hover:border-white/12 rounded-2xl p-5 transition-all">
                  <div className={`w-9 h-9 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={17} className={f.color} />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* â”€â”€ USER JOURNEYS â”€â”€ */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">User Journeys</h2>
            <p className="text-white/40 mt-2 text-sm">Every role has a tailored workflow â€” from owner to guest.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {journeys.map((j) => (
              <div key={j.role} className="bg-[#0f1218] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className={`w-2 h-2 rounded-full ${j.dot}`} />
                  <span className={`text-sm font-semibold ${j.color}`}>{j.role}</span>
                </div>
                <div className="space-y-3">
                  {j.steps.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                          <Icon size={12} className="text-white/50" />
                        </div>
                        <span className="text-white/60 text-xs">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ TEA MODULE SPOTLIGHT â”€â”€ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-green-950/60 to-emerald-950/30 border border-green-500/20 rounded-3xl p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center">
                  <Leaf size={18} className="text-green-400" />
                </div>
                <span className="text-green-400 font-semibold text-sm">Tea Procurement Module</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">
                From leaf to ledger â€” every step tracked
              </h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                The Tea Procurement module handles the complete small-holder tea supply chain:
                register growers, log daily collections by grade, dispatch to factories, settle
                invoices, and pay growers weekly â€” with AI rate recommendations and cash-flow risk alerts.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  "Grower registration & land records",
                  "Daily batch collections (Grade A/B/C)",
                  "Factory dispatch with vehicle tracking",
                  "Automated factory settlement",
                  "Weekly grower payment runs",
                  "AI rate & forecast recommendations",
                  "Daily & weekly reports",
                  "Cash-flow risk alerts",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-green-400 shrink-0" />
                    <span className="text-white/60 text-xs">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/tea"
                className="inline-flex items-center gap-2 bg-green-600/80 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                Open Tea App <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mini dashboard preview */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-[#0a0f0c] border border-green-500/15 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 text-xs font-semibold">Today's Overview</span>
                  <RefreshCw size={11} className="text-white/20" />
                </div>
                {[
                  { label: "KG Collected",       value: "374.7 kg", color: "text-green-400" },
                  { label: "Active Growers",      value: "3",        color: "text-blue-400" },
                  { label: "Dispatches Pending",  value: "1",        color: "text-yellow-400" },
                  { label: "Factory Receivable",  value: "â‚¹12,378",  color: "text-purple-400" },
                  { label: "Grower Payments Due", value: "â‚¹8,390",   color: "text-orange-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40 text-xs">{row.label}</span>
                    <span className={`font-bold text-xs ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ PUBLIC EXPLORE â”€â”€ */}
      <section className="px-4 pb-20 bg-[#0a0c12]">
        <div className="max-w-5xl mx-auto pt-16">
          <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Search size={16} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">Public Explore</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Find any store, anywhere</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Customers can discover stores on the Explore page â€” search by name or product,
                filter by city or domain, sort by distance, toggle card/grid layout, open Google Maps,
                and reveal the store phone number.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Search & filter","Nearby stores","Google Maps","Phone reveal","Card / Grid view","Domain filters"].map(t => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/50">{t}</span>
                ))}
              </div>
              <Link href="/explore"
                className="inline-flex items-center gap-2 bg-yellow-500/80 hover:bg-yellow-500 text-black px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                Try Explore <ArrowRight size={14} />
              </Link>
            </div>
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-[#0a0c10] border border-white/8 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                  <Search size={12} className="text-white/30" />
                  <span className="text-white/30">Search stores or productsâ€¦</span>
                </div>
                {[
                  { name: "FreshMart Koramangala", type: "Grocery", dist: "0.8 km" },
                  { name: "AutoZone Whitefield",   type: "Auto Parts", dist: "2.1 km" },
                  { name: "MedCare Indiranagar",   type: "Pharmacy", dist: "3.4 km" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between bg-white/3 border border-white/6 rounded-xl px-3 py-2.5">
                    <div>
                      <div className="text-white/70 font-medium text-[11px]">{s.name}</div>
                      <div className="text-white/30 text-[10px]">{s.type}</div>
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-[10px]">
                      <MapPin size={9} /> {s.dist}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ TESTIMONIALS â”€â”€ */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">What our customers say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#0f1218] border border-white/8 rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="text-white/90 text-xs font-semibold">{t.name}</div>
                  <div className="text-white/30 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€ */}
      <section className="px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/20 rounded-3xl p-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-white/50 text-sm mb-8">
              Free plan Â· No credit card Â· Set up in minutes
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/25">
                Create Free Account <ArrowRight size={15} />
              </Link>
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-white/70 hover:text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-all">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
