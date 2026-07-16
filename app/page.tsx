"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import { InstallAppBadge } from "../components/InstallApp";
import {
  BarChart3, Package, Shield, ArrowRight, Star,
  Zap, Globe, Users, Truck, Leaf, Pill, Wrench, ShoppingCart, Store,
  CheckCircle, ChevronRight, LayoutDashboard, Bell, Search,
  MapPin, Phone, CreditCard, FileText, Brain, RefreshCw,
  Bot, FileSpreadsheet, GraduationCap, Briefcase, School, Database, Car, ShieldCheck,
} from "lucide-react";

/* -- INDUSTRIES --------------------------------------- */
const ALL_INDUSTRIES = [
  {
    moduleId: "grocery",
    icon: ShoppingCart,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-gray-200 hover:border-blue-400",
    title: "Grocery & Retail",
    desc: "Track perishables, manage shelf-life, auto-reorder before stockouts.",
    link: "/login",
  },
  {
    moduleId: "autoparts",
    icon: Wrench,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-gray-200 hover:border-orange-400",
    title: "Auto Parts",
    desc: "SKU-level parts inventory with supplier lead times and demand forecasting.",
    link: "/login",
  },
  {
    moduleId: "pharmacy",
    icon: Pill,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-gray-200 hover:border-pink-400",
    title: "Pharma & Medical",
    desc: "Batch tracking, expiry alerts, and regulatory-ready audit trails.",
    link: "/login",
  },
  {
    moduleId: "krishna",
    icon: Store,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-gray-200 hover:border-amber-400",
    title: "Krishna Store",
    desc: "Neighbourhood kirana retail — mixed grocery, household and daily essentials.",
    link: "/login",
  },
  {
    moduleId: "tea",
    icon: Leaf,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-gray-200 hover:border-green-400",
    title: "Tea Procurement",
    desc: "Full grower-to-factory workflow: collections, dispatch, settlements, payments.",
    link: "/tea",
    badge: "Live Demo ->",
  },
];

/* -- FEATURES ----------------------------------------- */
const features = [
  {
    icon: BarChart3,
    color: "text-teal-600",
    bg: "bg-teal-50",
    title: "Real-Time Analytics",
    desc: "Live dashboards with sales velocity, stock turns, and revenue tracking — updated every minute.",
  },
  {
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    title: "AI-Powered Forecasting",
    desc: "Claude-powered demand predictions that reduce over-ordering by up to 35% and stockouts by 40%.",
  },
  {
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Smart Inventory",
    desc: "Multi-unit tracking (kg, pcs, boxes), barcode support, batch numbers, and expiry management.",
  },
  {
    icon: Bell,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Intelligent Alerts",
    desc: "Reorder reminders, expiry warnings, and anomaly detection before they become problems.",
  },
  {
    icon: Users,
    color: "text-green-600",
    bg: "bg-green-50",
    title: "Multi-User Roles",
    desc: "Owner, manager, staff — each with fine-grained permissions and a full audit log.",
  },
  {
    icon: Globe,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    title: "Public Store Search",
    desc: "Customers can find your store on the Explore page — with map links and product search.",
  },
  {
    icon: Truck,
    color: "text-orange-600",
    bg: "bg-orange-50",
    title: "Procurement & POs",
    desc: "Raise purchase orders, track supplier deliveries, and auto-update stock on receipt.",
  },
  {
    icon: Shield,
    color: "text-red-600",
    bg: "bg-red-50",
    title: "Enterprise Security",
    desc: "JWT auth, RBAC, rate limiting, CORS, audit logs, and per-tenant data isolation.",
  },
];

/* -- USER JOURNEYS ------------------------------------- */
const journeys = [
  {
    role: "Store Owner",
    color: "text-teal-700",
    dot: "bg-teal-500",
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
    color: "text-green-700",
    dot: "bg-green-500",
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
    color: "text-amber-700",
    dot: "bg-amber-500",
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
    color: "text-emerald-700",
    dot: "bg-emerald-500",
    steps: [
      { icon: Leaf,    label: "Register growers & rates" },
      { icon: Package, label: "Log daily collections" },
      { icon: Truck,   label: "Dispatch to factory" },
      { icon: CreditCard, label: "Settle factory invoices" },
      { icon: Users,   label: "Pay growers weekly" },
    ],
  },
];

/* -- BENEFITS ------------------------------------------ */
const benefits = [
  { stat: "40%",  label: "Fewer stockouts",  sub: "AI reorder recommendations" },
  { stat: "3×",   label: "Faster invoicing", sub: "Automated PO & receipt flow" },
  { stat: "100%", label: "Audit-ready",      sub: "Every action logged" },
  { stat: "∞",    label: "Tenants & stores", sub: "True multi-tenant SaaS" },
];

/* -- TESTIMONIALS -------------------------------------- */
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

  const [enabledModules, setEnabledModules] = useState<string[]>(["grocery", "pharmacy", "autoparts", "krishna", "tea"]);
  useEffect(() => {
    fetch("/v1/public/platform-config")
      .then(r => r.json())
      .then(d => {
        const mods: string[] = d?.data?.enterprise_apps?.enabled_modules;
        if (Array.isArray(mods) && mods.length) setEnabledModules(mods);
      })
      .catch(() => {});
  }, []);
  const industries = ALL_INDUSTRIES.filter(ind => enabledModules.includes(ind.moduleId));

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ──── NAV ──── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">DemandGeniusAI</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none mt-1">Agentic Intelligence Delivered.</p>
            </div>
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <a href="mailto:paariwalaconnect@gmail.com" className="flex items-center gap-2 text-xs text-gray-500 hover:text-teal-600 transition-colors bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <img src="/contact_avatar.jpg" alt="Contact Avatar" className="w-5 h-5 rounded-full object-cover border border-gray-200" />
              <span>paariwalaconnect@gmail.com</span>
            </a>
            <Link href="/register" className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold transition-all">
              Get Started
            </Link>
          </div>
          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <a href="mailto:paariwalaconnect@gmail.com" className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-slate-50 border border-gray-200 px-2.5 py-1 rounded-xl">
              <img src="/contact_avatar.jpg" alt="Contact" className="w-4 h-4 rounded-full object-cover" />
              <span>paariwalaconnect@gmail.com</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ──── HERO ──── */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
        <div className={`max-w-7xl mx-auto px-4 py-14 sm:py-20 text-center transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold mb-6 border border-white/20">
            <Zap size={12} className="text-yellow-300" /> AI-powered · Multi-tenant · Domain-specific
          </span>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-4">
            DemandGeniusAI<br />
            <span className="text-yellow-300">Agentic Intelligence Delivered.</span>
          </h1>

          <p className="text-teal-100 text-sm sm:text-base max-w-xl mx-auto mb-10">
            Interactive multi-tenant ecosystem connecting store owners, tea brokers, and local search visitors through intelligent forecasting and verified geo-location maps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            {/* Card 1: Store Owner */}
            <div className="bg-white border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-indigo-600 font-black bg-indigo-50 px-2.5 py-1 rounded-full">I AM A Merchant / Owner</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                    <BarChart3 className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">DemandGeniusAI Business</h3><InstallAppBadge label="DemandGeniusAI" /></div>
                    <p className="text-[10px] text-gray-400">Inventory & forecasting suite</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Manage stock levels dynamically, access AI-powered forecast reports, customize system settings, and broadcast offer alerts to WhatsApp verified customers.
                </p>
              </div>
              <div className="flex gap-2.5 pt-4 border-t border-gray-100">
                <Link href="/register" className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Register
                </Link>
                <Link href="/login" className="flex-1 text-center border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Login
                </Link>
              </div>
            </div>

            {/* Card 2: Student / Job Seeker */}
            <div className="bg-white border-2 border-gray-200 hover:border-fuchsia-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-fuchsia-600 font-black bg-fuchsia-50 px-2.5 py-1 rounded-full">I AM A Student / Job Seeker</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-fuchsia-50 rounded-xl flex items-center justify-center border border-fuchsia-100 shrink-0">
                    <School className="text-fuchsia-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">College360</h3><InstallAppBadge label="College360" /></div>
                    <p className="text-[10px] text-gray-400">Internships, Mentors &amp; AI Prep</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  An AI-powered career platform for college students — find internships, practice interviews with AI, and connect with industry mentors.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <Link href="/college360" className="block text-center bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all">
                  Open College360
                </Link>
              </div>
            </div>

            {/* Card 3: Data Pipeline RPA */}
            <div className="bg-white border-2 border-gray-200 hover:border-emerald-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-emerald-600 font-black bg-emerald-50 px-2.5 py-1 rounded-full">I AM A Data / Ops Team</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                    <Database className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">Data360</h3><InstallAppBadge label="Data360" /></div>
                    <p className="text-[10px] text-gray-400">Nexus Flow RPA Engine</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Ingest Excel, PDF, screenshots, or voice — an AI validation agent flags anomalies, a human approval gate reviews them, then verified rows distribute to a file, cloud storage, or an RPA target.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <Link href="/data360" className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open Data360
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- AI PRODUCT SUITE -- */}
      <section className="px-4 py-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 text-xs px-3 py-1 rounded-full mb-4 font-bold">
              <Bot size={11} /> AI Product Suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Agentic Intelligence Delivered.</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-xl mx-auto">
              Autonomous agents that plan, act, and hand off work across your enterprise - no manual babysitting required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* EnterpriseAgent360 */}
            <div className="bg-slate-50 border border-gray-200 hover:border-violet-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-violet-700 font-black bg-violet-100 px-2.5 py-1 rounded-full">Multi-Agent Automation</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center border border-violet-200 shrink-0">
                    <Bot className="text-violet-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">EnterpriseAgent360</h3><InstallAppBadge label="EnterpriseAgent360" /></div>
                    <p className="text-[10px] text-gray-400">Agentic Intelligence Delivered.</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Deploy autonomous AI agents that plan, execute, and orchestrate enterprise workflows end-to-end - forecasting, procurement, and reporting, coordinated without manual handoffs.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/enterprise360" className="block text-center bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Explore EnterpriseAgent360
                </Link>
              </div>
            </div>

            {/* Lex360 */}
            <div className="bg-slate-50 border border-gray-200 hover:border-sky-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-sky-700 font-black bg-sky-100 px-2.5 py-1 rounded-full">Legacy Modernization</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center border border-sky-200 shrink-0">
                    <FileSpreadsheet className="text-sky-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">Lex360</h3><InstallAppBadge label="Lex360" /></div>
                    <p className="text-[10px] text-gray-400">Legacy Excel &rarr; Web App</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Turn brittle, macro-laden spreadsheets into a fast, shareable web application - AI extracts the logic, rebuilds the workflow, and keeps your team out of Excel.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/lex360" className="block text-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open Lex360
                </Link>
              </div>
            </div>

            {/* Route360 */}
            <div className="bg-slate-50 border border-gray-200 hover:border-orange-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-orange-700 font-black bg-orange-100 px-2.5 py-1 rounded-full">Logistics Matching</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center border border-orange-200 shrink-0">
                    <Truck className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">Route360</h3><InstallAppBadge label="Route360" /></div>
                    <p className="text-[10px] text-gray-400">Zero Empty Miles. Full Earnings.</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Real-time backhaul matching connects returning drivers with waiting cargo across India, with an AI assistant for routes, rates, and fuel-cost planning.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/route360" className="block text-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open Route360
                </Link>
              </div>
            </div>

            {/* Edu360 */}
            <div className="bg-slate-50 border border-gray-200 hover:border-indigo-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-indigo-700 font-black bg-indigo-100 px-2.5 py-1 rounded-full">Admissions Discovery</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200 shrink-0">
                    <GraduationCap className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">Edu360</h3><InstallAppBadge label="Edu360" /></div>
                    <p className="text-[10px] text-gray-400">Schools, Colleges & Coaching</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Connects students and parents with the right schools, colleges, universities, and coaching institutes — search by board, stream, or city, all in one place.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/edu360" className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open Edu360
                </Link>
              </div>
            </div>

            {/* Jobs */}
            <div className="bg-slate-50 border border-gray-200 hover:border-blue-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-blue-700 font-black bg-blue-100 px-2.5 py-1 rounded-full">Careers Marketplace</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200 shrink-0">
                    <Briefcase className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">Nexus Talent</h3><InstallAppBadge label="Nexus Talent" /></div>
                    <p className="text-[10px] text-gray-400">Jobs &amp; Talent · India</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Post jobs or build an AI-generated resume, then search and apply across categories and cities — with direct WhatsApp and email outreach.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/jobs" className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open Nexus Talent
                </Link>
              </div>
            </div>

            {/* RideConnect360 */}
            <div className="bg-slate-50 border border-gray-200 hover:border-amber-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-amber-700 font-black bg-amber-100 px-2.5 py-1 rounded-full">Driver Ride Matching</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200 shrink-0">
                    <Car className="text-amber-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">RideConnect360</h3><InstallAppBadge label="RideConnect360" /></div>
                    <p className="text-[10px] text-gray-400">Track. Match. Save.</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Auto and cab drivers track every paid ride on a live map, get AI cost tips on empty runs, match with nearby ride or parcel requests, and auto-save a slice of every fare.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/ride360" className="block text-center bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open RideConnect360
                </Link>
              </div>
            </div>

            {/* SafeRide360 */}
            <div className="bg-slate-50 border border-gray-200 hover:border-teal-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-teal-700 font-black bg-teal-100 px-2.5 py-1 rounded-full">Child Safety Transport</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center border border-teal-200 shrink-0">
                    <ShieldCheck className="text-teal-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">SafeRide360</h3><InstallAppBadge label="SafeRide360" /></div>
                    <p className="text-[10px] text-gray-400">Where is my child?</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Live school pickup/drop tracking for parents and drivers — real-time vehicle location, pickup/absent status per child, and instant WhatsApp alerts for delays or emergencies.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/saferide360" className="block text-center bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open SafeRide360
                </Link>
              </div>
            </div>

            {/* Tea Procurement */}
            <div className="bg-slate-50 border border-gray-200 hover:border-emerald-400 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-emerald-700 font-black bg-emerald-100 px-2.5 py-1 rounded-full">Supply Chain Automation</span>
                <div className="my-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200 shrink-0">
                    <Leaf className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5"><h3 className="font-black text-base text-gray-900">TeaLeaf Collect</h3><InstallAppBadge label="TeaLeaf Collect" /></div>
                    <p className="text-[10px] text-gray-400">Supply-chain &amp; settlements</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  Record daily batch collections from tea growers, manage dispatcher logistics, generate factory invoices, track settlements, and initiate secure weekly grower payments.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/tea" className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  Open Tea Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- BENEFIT STATS -- */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b) => (
            <div key={b.stat} className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-teal-300 hover:shadow-md transition">
              <div className="text-3xl font-black text-gray-900">{b.stat}</div>
              <div className="text-sm font-bold text-gray-700 mt-1">{b.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{b.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* -- INDUSTRY VERTICALS -- */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Built for your industry</h2>
            <p className="text-gray-500 mt-2 text-sm">Domain-specific workflows, not generic software.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <Link key={ind.title} href={ind.link}
                  className={`group relative bg-white border ${ind.border} rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg`}>
                  {ind.badge && (
                    <span className="absolute top-3 right-3 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 font-semibold">
                      {ind.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 ${ind.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={20} className={ind.color} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{ind.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{ind.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-400 group-hover:text-teal-600 transition">
                    Explore <ChevronRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* -- FEATURES GRID -- */}
      <section className="px-4 py-16 bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Everything you need</h2>
            <p className="text-gray-500 mt-2 text-sm">From day-1 setup to enterprise scale — no add-ons required.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-slate-50 border border-gray-200 hover:border-teal-300 rounded-2xl p-5 transition-all">
                  <div className={`w-9 h-9 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={17} className={f.color} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -- USER JOURNEYS -- */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">User Journeys</h2>
            <p className="text-gray-500 mt-2 text-sm">Every role has a tailored workflow — from owner to guest.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {journeys.map((j) => (
              <div key={j.role} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className={`w-2 h-2 rounded-full ${j.dot}`} />
                  <span className={`text-sm font-bold ${j.color}`}>{j.role}</span>
                </div>
                <div className="space-y-3">
                  {j.steps.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Icon size={12} className="text-gray-500" />
                        </div>
                        <span className="text-gray-600 text-xs">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- TEA MODULE SPOTLIGHT -- */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                  <Leaf size={18} className="text-green-600" />
                </div>
                <span className="text-green-700 font-bold text-sm">Tea Procurement Module</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">
                From leaf to ledger — every step tracked
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                The Tea Procurement module handles the complete small-holder tea supply chain:
                register growers, log daily collections by grade, dispatch to factories, settle
                invoices, and pay growers weekly — with AI rate recommendations and cash-flow risk alerts.
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
                    <CheckCircle size={12} className="text-green-600 shrink-0" />
                    <span className="text-gray-600 text-xs">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/tea"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
                Open Tea App <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mini dashboard preview */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-white border border-green-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-xs font-bold">Today's Overview</span>
                  <RefreshCw size={11} className="text-gray-300" />
                </div>
                {[
                  { label: "KG Collected",       value: "374.7 kg", color: "text-green-600" },
                  { label: "Active Growers",      value: "3",        color: "text-blue-600" },
                  { label: "Dispatches Pending",  value: "1",        color: "text-amber-600" },
                  { label: "Factory Receivable",  value: "₹12,378",  color: "text-violet-600" },
                  { label: "Grower Payments Due", value: "₹8,390",   color: "text-orange-600" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-400 text-xs">{row.label}</span>
                    <span className={`font-bold text-xs ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- PUBLIC EXPLORE -- */}
      <section className="px-4 py-16 bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-50 border border-gray-200 rounded-3xl p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Search size={16} className="text-amber-600" />
                <span className="text-amber-700 font-bold text-sm">Public Explore</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Find any store, anywhere</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Customers can discover stores on the Explore page — search by name or product,
                filter by city or domain, sort by distance, toggle card/grid layout, open Google Maps,
                and reveal the store phone number.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Search & filter","Nearby stores","Google Maps","Phone reveal","Card / Grid view","Domain filters"].map(t => (
                  <span key={t} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-500">{t}</span>
                ))}
              </div>
              <Link href="/explore"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
                Try Explore <ArrowRight size={14} />
              </Link>
            </div>
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <Search size={12} className="text-gray-300" />
                  <span className="text-gray-400">Search stores or products…</span>
                </div>
                {[
                  { name: "FreshMart Koramangala", type: "Grocery", dist: "0.8 km" },
                  { name: "AutoZone Whitefield",   type: "Auto Parts", dist: "2.1 km" },
                  { name: "MedCare Indiranagar",   type: "Pharmacy", dist: "3.4 km" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between bg-slate-50 border border-gray-100 rounded-xl px-3 py-2.5">
                    <div>
                      <div className="text-gray-700 font-semibold text-[11px]">{s.name}</div>
                      <div className="text-gray-400 text-[10px]">{s.type}</div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                      <MapPin size={9} /> {s.dist}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- TESTIMONIALS -- */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-10">What our customers say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="text-gray-900 text-xs font-bold">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-teal-700 to-emerald-600 rounded-3xl p-10 text-white">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Ready to get started?</h2>
            <p className="text-teal-100 text-sm mb-8">
              Free plan · No credit card · Set up in minutes
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 hover:bg-teal-50 px-7 py-3.5 rounded-xl font-bold text-sm transition-all">
                Create Free Account <ArrowRight size={15} />
              </Link>
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-all">
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
