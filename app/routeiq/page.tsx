"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  Truck, GitMerge, Bot, Settings, MapPin, IndianRupee,
  Clock, Package, Star, ChevronRight, Menu, X, Send,
  RefreshCw, LogOut, Shield, Calculator, TrendingUp,
  ArrowRight, CheckCircle, Loader2, User, Plus, Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type View = "landing" | "auth" | "dashboard" | "matchboard" | "ai" | "settings";
type Role = "driver" | "shipper" | "lender";

interface RUser { name: string; role: Role; email: string; }

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_MATCHES = [
  { id:"m1", score:94, from:"Mumbai",    to:"Pune",       cargo:"Electronics · 2.5T",  rate:8500,  km:148, time:"Tomorrow 8AM",  status:"open" },
  { id:"m2", score:87, from:"Delhi",     to:"Agra",       cargo:"FMCG Goods · 4T",     rate:12000, km:220, time:"Today 4PM",     status:"open" },
  { id:"m3", score:78, from:"Bengaluru", to:"Hyderabad",  cargo:"Auto Parts · 1.8T",   rate:15500, km:575, time:"Tomorrow 6PM",  status:"open" },
  { id:"m4", score:72, from:"Chennai",   to:"Coimbatore", cargo:"Textiles · 3T",        rate:9000,  km:498, time:"Day after",     status:"open" },
  { id:"m5", score:68, from:"Pune",      to:"Mumbai",     cargo:"Machine Parts · 5T",  rate:11000, km:148, time:"Today 7PM",     status:"open" },
];

const MOCK_VEHICLES = [
  { id:"v1", plate:"MH04 AB 1234", model:"Tata 407",        type:"Mini Truck",   cap:"2.5T",  available:true  },
  { id:"v2", plate:"DL01 XY 5678", model:"Ashok Leyland 12","type":"Heavy Truck", cap:"10T",   available:false },
];

const QUICK_PROMPTS = [
  "Best route Mumbai → Delhi",
  "Fuel cost for 575 km",
  "Avg rate for FMCG loads",
  "How to maximise backhaul earnings?",
];

const AI_REPLIES = [
  "Based on current corridor data, the Mumbai–Pune stretch averages ₹55–60/km for 2.5T loads. Leaving by 6 AM helps avoid Khopoli traffic.",
  "For 575 km at 12 km/L efficiency and ₹92/L diesel, your fuel cost is roughly ₹4,408. Factor that into your rate negotiation.",
  "FMCG loads on Delhi–Agra typically fetch ₹50–55/km. You can push to ₹58 if you have a refrigerated unit.",
  "Top tip for maximising backhaul: list your empty return on RouteIQ at least 24 hrs before you leave. 87% of drivers who pre-list get a match.",
];

// ── Auth helpers ───────────────────────────────────────────────────────────────
const AUTH_KEY = "routeiq_user";
const getStoredUser  = (): RUser | null => { try { const s = localStorage.getItem(AUTH_KEY); return s ? JSON.parse(s) : null; } catch { return null; } };
const storeUser      = (u: RUser) => localStorage.setItem(AUTH_KEY, JSON.stringify(u));
const removeUser     = () => localStorage.removeItem(AUTH_KEY);

// ── Role config ────────────────────────────────────────────────────────────────
const ROLE: Record<Role, { label:string; badgeCls:string; iconCls:string }> = {
  driver:  { label:"Driver",  badgeCls:"bg-blue-50 text-blue-700 border-blue-200",   iconCls:"bg-blue-50 text-blue-600" },
  shipper: { label:"Shipper", badgeCls:"bg-teal-50 text-teal-700 border-teal-200",   iconCls:"bg-teal-50 text-teal-600" },
  lender:  { label:"Lender",  badgeCls:"bg-violet-50 text-violet-700 border-violet-200", iconCls:"bg-violet-50 text-violet-600" },
};

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }: { label:string; value:string; sub?:string; icon:ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">{icon}</div>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Match card ─────────────────────────────────────────────────────────────────
function MatchCard({ m, accepted, onAccept }: { m:typeof MOCK_MATCHES[0]; accepted:boolean; onAccept:(id:string)=>void }) {
  const sc = m.score >= 90 ? "bg-emerald-600" : m.score >= 80 ? "bg-teal-500" : "bg-amber-500";
  return (
    <div className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${accepted?"border-teal-300":"border-gray-200 hover:border-teal-300"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${sc} flex items-center justify-center text-white font-black text-sm shrink-0`}>
          {m.score}%
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-[15px]">{m.from}</span>
            <ArrowRight size={13} className="text-teal-500 shrink-0"/>
            <span className="font-bold text-gray-900 text-[15px]">{m.to}</span>
          </div>
          <p className="text-sm text-gray-500 mb-2.5">{m.cargo}</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><IndianRupee size={10}/>₹{m.rate.toLocaleString()}</span>
            <span className="flex items-center gap-1"><MapPin size={10}/>{m.km} km</span>
            <span className="flex items-center gap-1"><Clock size={10}/>{m.time}</span>
          </div>
        </div>
        <div className="shrink-0">
          {accepted
            ? <span className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg"><CheckCircle size={12}/>Accepted</span>
            : <button onClick={() => onAccept(m.id)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95">Accept</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── AI Chat ────────────────────────────────────────────────────────────────────
function AIChat() {
  const [msgs, setMsgs] = useState([
    { role:"ai", text:"Hi! I'm your RouteIQ AI assistant. Ask me about routes, freight rates, fuel costs, or how to maximise your earnings." },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = async (text?: string) => {
    const t = (text || input).trim();
    if (!t) return;
    setInput("");
    setMsgs(p => [...p, { role:"user", text:t }]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 1100 + Math.random()*600));
    setMsgs(p => [...p, { role:"ai", text:AI_REPLIES[Math.floor(Math.random()*AI_REPLIES.length)] }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col" style={{ height:"calc(100vh - 220px)", minHeight:"400px", maxHeight:"640px" }}>
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-2xl mb-3 border border-gray-200">
        {msgs.map((m,i) => (
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            {m.role==="ai" && (
              <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-white shrink-0 mr-2 mt-0.5">
                <Bot size={14}/>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role==="user"
                ? "bg-teal-600 text-white rounded-br-sm"
                : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
            }`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-white shrink-0 mr-2 mt-0.5"><Bot size={14}/></div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay:"0ms"}}/>
              <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay:"150ms"}}/>
              <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay:"300ms"}}/>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      <div className="flex gap-2 mb-2.5">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
          placeholder="Ask about routes, rates, fuel costs…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
        <button onClick={() => send()} disabled={!input.trim() || loading}
          className="w-11 h-11 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shrink-0">
          <Send size={15}/>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-[11px] bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1.5 rounded-full font-medium hover:bg-teal-100 transition">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Rate calculator ────────────────────────────────────────────────────────────
function RateCalc() {
  const [rate, setRate] = useState("55");
  const [fuel, setFuel] = useState("92");
  const [km,   setKm]   = useState("500");
  const gross    = parseFloat(rate||"0") * parseFloat(km||"0");
  const fuelCost = (parseFloat(km||"0") / 12) * parseFloat(fuel||"0");
  const net      = gross - fuelCost;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="font-black text-gray-900 mb-1 flex items-center gap-2"><Calculator size={16} className="text-teal-500"/>Rate Calculator</h3>
      <p className="text-xs text-gray-400 mb-4">Estimate gross earnings and fuel cost for any trip.</p>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {([["₹/km Rate","rate",rate,setRate],["Diesel ₹/L","fuel",fuel,setFuel],["Distance km","km",km,setKm]] as any[]).map(([l,k,v,s]) => (
          <div key={k}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">{l}</label>
            <input type="number" value={v} onChange={e => s(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400"/>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4 text-center">
        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross</p><p className="text-lg font-black text-gray-900">₹{isFinite(gross)?gross.toLocaleString("en-IN",{maximumFractionDigits:0}):"—"}</p></div>
        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fuel</p><p className="text-lg font-black text-red-500">−₹{isFinite(fuelCost)?fuelCost.toLocaleString("en-IN",{maximumFractionDigits:0}):"—"}</p></div>
        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net</p><p className="text-lg font-black text-teal-700">₹{isFinite(net)?net.toLocaleString("en-IN",{maximumFractionDigits:0}):"—"}</p></div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RouteIQPage() {
  const [view,      setView]      = useState<View>("landing");
  const [user,      setUser]      = useState<RUser | null>(null);
  const [authTab,   setAuthTab]   = useState<"login"|"register">("register");
  const [authRole,  setAuthRole]  = useState<Role>("driver");
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [pw,        setPw]        = useState("");
  const [authErr,   setAuthErr]   = useState("");
  const [accepted,  setAccepted]  = useState<string[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [apiKey,    setApiKey]    = useState("");
  const [keySaved,  setKeySaved]  = useState(false);

  useEffect(() => {
    document.title = "RouteIQ — Collaborative Logistics";
    const u = getStoredUser();
    if (u) { setUser(u); setView("dashboard"); }
    return () => { document.title = "NexusOS"; };
  }, []);

  const go = (v: View) => { setView(v); setMobileNav(false); };

  const handleAuth = () => {
    setAuthErr("");
    if (!email.trim() || !pw.trim()) { setAuthErr("Email and password required."); return; }
    if (authTab === "register" && !name.trim()) { setAuthErr("Name required."); return; }
    const u: RUser = { name: authTab==="register" ? name.trim() : (email.split("@")[0]), email: email.trim(), role: authRole };
    storeUser(u); setUser(u); setView("dashboard");
  };

  const handleLogout = () => {
    removeUser(); setUser(null); setView("landing");
    setName(""); setEmail(""); setPw(""); setAuthErr("");
  };

  const handleDemo = () => {
    const u: RUser = { name:"Rajan Kumar", email:"demo@routeiq.in", role:"driver" };
    storeUser(u); setUser(u); setView("dashboard");
  };

  const roleCfg = user ? ROLE[user.role] : ROLE.driver;

  const NAV_ITEMS: [View, string, ReactNode][] = [
    ["dashboard",  "Dashboard",    <TrendingUp size={15}/>],
    ["matchboard", "Match Board",  <GitMerge size={15}/>],
    ["ai",         "AI Assistant", <Bot size={15}/>],
    ["settings",   "Settings",     <Settings size={15}/>],
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans" onClick={() => setMobileNav(false)}>

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <button onClick={() => go(user?"dashboard":"landing")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Truck size={16} className="text-white"/>
            </div>
            <div className="text-left">
              <p className="font-black text-gray-900 text-sm leading-none">RouteIQ</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none">Logistics Platform</p>
            </div>
          </button>

          {/* Desktop nav links (logged in) */}
          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              {NAV_ITEMS.map(([v, l]) => (
                <button key={v} onClick={() => go(v)}
                  className={`hover:text-teal-600 transition ${view===v?"text-teal-600 font-bold":""}`}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            {user ? (
              <>
                <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${roleCfg.badgeCls}`}>
                  {user.role==="driver"?<Truck size={11}/>:user.role==="shipper"?<Package size={11}/>:<IndianRupee size={11}/>}
                  {roleCfg.label}
                </span>
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-sm">
                  {user.name[0]}
                </div>
                {/* Mobile hamburger */}
                <button className="md:hidden p-1 text-gray-500" onClick={() => setMobileNav(p=>!p)}>
                  {mobileNav ? <X size={20}/> : <Menu size={20}/>}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setAuthTab("login"); go("auth"); }}
                  className="hidden sm:block border border-teal-600 text-teal-600 hover:bg-teal-50 font-bold text-sm px-4 py-2 rounded-lg transition">
                  Sign In
                </button>
                <button onClick={() => { setAuthTab("register"); go("auth"); }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav drawer */}
        {user && mobileNav && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-2 space-y-1">
            {NAV_ITEMS.map(([v, l, icon]) => (
              <button key={v} onClick={() => go(v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition ${view===v?"bg-teal-50 text-teal-700":"text-gray-600 hover:bg-gray-50"}`}>
                {icon}{l}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════
          LANDING
      ══════════════════════════════════════════════════════════ */}
      {view === "landing" && (
        <>
          {/* Hero */}
          <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold mb-5 border border-white/20">
                <Star size={12} className="text-yellow-300"/> Backhaul Intelligence · India
              </div>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                Zero Empty Miles.<br/><span className="text-yellow-300">Full Earnings.</span>
              </h1>
              <p className="text-teal-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
                RouteIQ connects returning drivers with waiting cargo — real-time corridor matching for lorries, cabs &amp; rental fleets across India.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => { setAuthTab("register"); go("auth"); }}
                  className="bg-white text-teal-700 hover:bg-teal-50 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition">
                  Get Started Free <ChevronRight size={16}/>
                </button>
                <button onClick={() => { setAuthTab("login"); go("auth"); }}
                  className="border border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3 rounded-xl transition">
                  Sign In
                </button>
                <button onClick={handleDemo}
                  className="border border-white/30 bg-white/5 hover:bg-white/15 text-white/80 font-bold text-sm px-6 py-3 rounded-xl transition">
                  Load Demo
                </button>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5 shrink-0"><Truck size={12} className="text-teal-500"/><strong className="text-gray-900">3,840</strong> Active Drivers</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0"><Package size={12} className="text-teal-500"/><strong className="text-gray-900">1,240</strong> Open Loads</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0"><MapPin size={12} className="text-teal-500"/><strong className="text-gray-900">280+</strong> Corridors</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0 text-green-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"/>Live Matching
              </span>
            </div>
          </div>

          {/* Persona cards */}
          <div className="max-w-7xl mx-auto px-4 py-14">
            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Who uses RouteIQ?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {([
                ["driver",  "Independent Driver",  "Own a vehicle? Find return loads, cut empty miles, and earn more on every trip.",            <Truck size={20}/>],
                ["shipper", "Business Shipper",    "Move goods efficiently — access verified vehicles on-demand across major corridors.",       <Package size={20}/>],
                ["lender",  "Fleet Lender",        "Rent out idle vehicles. Earn passive income on every booking without lifting a finger.",    <IndianRupee size={20}/>],
              ] as [Role,string,string,ReactNode][]).map(([role, title, desc, icon]) => (
                <button key={role} onClick={() => { setAuthRole(role); setAuthTab("register"); go("auth"); }}
                  className="bg-white border-2 border-gray-200 hover:border-teal-400 hover:shadow-lg rounded-2xl p-6 text-left transition-all group">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${ROLE[role].iconCls}`}>
                    {icon}
                  </div>
                  <h3 className="font-black text-gray-900 text-sm mb-2 group-hover:text-teal-700 transition">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          AUTH
      ══════════════════════════════════════════════════════════ */}
      {view === "auth" && (
        <div className="min-h-[calc(100vh-61px)] bg-slate-50 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg">{authTab==="register"?"Create Account":"Welcome Back"}</h2>
              <button onClick={() => go("landing")} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <X size={16}/>
              </button>
            </div>

            <div className="flex bg-gray-100 rounded-xl p-1">
              {(["register","login"] as const).map(t => (
                <button key={t} onClick={() => { setAuthTab(t); setAuthErr(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${authTab===t?"bg-white text-teal-700 shadow":"text-gray-500 hover:text-gray-700"}`}>
                  {t==="register"?"Register":"Sign In"}
                </button>
              ))}
            </div>

            {authTab === "register" && (
              <div className="grid grid-cols-3 gap-2">
                {(["driver","shipper","lender"] as Role[]).map(r => (
                  <button key={r} onClick={() => setAuthRole(r)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition ${authRole===r?"border-teal-500 bg-teal-50 text-teal-700":"border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {r==="driver"?<Truck size={16}/>:r==="shipper"?<Package size={16}/>:<IndianRupee size={16}/>}
                    {ROLE[r].label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {authTab==="register" && (
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              )}
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>

            {authErr && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{authErr}</p>
            )}

            <button onClick={handleAuth}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
              <CheckCircle size={15}/>
              {authTab==="register"?"Create Account":"Sign In"}
            </button>

            <p className="text-center text-xs text-gray-500">
              {authTab==="register"?"Already registered? ":"New here? "}
              <button onClick={() => { setAuthTab(authTab==="register"?"login":"register"); setAuthErr(""); }} className="text-teal-600 font-bold hover:underline">
                {authTab==="register"?"Sign In":"Register"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DASHBOARD
      ══════════════════════════════════════════════════════════ */}
      {view === "dashboard" && user && (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Welcome back, {user.name.split(" ")[0]}</h2>
              <p className="text-sm text-gray-500">Here's your activity at a glance.</p>
            </div>
            <button onClick={() => go("matchboard")}
              className="hidden sm:flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
              View Matches <ChevronRight size={16}/>
            </button>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Matches Today"  value="4"         sub="↑ 2 new since 9AM"    icon={<GitMerge size={16}/>}/>
            <StatCard label="This Month"     value="₹42,500"   sub="12 completed trips"    icon={<IndianRupee size={16}/>}/>
            <StatCard label="Distance"       value="3,840 km"  sub="Month to date"         icon={<MapPin size={16}/>}/>
            <StatCard label="Avg Match Score" value="87%"      sub="Up 4% this week"       icon={<Star size={16}/>}/>
          </div>

          {/* Live ticker */}
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full shrink-0">Live</span>
            <span className="text-gray-600 text-xs">New corridor: <strong>Mumbai → Nashik</strong> — 4 loads available · Best rate ₹62/km</span>
          </div>

          {/* Top matches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Top Matches Right Now</h3>
              <button onClick={() => go("matchboard")} className="text-sm text-teal-600 font-bold hover:underline flex items-center gap-1">
                See all <ChevronRight size={14}/>
              </button>
            </div>
            <div className="space-y-3">
              {MOCK_MATCHES.slice(0,3).map(m => (
                <MatchCard key={m.id} m={m} accepted={accepted.includes(m.id)} onAccept={id => setAccepted(p=>[...p,id])}/>
              ))}
            </div>
          </div>

          {/* Vehicles */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">My Vehicles</h3>
              <button className="flex items-center gap-1.5 text-xs font-bold text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition">
                <Plus size={13}/> Add Vehicle
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_VEHICLES.map(v => (
                <div key={v.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-gray-400"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">{v.plate}</p>
                    <p className="text-xs text-gray-500">{v.model} · {v.cap}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${v.available?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>
                      {v.available?"Available":"On Trip"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MATCH BOARD
      ══════════════════════════════════════════════════════════ */}
      {view === "matchboard" && user && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">Match Board</h2>
              <p className="text-sm text-gray-500">{MOCK_MATCHES.length} live corridor matches · sorted by fit score</p>
            </div>
            <button className="flex items-center gap-2 text-sm text-teal-600 font-bold border border-teal-200 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition">
              <RefreshCw size={14}/> Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            {["All Types","Driver","Shipper","Lender"].map((f,i) => (
              <button key={f}
                className={`text-xs font-bold px-4 py-2 rounded-xl border transition ${i===0?"bg-teal-600 text-white border-teal-600":"bg-white text-gray-600 border-gray-200 hover:border-teal-300"}`}>
                {f}
              </button>
            ))}
            <select className="ml-auto text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-400 text-gray-600 bg-white">
              <option>All Cities</option>
              {["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Pune"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {MOCK_MATCHES.map(m => (
              <MatchCard key={m.id} m={m} accepted={accepted.includes(m.id)} onAccept={id => setAccepted(p=>[...p,id])}/>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          AI ASSISTANT
      ══════════════════════════════════════════════════════════ */}
      {view === "ai" && user && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white">
              <Bot size={20}/>
            </div>
            <div>
              <h2 className="font-black text-gray-900">AI Assistant</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"/>
                Online · Powered by Claude
              </p>
            </div>
          </div>
          <AIChat/>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SETTINGS
      ══════════════════════════════════════════════════════════ */}
      {view === "settings" && user && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-black text-gray-900 mb-6">Settings</h2>
          <div className="max-w-2xl space-y-5">

            {/* Profile card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><User size={16} className="text-teal-500"/>Profile</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">{user.name[0]}</div>
                <div>
                  <p className="font-black text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border mt-1 ${roleCfg.badgeCls}`}>
                    {user.role==="driver"?<Truck size={10}/>:user.role==="shipper"?<Package size={10}/>:<IndianRupee size={10}/>}
                    {roleCfg.label}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 text-sm font-bold px-4 py-2 rounded-xl transition">
                <LogOut size={14}/> Sign Out
              </button>
            </div>

            {/* Rate calculator */}
            <RateCalc/>

            {/* API keys */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-black text-gray-900 mb-1 flex items-center gap-2"><Shield size={16} className="text-teal-500"/>AI API Key</h3>
              <p className="text-xs text-gray-400 mb-4">Add your Anthropic API key to enable the live AI assistant.</p>
              <div className="flex gap-2">
                <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); setKeySaved(false); }} placeholder="sk-ant-…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
                <button onClick={() => setKeySaved(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition flex items-center gap-2">
                  {keySaved?<CheckCircle size={14}/>:<Zap size={14}/>}
                  {keySaved?"Saved":"Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      {user && (
        <>
          <div className="h-16 md:hidden"/>
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20">
            {NAV_ITEMS.map(([v, l, icon]) => (
              <button key={v} onClick={() => go(v)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-bold uppercase tracking-wide transition ${view===v?"text-teal-600":"text-gray-400 hover:text-gray-600"}`}>
                {icon}<span>{l}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Footer (landing only) ── */}
      {view === "landing" && (
        <footer className="bg-gray-900 text-white py-10 mt-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Truck size={16} className="text-white"/></div>
              <div>
                <p className="font-black text-sm">RouteIQ</p>
                <p className="text-gray-400 text-xs">Zero Empty Miles · Full Earnings</p>
              </div>
            </div>
            <Link href="/explore" className="text-teal-400 hover:text-white transition text-xs">← Back to Explore</Link>
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">© 2026 RouteIQ · Powered by Paariwala Platform</p>
        </footer>
      )}
    </div>
  );
}
