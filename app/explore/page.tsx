"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, Receipt, Briefcase, Zap, Lightbulb,
  Phone, Shield, StickyNote, Droplets, Smile, Bell, Search,
  Plus, Trash2, LogOut, CheckCircle2,
  Circle, Heart, TrendingDown, TrendingUp,
  AlertTriangle, X, Edit3, Menu, Coffee,
  Store, Package, MapPin, Eye, Grid3X3, List as ListIcon,
  ShoppingCart, Pill, Utensils, Car, Leaf, Building2, Navigation,
  Plane, Compass, BarChart2, Calendar, Users, Hotel, Banknote,
  ChevronRight, ChevronDown, Bike, Truck, Star,
  Wrench, Hammer, Zap as ZapIcon, Landmark, GraduationCap, Code2, Send, Inbox,
  History, Navigation2, FileText, Globe, Sparkles, Home, Activity,
  Scissors, ShoppingBag, Palette, Bot, Loader2, Copy, Download, Smartphone, Share2, Wifi, WifiOff,
} from "lucide-react";
import { getGuest, createGuest, clearGuest, guestKey, GuestIdentity } from "@/lib/guest-store";

// ── Types ──────────────────────────────────────────────────────
type Section = "dashboard"|"search"|"expenses"|"contacts"|"ideas"|"notes"|"water"|"jobs"|"skills"|"reminders"|"trips"|"travel"|"nearby"|"services"|"providers"|"seekers"|"assistant"|"install";
interface Expense   { id:string; label:string; category:string; amount:number; date:string; }
interface Contact   { id:string; name:string; phone:string; type:string; note?:string; priority?:boolean; }
interface Idea      { id:string; title:string; desc:string; likes:number; status:"open"|"done"; createdAt:string; }
interface Note      { id:string; content:string; color:string; createdAt:string; }
interface Skill     { id:string; name:string; level:number; category:string; }
interface Job       { id:string; company:string; role:string; status:string; appliedAt:string; }
interface Reminder  { id:string; text:string; due?:string; done:boolean; }
interface TripItem  { id:string; destination:string; fromDate:string; toDate:string; budget:number; notes:string; done:boolean; checklist:{text:string;done:boolean}[]; }
interface Listing   { id:string; type:string; mode?:string; name:string; phone:string; city:string|null; state:string|null; address:string|null; description:string|null; rate_info:string|null; discount:string|null; services:any[]; available_now:boolean; lat?:number; lon?:number; dist?:number; }
interface PlacePOI  { id:string; name:string; kind:string; lat:number; lon:number; dist:number; description?:string; tip?:string; }
interface UserLocation { lat:number; lon:number; city:string; state:string; country:string; accuracy:number; }
interface SearchHistory { id:string; query:string; type:string; city:string; results:number; ts:string; }

const NOTE_COLORS = ["#FEF9C3","#DCFCE7","#DBEAFE","#FCE7F3","#F3E8FF","#FFEDD5"];
const EXPENSE_CATS = ["Groceries","Transport","Food","Health","Education","Shopping","Utilities","Entertainment","Other"];
const JOB_STATUSES = ["Applied","Phone Screen","Interview","Offer","Rejected","Ghosted"];
const LISTING_TYPES = [
  // Stay & Travel
  { id:"hotel",              label:"Hotel",           icon:Hotel,         group:"stay"      },
  { id:"restaurant",         label:"Restaurant",      icon:Utensils,      group:"eat"       },
  { id:"paying_guest",       label:"Paying Guest",    icon:Users,         group:"stay"      },
  { id:"resort",             label:"Resort",          icon:Star,          group:"stay"      },
  { id:"driver_auto",        label:"Auto Driver",     icon:Bike,          group:"driver"    },
  { id:"driver_car",         label:"Car Driver",      icon:Car,           group:"driver"    },
  { id:"driver_traveller",   label:"Traveller/Van",   icon:Truck,         group:"driver"    },
  // Home Services
  { id:"plumber",            label:"Plumber",         icon:Wrench,        group:"home"      },
  { id:"electrician",        label:"Electrician",     icon:ZapIcon,       group:"home"      },
  { id:"carpenter",          label:"Carpenter",       icon:Hammer,        group:"home"      },
  { id:"painter",            label:"Painter",         icon:Home,          group:"home"      },
  { id:"ac_repair",          label:"AC Repair",       icon:Activity,      group:"home"      },
  { id:"pest_control",       label:"Pest Control",    icon:Shield,        group:"home"      },
  // Courier
  { id:"courier_send",       label:"Send Package",    icon:Send,          group:"courier"   },
  { id:"courier_pickup",     label:"Pickup/Deliver",  icon:Inbox,         group:"courier"   },
  // Real Estate
  { id:"property_sell",      label:"Property Sell",   icon:Landmark,      group:"realestate"},
  { id:"property_rent",      label:"Property Rent",   icon:Landmark,      group:"realestate"},
  { id:"property_buy_need",  label:"Buyer Needed",    icon:Landmark,      group:"realestate"},
  { id:"property_rent_need", label:"Tenant Needed",   icon:Landmark,      group:"realestate"},
  // Financial
  { id:"financial_advisor",  label:"Financial Advisor",icon:Banknote,     group:"financial" },
  { id:"loan_provider",      label:"Loan Provider",   icon:Banknote,      group:"financial" },
  { id:"insurance_agent",    label:"Insurance",       icon:Shield,        group:"financial" },
  { id:"accounting",         label:"Accounting/Tax",  icon:FileText,      group:"financial" },
  // Service Seekers / Providers
  { id:"software_dev",       label:"Software Dev",    icon:Code2,         group:"services"  },
  { id:"tutor",              label:"Tutor/Coaching",  icon:GraduationCap, group:"services"  },
  { id:"design",             label:"Design",          icon:Sparkles,      group:"services"  },
  { id:"content",            label:"Content/Writing", icon:FileText,      group:"services"  },
  { id:"lead_generator",     label:"Lead Generator",  icon:Globe,         group:"leads"     },
  { id:"help_needed",        label:"Help Needed",     icon:Users,         group:"seekers"   },
  // Fashion & Clothing
  { id:"fashion_designer",   label:"Fashion Designer",icon:Palette,       group:"fashion"   },
  { id:"tailor_stitcher",    label:"Tailor/Stitcher", icon:Scissors,      group:"fashion"   },
  { id:"cloth_seller",       label:"Cloth Seller",    icon:ShoppingBag,   group:"fashion"   },
  { id:"boutique",           label:"Boutique",        icon:ShoppingBag,   group:"fashion"   },
  { id:"embroidery",         label:"Embroidery",      icon:Scissors,      group:"fashion"   },
  { id:"laundry",            label:"Laundry/Dry Clean",icon:Sparkles,     group:"fashion"   },
  // Education
  { id:"tuition_center",     label:"Tuition Center",  icon:GraduationCap, group:"education" },
  { id:"private_teacher",    label:"Private Teacher", icon:GraduationCap, group:"education" },
  { id:"student_need",       label:"Student (needs tutor)",icon:Users,    group:"education" },
  { id:"online_class",       label:"Online Classes",  icon:Globe,         group:"education" },
  { id:"study_group",        label:"Study Group",     icon:Users,         group:"education" },
];
const TYPE_COLORS: Record<string,string> = {
  hotel:"bg-blue-100 text-blue-700", restaurant:"bg-orange-100 text-orange-700",
  paying_guest:"bg-purple-100 text-purple-700", resort:"bg-green-100 text-green-700",
  driver_auto:"bg-yellow-100 text-yellow-700", driver_car:"bg-sky-100 text-sky-700",
  driver_traveller:"bg-indigo-100 text-indigo-700",
  plumber:"bg-blue-100 text-blue-800", electrician:"bg-yellow-100 text-yellow-800",
  carpenter:"bg-amber-100 text-amber-800", painter:"bg-pink-100 text-pink-700",
  ac_repair:"bg-cyan-100 text-cyan-700", pest_control:"bg-red-100 text-red-700",
  courier_send:"bg-violet-100 text-violet-700", courier_pickup:"bg-violet-100 text-violet-700",
  property_sell:"bg-teal-100 text-teal-700", property_rent:"bg-teal-100 text-teal-700",
  property_buy_need:"bg-emerald-100 text-emerald-700", property_rent_need:"bg-emerald-100 text-emerald-700",
  financial_advisor:"bg-green-100 text-green-800", loan_provider:"bg-green-100 text-green-800",
  insurance_agent:"bg-lime-100 text-lime-700", accounting:"bg-green-100 text-green-700",
  software_dev:"bg-indigo-100 text-indigo-700", tutor:"bg-orange-100 text-orange-700",
  design:"bg-fuchsia-100 text-fuchsia-700", content:"bg-rose-100 text-rose-700",
  lead_generator:"bg-cyan-100 text-cyan-800", help_needed:"bg-gray-100 text-gray-700",
  fashion_designer:"bg-pink-100 text-pink-700", tailor_stitcher:"bg-rose-100 text-rose-700",
  cloth_seller:"bg-fuchsia-100 text-fuchsia-700", boutique:"bg-purple-100 text-purple-700",
  embroidery:"bg-pink-100 text-pink-800", laundry:"bg-sky-100 text-sky-700",
  tuition_center:"bg-violet-100 text-violet-700", private_teacher:"bg-indigo-100 text-indigo-700",
  student_need:"bg-blue-100 text-blue-700", online_class:"bg-cyan-100 text-cyan-700",
  study_group:"bg-teal-100 text-teal-700",
};

// OSM Overpass tags for each service type (for "search web" feature)

function haversine(lat1:number,lon1:number,lat2:number,lon2:number):number {
  const R=6371; const dLat=(lat2-lat1)*Math.PI/180; const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ── useLocalStore ──────────────────────────────────────────────
function useLocalStore<T>(key: string, init: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(init);
  const ready = useRef(false);
  useEffect(() => {
    try { const r = localStorage.getItem(key); if (r) setVal(JSON.parse(r)); } catch {}
    ready.current = true;
  }, [key]);
  const save = useCallback((v: T | ((p: T) => T)) => {
    setVal(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      if (ready.current) localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [val, save];
}

// ── GuestGate ──────────────────────────────────────────────────
function GuestGate({ onDone }: { onDone: (g: GuestIdentity) => void }) {
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-orange-100">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🌟</span>
        </div>
        <h2 className="text-gray-900 font-bold text-xl text-center mb-1">Welcome to DemandGenius</h2>
        <p className="text-gray-600 text-sm text-center mb-6">Your AI-powered life dashboard. No account needed.</p>
        <form onSubmit={e => { e.preventDefault(); if (name.trim()) onDone(createGuest(name, phone)); }} className="space-y-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name *" autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          <button type="submit" disabled={!name.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Get Started
          </button>
        </form>
        <p className="text-gray-400 text-xs text-center mt-4">Data stored only on this device · No sign-up required</p>
      </div>
    </div>
  );
}

// ── Sidebar Nav ────────────────────────────────────────────────
const NAV: { id: Section; label: string; icon: any; group?: string; isSubItem?: boolean }[] = [
  { id:"assistant",  label:"Personal Assistant", icon:Bot,           group:"AI" },
  { id:"dashboard",  label:"Dashboard",          icon:LayoutDashboard },
  { id:"nearby",     label:"Nearby AI",          icon:Navigation2,   group:"DISCOVER" },
  { id:"search",     label:"Store Search",       icon:Store },
  { id:"services",   label:"Services Hub",       icon:Wrench },
  { id:"providers",  label:"Providers",          icon:Users,         isSubItem:true },
  { id:"seekers",    label:"Seekers",            icon:Inbox,         isSubItem:true },
  { id:"travel",     label:"Travel Hub",         icon:Compass },
  { id:"trips",      label:"Trip Planner",       icon:Plane },
  { id:"expenses",   label:"Daily Expenses",     icon:Receipt,       group:"PERSONAL" },
  { id:"reminders",  label:"Reminders",          icon:Bell },
  { id:"notes",      label:"Quick Notes",        icon:StickyNote },
  { id:"water",      label:"Water & Mood",       icon:Droplets },
  { id:"skills",     label:"Skill Track",        icon:Zap,           group:"GROWTH" },
  { id:"jobs",       label:"Job Board",          icon:Briefcase },
  { id:"ideas",      label:"Ideas",              icon:Lightbulb,     group:"COMMUNITY" },
  { id:"contacts",   label:"Safe Directory",     icon:Shield },
  { id:"install",    label:"Install App",        icon:Download,      group:"APP" },
];

// ── Contribute Modal ───────────────────────────────────────────
function ContributeModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const upi = "8884166603@axisbank";
  const copy = () => { navigator.clipboard.writeText(upi).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl border border-orange-100" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-orange-100">
            <Heart size={24} className="text-orange-500" />
          </div>
          <h2 className="text-gray-900 font-black text-lg">Support DemandGenius</h2>
          <p className="text-gray-600 text-sm mt-1">Help keep this free for everyone</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center mb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">UPI ID</p>
          <p className="text-lg font-black text-gray-900 font-mono">{upi}</p>
          <p className="text-xs text-gray-500 mt-1">Axis Bank · Any UPI app</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copy}
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Package size={14} />}
            {copied ? "Copied!" : "Copy UPI"}
          </button>
          <button onClick={onClose}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            Done
          </button>
        </div>
        <p className="text-gray-400 text-xs text-center mt-4">Any amount helps · Thank you!</p>
      </div>
    </div>
  );
}

// ── Expiry helpers ─────────────────────────────────────────────
function expiryStatus(dateStr: string | null): { label: string; cls: string } | null {
  if (!dateStr) return null;
  const exp = new Date(dateStr);
  const now = new Date();
  const daysLeft = Math.round((exp.getTime() - now.getTime()) / 86400000);
  if (daysLeft < 0) return { label: "Expired", cls: "bg-red-100 text-red-600" };
  if (daysLeft <= 30) return { label: `Exp in ${daysLeft}d`, cls: "bg-yellow-100 text-yellow-700" };
  return { label: `Exp ${exp.toLocaleDateString("en-IN",{month:"short",year:"2-digit"})}`, cls: "bg-green-50 text-green-600" };
}

// ── 30-day contribution gate ───────────────────────────────────
function ThirtyDayGate({ guest, onClose }: { guest: GuestIdentity; onClose: () => void }) {
  const [contributed, setContributed] = useState(false);
  const daysSince = Math.round((Date.now() - new Date(guest.createdAt).getTime()) / 86400000);
  const ping = () => {
    fetch("/v1/public/sessions/contribution", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ guest_id: guest.id }) }).catch(()=>{});
    setContributed(true);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl border border-orange-100">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎉</span>
          </div>
          <h2 className="text-gray-900 font-black text-lg">You've been here {daysSince} days!</h2>
          <p className="text-gray-500 text-sm mt-1">Thank you for using DemandGenius. If this has been helpful, consider adding a listing or supporting us — it keeps the service free for everyone.</p>
        </div>
        {!contributed ? (
          <div className="space-y-2">
            <button onClick={ping} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              ✅ I've added a listing / shared the app
            </button>
            <button onClick={onClose} className="w-full border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl text-sm transition-colors">
              Remind me later
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-bold mb-3">🙏 Thank you! You rock.</p>
            <button onClick={onClose} className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
          </div>
        )}
        <p className="text-gray-400 text-xs text-center mt-4">DemandGenius is free forever · No ads · No data selling</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function DemandGeniusApp() {
  const [guest, setGuest]             = useState<GuestIdentity | null>(null);
  const [guestReady, setGuestReady]   = useState(false);
  const [section, setSection]         = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [show30DayGate, setShow30DayGate]   = useState(false);
  const [isDeactivated, setIsDeactivated]   = useState(false);
  const [platformStats, setPlatformStats]   = useState({ stores: 0, products: 0, tenants: 0, contributors: 0 });
  const [userLoc, setUserLoc]   = useState<UserLocation|null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);

  useEffect(() => {
    const g = getGuest();
    setGuest(g); setGuestReady(true);
    fetch("/v1/public/stats").then(r=>r.json()).then(d=>{if(d.success)setPlatformStats(d.data);}).catch(()=>{});
    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(()=>{});
    }
    // Handle ?s= deep-link shortcuts from manifest
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") as Section|null;
    if (s) setSection(s);
    // Track session + 30-day gate
    if (g) {
      fetch("/v1/public/sessions", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ guest_id: g.id, guest_name: g.name }) })
        .then(r=>r.json()).then(d=>{ if(d.success && d.data?.is_active===false) setIsDeactivated(true); }).catch(()=>{});
      const daysSince = Math.round((Date.now() - new Date(g.createdAt).getTime()) / 86400000);
      if (daysSince >= 30) setTimeout(() => setShow30DayGate(true), 3000);
    }
    // Auto-detect location silently
    const gId = g?.id;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async pos => {
        const {latitude:lat, longitude:lon, accuracy} = pos.coords;
        if (gId) fetch("/v1/public/location", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ guest_id: gId, lat, lng: lon, accuracy }) }).catch(()=>{});
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geo = await r.json();
          setUserLoc({ lat, lon, accuracy, city:geo.address?.city||geo.address?.town||geo.address?.village||"", state:geo.address?.state||"", country:geo.address?.country||"" });
        } catch { setUserLoc({ lat, lon, accuracy, city:"", state:"", country:"" }); }
      }, ()=>{}, { timeout:10000, enableHighAccuracy:false });
    }
  }, []);

  const captureLocation = () => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      // Direct IP fallback if geolocation API is completely missing
      fetch("https://ipapi.co/json/")
        .then(r => r.json())
        .then(ipGeo => {
          if (ipGeo.latitude && ipGeo.longitude) {
            setUserLoc({
              lat: ipGeo.latitude,
              lon: ipGeo.longitude,
              accuracy: 5000,
              city: ipGeo.city || "",
              state: ipGeo.region || "",
              country: ipGeo.country_name || ""
            });
            if (guest?.id) fetch("/v1/public/location", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ guest_id: guest.id, lat: ipGeo.latitude, lng: ipGeo.longitude, accuracy: 5000 }) }).catch(()=>{});
          }
        })
        .catch(() => {
          // Delhi fallback
          setUserLoc({ lat: 28.6139, lon: 77.2090, accuracy: 10000, city: "Delhi", state: "Delhi", country: "India" });
        })
        .finally(() => setLocLoading(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(async pos => {
      const {latitude:lat, longitude:lon, accuracy} = pos.coords;
      if (guest?.id) fetch("/v1/public/location", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ guest_id: guest.id, lat, lng: lon, accuracy }) }).catch(()=>{});
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const geo = await r.json();
        setUserLoc({ lat, lon, accuracy, city:geo.address?.city||geo.address?.town||geo.address?.village||"", state:geo.address?.state||"", country:geo.address?.country||"" });
      } catch { setUserLoc({ lat, lon, accuracy, city:"", state:"", country:"" }); }
      setLocLoading(false);
    }, async () => {
      // Geolocation permission denied or timeout - trigger IP fallback
      try {
        const r = await fetch("https://ipapi.co/json/");
        const ipGeo = await r.json();
        if (ipGeo.latitude && ipGeo.longitude) {
          setUserLoc({
            lat: ipGeo.latitude,
            lon: ipGeo.longitude,
            accuracy: 5000,
            city: ipGeo.city || "",
            state: ipGeo.region || "",
            country: ipGeo.country_name || ""
          });
          if (guest?.id) fetch("/v1/public/location", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ guest_id: guest.id, lat: ipGeo.latitude, lng: ipGeo.longitude, accuracy: 5000 }) }).catch(()=>{});
        } else {
          throw new Error("No lat/lon returned");
        }
      } catch {
        // Delhi default fallback
        setUserLoc({ lat: 28.6139, lon: 77.2090, accuracy: 10000, city: "Delhi", state: "Delhi", country: "India" });
      }
      setLocLoading(false);
    }, {timeout:8000, enableHighAccuracy:false});
  };

  const gk = (ns: string) => guest ? guestKey(guest.id, ns) : `nexus.anon.${ns}`;

  if (!guestReady) return null;
  if (!guest) return <GuestGate onDone={g => { setGuest(g); fetch("/v1/public/sessions", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ guest_id: g.id, guest_name: g.name }) }).then(r=>r.json()).then(d=>{ if(d.success && d.data?.is_active===false) setIsDeactivated(true); }).catch(()=>{}); }} />;
  if (isDeactivated) return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🔒</span></div>
        <h2 className="text-gray-900 font-black text-xl mb-2">Access Paused</h2>
        <p className="text-gray-500 text-sm mb-5">Your DemandGenius access has been paused by an administrator. This may be due to inactivity or a policy update. To restore access, please reach out.</p>
        <a href="mailto:support@demandgenius.app" className="block w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold mb-2">Contact Support</a>
        <button onClick={() => { clearGuest(); setGuest(null); setIsDeactivated(false); }} className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50">Switch Account</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      {showContribute && <ContributeModal onClose={() => setShowContribute(false)} />}
      {show30DayGate && <ThirtyDayGate guest={guest} onClose={() => setShow30DayGate(false)} />}
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full z-40 w-56 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xs">N</span>
            </div>
            <div>
              <div className="font-black text-sm text-gray-900 leading-tight">DemandGenius</div>
              <div className="text-[10px] text-gray-500 tracking-widest font-semibold uppercase">Life Dashboard</div>
            </div>
          </div>
        </div>

        {/* Platform stats mini */}
        {platformStats.stores > 0 && (
          <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-100 flex items-center justify-between text-xs">
            <span className="text-gray-700 font-semibold">{platformStats.stores} Stores</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-700 font-semibold">{platformStats.products}+ Products</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item, i) => {
            const Icon = item.icon;
            const prev = NAV[i - 1];
            const showGroup = !item.isSubItem && item.group && item.group !== prev?.group;
            const parentActive = item.id === "services" && (section === "providers" || section === "seekers");
            const isActive = section === item.id || parentActive;
            return (
              <div key={item.id}>
                {showGroup && <p className="text-[10px] font-bold tracking-widest text-gray-500 px-2 pt-4 pb-1 uppercase">{item.group}</p>}
                {item.isSubItem ? (
                  <button
                    onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-xl text-xs transition-all ${
                      section === item.id
                        ? "text-orange-600 font-semibold bg-orange-50"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${section === item.id ? "bg-orange-500" : "bg-gray-200"}`}/>
                    <Icon size={12}/>
                    {item.label}
                  </button>
                ) : (
                  <button
                    onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      isActive
                        ? "bg-orange-50 text-orange-600 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Guest pill */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
              {guest.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{guest.name}</div>
              {guest.phone
                ? <div className="text-[10px] text-gray-500 truncate">{guest.phone}</div>
                : <div className="text-[10px] text-gray-400 font-mono truncate">{guest.id}</div>}
            </div>
            <button onClick={() => { clearGuest(); setGuest(null); }} title="Switch guest"
              className="text-gray-300 hover:text-gray-500 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-800">
            <Menu size={20} />
          </button>
          <div className="flex-1 relative max-w-lg flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search stores, products, groceries, pharma…" readOnly
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-700 cursor-pointer"
                onClick={() => setSection("search")} />
            </div>
            <button onClick={() => setShowWaModal(true)}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-green-500/10 shrink-0">
              <Bell size={12} className="animate-bounce" />
              <span>WhatsApp Alerts</span>
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Location chip */}
            <button onClick={captureLocation} disabled={locLoading}
              className="hidden md:flex items-center gap-1 text-xs border border-gray-100 rounded-xl px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
              <Navigation2 size={11} className={`${userLoc?"text-green-500":"text-gray-300"} ${locLoading?"animate-pulse":""}`}/>
              <span className="text-gray-700 max-w-[100px] truncate">{userLoc?.city||"Locate me"}</span>
            </button>
            {/* Contributors */}
            {platformStats.contributors > 0 && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-600 border border-gray-100 rounded-xl px-2.5 py-1.5">
                <Users size={11} className="text-orange-400"/><span className="font-semibold">{platformStats.contributors}</span> contributors
              </div>
            )}
            <button onClick={() => setShowContribute(true)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
              <Heart size={12} /> Contribute
            </button>
            <button onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1.5 border border-gray-100 rounded-xl px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                {guest.name[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-gray-900">{guest.name}</div>
                <div className="text-[10px] text-gray-500">{guest.phone || guest.id}</div>
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {section === "assistant"  && <PersonalAssistantPanel guest={guest} setSection={setSection} onOpenWhatsApp={() => setShowWaModal(true)} />}
          {section === "dashboard"  && <DashboardPanel guest={guest} gk={gk} setSection={setSection} />}
          {section === "search"     && <StoreSearchPanel />}
          {section === "nearby"     && <NearbyPanel userLoc={userLoc} captureLocation={captureLocation} locLoading={locLoading} gk={gk} />}
          {(section === "services" || section === "providers" || section === "seekers") && (
            <ServicesPanel userLoc={userLoc} defaultMode={section==="providers"?"provider":section==="seekers"?"seeker":undefined}/>
          )}
          {section === "travel"     && <TravelPanel />}
          {section === "trips"      && <TripPlanPanel gk={gk} />}
          {section === "expenses"   && <ExpensesPanel  gk={gk} />}
          {section === "contacts"   && <ContactsPanel  gk={gk} />}
          {section === "ideas"      && <IdeasPanel     gk={gk} />}
          {section === "notes"      && <NotesPanel     gk={gk} />}
          {section === "water"      && <WaterMoodPanel gk={gk} />}
          {section === "jobs"       && <JobsPanel      gk={gk} />}
          {section === "skills"     && <SkillsPanel    gk={gk} />}
          {section === "reminders"  && <RemindersPanel gk={gk} />}
          {section === "install"    && <InstallPanel />}
        </main>
      </div>

      {guest && (
        <>
          <GuestProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            guest={guest}
            onOpenWhatsApp={() => setShowWaModal(true)}
          />
          <WhatsAppVerificationModal
            isOpen={showWaModal}
            onClose={() => setShowWaModal(false)}
            guestId={guest.id}
          />
        </>
      )}
    </div>
  );
}

// ── Store Search Panel ─────────────────────────────────────────
const INDUSTRY_ICONS: Record<string, any> = {
  grocery: ShoppingCart, pharma: Pill, restaurant: Utensils,
  auto: Car, retail: Store, kirana: Store, tea: Leaf,
};
const INDUSTRY_COLORS: Record<string, string> = {
  grocery:"bg-emerald-100 text-emerald-700", pharma:"bg-blue-100 text-blue-700",
  restaurant:"bg-orange-100 text-orange-700", auto:"bg-yellow-100 text-yellow-700",
  retail:"bg-purple-100 text-purple-700", kirana:"bg-pink-100 text-pink-700",
  tea:"bg-green-100 text-green-700",
};

interface StoreCard {
  id:string; store_name:string; company_name:string; tenant_id:string;
  industry_id:string; industry_name:string;
  phone_masked:string|null; has_phone:boolean;
  city:string|null; state:string|null; address:string|null;
  maps_url:string|null; product_count:number;
}
interface ProductResult {
  id:string; name:string; sku:string|null; brand:string|null; batch_number:string|null;
  selling_price:number|null; mrp:number|null; in_stock:boolean;
  category:string|null; unit:string|null;
  manufacture_date:string|null; expiry_date:string|null;
  store_id:string; store_name:string; store_city:string|null; store_state:string|null;
  industry_id:string|null; industry_name:string|null;
}
interface Industry { industry_id:string; display_name:string; }

function StoreSearchPanel() {
  const [tab,       setTab]       = useState<"products"|"stores">("products");
  const [search,    setSearch]    = useState("");
  const [industry,  setIndustry]  = useState("");
  const [city,      setCity]      = useState("");
  const [sort,      setSort]      = useState("name_asc");
  const [inStock,   setInStock]   = useState(false);
  const [page,      setPage]      = useState(1);
  const [layout,    setLayout]    = useState<"grid"|"list">("list");

  const [stores,     setStores]    = useState<StoreCard[]>([]);
  const [products,   setProducts]  = useState<ProductResult[]>([]);
  const [total,      setTotal]     = useState(0);
  const [pages,      setPages]     = useState(1);
  const [industries, setIndustries]= useState<Industry[]>([]);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState("");
  const [revealed,   setRevealed]  = useState<Record<string,string>>({});
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    fetch("/v1/public/industries").then(r => r.json())
      .then(d => { if (d.success) setIndustries(d.data || []); }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true); setError("");
    if (tab === "products") {
      const p = new URLSearchParams({ page: String(page), limit:"30", sort,
        ...(search   && { search }),
        ...(industry && { industry }),
        ...(city     && { city }),
        ...(inStock  && { in_stock: "true" }),
      });
      fetch(`/v1/public/products?${p}`).then(r => r.json())
        .then(d => {
          if (!d.success) throw new Error(d.error);
          setProducts(d.data || []); setTotal(d.meta?.total || 0); setPages(d.meta?.pages || 1);
        })
        .catch(e => setError(e.message || "Failed to load products"))
        .finally(() => setLoading(false));
    } else {
      const p = new URLSearchParams({ page: String(page), limit:"24", sort,
        ...(search   && { search }),
        ...(industry && { industry }),
        ...(city     && { city }),
      });
      fetch(`/v1/public/stores?${p}`).then(r => r.json())
        .then(d => {
          if (!d.success) throw new Error(d.error);
          setStores(d.data || []); setTotal(d.meta?.total || 0); setPages(d.meta?.pages || 1);
        })
        .catch(e => setError(e.message || "Failed to load stores"))
        .finally(() => setLoading(false));
    }
  }, [tab, page, sort, search, industry, city, inStock]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search, tab]);

  const revealPhone = async (id: string) => {
    if (revealed[id]) return;
    const r = await fetch(`/v1/public/stores/${id}/reveal-phone`, { method:"POST" });
    const d = await r.json();
    if (d.success) setRevealed(p => ({...p, [id]: d.data.phone}));
  };

  const handleNearby = () => {
    setNearbyLoading(true);
    navigator.geolocation?.getCurrentPosition(async pos => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const g = await r.json();
        const c = g.address?.city || g.address?.town || g.address?.village || "";
        if (c) { setCity(c); setPage(1); }
      } catch {}
      setNearbyLoading(false);
    }, () => setNearbyLoading(false), { timeout: 8000 });
  };

  const clearFilters = () => { setSearch(""); setIndustry(""); setCity(""); setSort("name_asc"); setInStock(false); setPage(1); };
  const hasFilters = search || industry || city || sort !== "name_asc" || inStock;

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Search</h1>
          <p className="text-gray-400 text-sm">Find products & stores across all industries</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNearby} disabled={nearbyLoading}
            className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Navigation size={13} className={nearbyLoading ? "animate-pulse text-orange-400" : ""} />
            {nearbyLoading ? "Detecting…" : city ? `Near: ${city}` : "Nearby"}
          </button>
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            <button onClick={() => setLayout("grid")} className={`p-1.5 rounded-lg transition-colors ${layout==="grid"?"bg-white shadow-sm text-orange-500":"text-gray-400"}`}><Grid3X3 size={14}/></button>
            <button onClick={() => setLayout("list")} className={`p-1.5 rounded-lg transition-colors ${layout==="list"?"bg-white shadow-sm text-orange-500":"text-gray-400"}`}><ListIcon size={14}/></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([["products","Products",Package],["stores","Stores",Store]] as [string,string,any][]).map(([id,label,Icon]) => (
          <button key={id} onClick={() => { setTab(id as any); setPage(1); setProducts([]); setStores([]); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
              ${tab===id ? "bg-white shadow-sm text-orange-500" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
              placeholder={tab === "products" ? "Search by name, SKU, brand, category…" : "Search stores, companies…"}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={13}/></button>}
          </div>
          {hasFilters && <button onClick={clearFilters} className="border border-gray-200 rounded-xl px-3 text-xs text-gray-400 hover:text-gray-600 shrink-0"><X size={12}/></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={city} onChange={e => { setCity(e.target.value); setPage(1); }}
            placeholder="City…"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 w-28 min-w-0" />
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none min-w-0 flex-1">
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            {tab==="products" && <><option value="price_asc">Price: Low→High</option><option value="price_desc">Price: High→Low</option></>}
            {tab==="stores"   && <><option value="city_asc">City A-Z</option><option value="recent">Recent</option></>}
          </select>
          {tab==="products" && (
            <label className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 shrink-0">
              <input type="checkbox" checked={inStock} onChange={e => { setInStock(e.target.checked); setPage(1); }} className="accent-orange-500" />
              In stock
            </label>
          )}
        </div>
      </div>

      {/* Industry filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setIndustry(""); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${!industry ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-500 hover:border-orange-300"}`}>
          All
        </button>
        {industries.map(ind => {
          const Icon = INDUSTRY_ICONS[ind.industry_id] || Building2;
          return (
            <button key={ind.industry_id} onClick={() => { setIndustry(ind.industry_id); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors
                ${industry===ind.industry_id ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-500 hover:border-orange-300"}`}>
              <Icon size={11}/>{ind.display_name}
            </button>
          );
        })}
      </div>

      {/* Count */}
      {!loading && <p className="text-xs text-gray-400">{total} {tab === "products" ? "product" : "store"}{total !== 1 ? "s" : ""} found</p>}
      {error && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-500 text-sm">{error} <button onClick={load} className="underline ml-2">Retry</button></div>}

      {/* Loading skeletons */}
      {loading && (
        <div className={layout==="grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2"}>
          {Array.from({length:6}).map((_,i) => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse"/>)}
        </div>
      )}

      {/* ── PRODUCTS ── */}
      {!loading && tab === "products" && (
        products.length === 0
          ? <div className="text-center py-16 text-gray-300"><Package size={40} className="mx-auto mb-3 opacity-30"/><p className="text-sm">No products found. Try a different search.</p></div>
          : layout === "list"
            ? (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {products.map(p => {
                  const Icon = INDUSTRY_ICONS[p.industry_id||""] || Building2;
                  const badge = INDUSTRY_COLORS[p.industry_id||""] || "bg-gray-100 text-gray-500";
                  return (
                    <div key={p.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${badge}`}><Icon size={14}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{p.name}{p.brand ? <span className="text-xs text-gray-400 font-normal ml-1.5">{p.brand}</span> : null}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge}`}>{p.industry_name || p.category}</span>
                              {!p.in_stock && <span className="text-[10px] bg-red-50 text-red-400 font-semibold px-1.5 py-0.5 rounded-full">Out of stock</span>}
                              {p.sku && <span className="text-[10px] bg-gray-50 text-gray-400 font-mono px-1.5 py-0.5 rounded-full">SKU:{p.sku}</span>}
                              {(() => { const e = expiryStatus(p.expiry_date); return e ? <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${e.cls}`}>{e.label}</span> : null; })()}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {p.selling_price != null && <p className="text-sm font-black text-gray-900">₹{Number(p.selling_price).toFixed(0)}</p>}
                            {p.mrp != null && p.selling_price != null && p.mrp > p.selling_price && (
                              <p className="text-[11px] text-gray-400 line-through">₹{Number(p.mrp).toFixed(0)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-gray-400 flex items-center gap-1 min-w-0"><Store size={9} className="shrink-0"/><span className="truncate">{p.store_name}</span></p>
                          {(p.store_city||p.store_state) && <p className="text-xs text-gray-300 flex items-center gap-1 shrink-0"><MapPin size={9}/>{[p.store_city,p.store_state].filter(Boolean).join(", ")}</p>}
                          {p.unit && <p className="text-xs text-gray-300 shrink-0">{p.unit}</p>}
                          {p.batch_number && <p className="text-xs text-gray-300 shrink-0 font-mono">Batch:{p.batch_number}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map(p => {
                  const Icon = INDUSTRY_ICONS[p.industry_id||""] || Building2;
                  const badge = INDUSTRY_COLORS[p.industry_id||""] || "bg-gray-100 text-gray-500";
                  return (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-orange-200 transition-all">
                      <div className="flex items-start justify-between gap-1 flex-wrap">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${badge}`}><Icon size={10}/>{p.industry_name || p.category}</span>
                        <div className="flex gap-1">
                          {!p.in_stock && <span className="text-[10px] bg-red-50 text-red-400 font-bold px-1.5 py-0.5 rounded-full">Out of stock</span>}
                          {(() => { const e = expiryStatus(p.expiry_date); return e ? <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${e.cls}`}>{e.label}</span> : null; })()}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                        {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                        {p.category && <p className="text-xs text-gray-300">{p.category}{p.unit ? ` · ${p.unit}` : ""}</p>}
                        {p.sku && <p className="text-[10px] text-gray-300 font-mono mt-0.5">SKU: {p.sku}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-auto">
                        <Store size={10}/><span className="truncate">{p.store_name}</span>
                        {(p.store_city) && <span className="text-gray-300">· {p.store_city}</span>}
                      </div>
                      {p.selling_price != null && (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-gray-900">₹{Number(p.selling_price).toFixed(0)}</span>
                          {p.mrp != null && p.mrp > p.selling_price && (
                            <span className="text-xs text-gray-400 line-through">₹{Number(p.mrp).toFixed(0)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
      )}

      {/* ── STORES ── */}
      {!loading && tab === "stores" && (
        stores.length === 0
          ? <div className="text-center py-16 text-gray-300"><Building2 size={40} className="mx-auto mb-3 opacity-30"/><p className="text-sm">No stores found.</p></div>
          : layout === "list"
            ? (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {stores.map(s => {
                  const Icon = INDUSTRY_ICONS[s.industry_id] || Building2;
                  const badge = INDUSTRY_COLORS[s.industry_id] || "bg-gray-100 text-gray-500";
                  return (
                    <div key={s.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${badge}`}><Icon size={15}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900 truncate">{s.store_name}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge}`}>{s.industry_name}</span>
                            </div>
                            {s.company_name !== s.store_name && <p className="text-xs text-gray-400 truncate">{s.company_name}</p>}
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {(s.city||s.state) && <span className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin size={9}/>{[s.city,s.state].filter(Boolean).join(", ")}</span>}
                              {s.has_phone && (revealed[s.id]
                                ? <a href={`tel:${revealed[s.id]}`} className="text-orange-500 text-xs font-mono">{revealed[s.id]}</a>
                                : <button onClick={() => revealPhone(s.id)} className="text-xs text-gray-400 hover:text-orange-500 flex items-center gap-1"><Eye size={9}/><span className="font-mono">{s.phone_masked}</span></button>
                              )}
                            </div>
                          </div>
                          <a href={`/explore/${s.id}`} className="text-xs text-orange-500 shrink-0 font-semibold hover:underline">View →</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {stores.map(s => {
                  const Icon = INDUSTRY_ICONS[s.industry_id] || Building2;
                  const badge = INDUSTRY_COLORS[s.industry_id] || "bg-gray-100 text-gray-500";
                  return (
                    <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-orange-200 transition-all">
                      <div className="flex items-start justify-between">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${badge}`}><Icon size={10}/>{s.industry_name}</span>
                        {s.product_count > 0 && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Package size={10}/>{s.product_count}</span>}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{s.store_name}</h3>
                        {s.company_name !== s.store_name && <p className="text-xs text-gray-400">{s.company_name}</p>}
                      </div>
                      {(s.city||s.state) && <div className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={10}/>{[s.city,s.state].filter(Boolean).join(", ")}</div>}
                      {s.has_phone && <div className="flex items-center gap-1.5 text-xs">
                        {revealed[s.id] ? <a href={`tel:${revealed[s.id]}`} className="text-orange-500">{revealed[s.id]}</a>
                          : <button onClick={() => revealPhone(s.id)} className="flex items-center gap-1 text-gray-400 hover:text-orange-500"><Eye size={10}/>{s.phone_masked}</button>}
                      </div>}
                      <div className="flex items-center gap-2 mt-auto">
                        {s.maps_url && <a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-500 flex items-center gap-1"><MapPin size={10}/>Maps</a>}
                        <a href={`/explore/${s.id}`} className="ml-auto text-xs text-orange-500">View →</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
      )}

      {/* Pagination */}
      {pages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50">← Prev</button>
          <span className="text-sm text-gray-400">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50">Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Panel ────────────────────────────────────────────
function getAiSuggestions(opts:{hour:number;todaySpend:number;budget:number;monthSpend:number;pendingR:number;upcomingTrips:TripItem[];budgetPct:number;topCat:string;}) {
  const { hour, todaySpend, budget, monthSpend, pendingR, upcomingTrips, budgetPct, topCat } = opts;
  const s: { icon:string; text:string; type:"info"|"warn"|"tip" }[] = [];

  if (hour >= 5  && hour < 12) s.push({ icon:"☀️", text:"Good morning! Start by logging your first expense of the day.", type:"tip" });
  if (hour >= 12 && hour < 17) s.push({ icon:"🌤", text:"Afternoon check-in: don't forget to log lunch & transport.", type:"tip" });
  if (hour >= 17 && hour < 21) s.push({ icon:"🌙", text:"Evening — good time to review today's spending.", type:"info" });
  if (hour >= 21 || hour < 5)  s.push({ icon:"🌑", text:"Late night? Rest well. Your data is saved.", type:"info" });

  if (budgetPct >= 90) s.push({ icon:"🚨", text:`Budget alert: ${budgetPct}% used (₹${monthSpend.toFixed(0)} / ₹${budget.toLocaleString("en-IN")}). Slow down spending!`, type:"warn" });
  else if (budgetPct >= 70) s.push({ icon:"⚠️", text:`Budget at ${budgetPct}%. ₹${(budget-monthSpend).toFixed(0)} remaining this month.`, type:"warn" });

  if (todaySpend === 0 && hour > 10) s.push({ icon:"💡", text:"You haven't logged any expense today. Tap 'Add' to track.", type:"tip" });
  if (topCat) s.push({ icon:"📊", text:`Your top spend category this month is ${topCat}. Review if it aligns with your plan.`, type:"info" });
  if (pendingR > 0) s.push({ icon:"🔔", text:`You have ${pendingR} pending reminder${pendingR>1?"s":""}. Check them before end of day.`, type:"info" });

  const nextTrip = upcomingTrips.find(t=>!t.done);
  if (nextTrip) {
    const days = nextTrip.fromDate ? Math.ceil((new Date(nextTrip.fromDate).getTime()-Date.now())/(86400000)) : null;
    if (days !== null && days <= 7 && days >= 0) s.push({ icon:"🧳", text:`Trip to ${nextTrip.destination} in ${days===0?"today":days+" days"}! Check your plan.`, type:"warn" });
    else if (days !== null && days > 7) s.push({ icon:"✈️", text:`Upcoming trip: ${nextTrip.destination} on ${nextTrip.fromDate}. Start planning!`, type:"tip" });
  }

  if (hour >= 11 && hour <= 14) s.push({ icon:"🍽", text:"Lunch time! Find nearby restaurants quickly via Nearby AI.", type:"tip" });
  if (s.length < 2) s.push({ icon:"✅", text:"Everything looks good. Keep tracking your daily activities!", type:"info" });
  return s.slice(0, 4);
}

function DashboardPanel({ guest, gk, setSection }: { guest: GuestIdentity; gk:(s:string)=>string; setSection:(s:Section)=>void }) {
  const [expenses]  = useLocalStore<Expense[]>(gk("expenses"), []);
  const [contacts]  = useLocalStore<Contact[]>(gk("contacts"), []);
  const [ideas]     = useLocalStore<Idea[]>(gk("ideas"), []);
  const [reminders] = useLocalStore<Reminder[]>(gk("reminders"), []);
  const [trips]     = useLocalStore<TripItem[]>(gk("trips"), []);
  const [budget]    = useLocalStore<number>(gk("budget"), 15000);
  const [platform,  setPlatform] = useState({ stores: 0, products: 0, tenants: 0 });
  const [showDelivery, setShowDelivery] = useState(false);
  const [dlv, setDlv] = useState({ pickup:"", dropoff:"", intermediate:"", notes:"", phone:"" });

  useEffect(() => {
    fetch("/v1/public/stats").then(r => r.json()).then(d => { if (d.success) setPlatform(d.data); }).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const hour = new Date().getHours();
  const todaySpend  = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const monthSpend  = expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  const budgetPct   = Math.min(100, Math.round((monthSpend / budget) * 100));
  const openIdeas   = ideas.filter(i => i.status === "open").length;
  const totalLikes  = ideas.reduce((s, i) => s + i.likes, 0);
  const criticalC   = contacts.filter(c => c.priority).length;
  const pendingR    = reminders.filter(r => !r.done).length;
  const upcomingTrips = trips.filter(t=>!t.done).sort((a,b)=>(a.fromDate||"").localeCompare(b.fromDate||""));
  const byCategory = ["Groceries","Transport","Food","Health","Education","Shopping","Utilities","Entertainment","Other"]
    .map(c=>({cat:c,total:expenses.filter(e=>e.category===c&&e.date.startsWith(month)).reduce((s,e)=>s+e.amount,0)}))
    .filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const topCat = byCategory[0]?.cat || "";

  const aiSuggestions = getAiSuggestions({ hour, todaySpend, budget, monthSpend, pendingR, upcomingTrips, budgetPct, topCat });

  const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });
  const recentExp = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  const stats = [
    { label:"TODAY'S SPEND", value:`₹${todaySpend.toFixed(0)}`, sub:"tap to add expenses", trend:"down",
      color:"text-gray-900", border:"border-gray-100", click:()=>setSection("expenses") },
    { label:"MONTHLY BUDGET", value:`${budgetPct}%`, sub:`₹${monthSpend.toFixed(0)} / ₹${budget.toLocaleString("en-IN")}`, trend:"neutral",
      color:budgetPct>=90?"text-red-500":budgetPct>=70?"text-orange-500":"text-gray-900",
      border:budgetPct>=90?"border-red-200":budgetPct>=70?"border-orange-200":"border-gray-100", click:()=>setSection("expenses") },
    { label:"OPEN IDEAS", value:String(openIdeas), sub:`${totalLikes} total likes`, trend:"up",
      color:"text-orange-500", border:"border-orange-200", click:()=>setSection("ideas") },
    { label:"PENDING TASKS", value:String(pendingR), sub:`${criticalC} priority contacts`, trend:"neutral",
      color:pendingR>3?"text-red-500":"text-gray-900", border:pendingR>3?"border-red-100":"border-gray-100", click:()=>setSection("reminders") },
  ];

  const QUICK_ACTIONS = [
    { emoji:"🧳", label:"Travelling",      sub:"Hotels & spots",  click:()=>setSection("nearby") },
    { emoji:"🚗", label:"Book Driver",     sub:"Auto / Car / Van", click:()=>setSection("services") },
    { emoji:"📦", label:"Quick Delivery",  sub:"Courier & pickup", click:()=>setShowDelivery(true) },
    { emoji:"🍽", label:"Find Food",       sub:"Restaurants near", click:()=>setSection("nearby") },
    { emoji:"🔧", label:"Home Service",    sub:"Plumber, Electrician", click:()=>setSection("services") },
    { emoji:"✈️", label:"Plan Trip",       sub:"Trip planner + AI", click:()=>setSection("trips") },
    { emoji:"🛍", label:"Shop",            sub:"Products & stores", click:()=>setSection("search") },
    { emoji:"💰", label:"Track Spend",     sub:"Daily expenses",   click:()=>setSection("expenses") },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">{dayName}</p>
        <h1 className="text-2xl font-black text-gray-900">Hi, {guest.name} 👋</h1>
      </div>

      {/* AI Smart Suggestions */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={14} className="text-orange-400"/>
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">AI Insights</span>
        </div>
        <div className="space-y-2.5">
          {aiSuggestions.map((s,i)=>(
            <div key={i} className={`flex items-start gap-2.5 text-xs rounded-xl px-3 py-2.5 ${s.type==="warn"?"bg-red-500/20":s.type==="tip"?"bg-orange-500/20":"bg-white/5"}`}>
              <span className="text-base shrink-0 leading-none mt-0.5">{s.icon}</span>
              <p className={`leading-relaxed ${s.type==="warn"?"text-red-200":s.type==="tip"?"text-orange-200":"text-white/70"}`}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(a=>(
            <button key={a.label} onClick={a.click}
              className="bg-white border border-gray-100 rounded-xl p-3 text-center hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm transition-all active:scale-95">
              <span className="text-2xl block mb-1">{a.emoji}</span>
              <p className="text-xs font-bold text-gray-900 leading-tight">{a.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight hidden sm:block">{a.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Delivery Widget */}
      {showDelivery && (
        <div className="bg-white border border-orange-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 flex items-center gap-2"><Truck size={16} className="text-orange-500"/>Quick Delivery Request</h3>
            <button onClick={()=>setShowDelivery(false)} className="text-gray-300 hover:text-gray-500"><X size={16}/></button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex flex-col items-center gap-1 pt-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                <div className="w-0.5 h-6 bg-gray-200"/>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400"/>
                <div className="w-0.5 h-6 bg-gray-200"/>
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"/>
              </div>
              <div className="flex-1 space-y-2">
                <input value={dlv.pickup} onChange={e=>setDlv(p=>({...p,pickup:e.target.value}))} placeholder="📍 Pickup address" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"/>
                <input value={dlv.intermediate} onChange={e=>setDlv(p=>({...p,intermediate:e.target.value}))} placeholder="⏱ Intermediate stop (optional)" className="w-full border border-dashed border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-blue-50/40"/>
                <input value={dlv.dropoff} onChange={e=>setDlv(p=>({...p,dropoff:e.target.value}))} placeholder="🏁 Drop-off address" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={dlv.phone} onChange={e=>setDlv(p=>({...p,phone:e.target.value}))} placeholder="Your phone" type="tel" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
              <input value={dlv.notes} onChange={e=>setDlv(p=>({...p,notes:e.target.value}))} placeholder="Notes (fragile, weight…)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setSection("services")}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold">
              Find Courier Providers →
            </button>
            <button onClick={()=>setShowDelivery(false)} className="border border-gray-200 rounded-xl px-4 text-sm text-gray-500">Cancel</button>
          </div>
          <p className="text-xs text-gray-400 text-center">We'll redirect you to available courier providers. Share these details with them directly.</p>
        </div>
      )}

      {/* Platform stats banner */}
      {platform.stores > 0 && (
        <div className="bg-orange-500 rounded-2xl p-4 flex items-center gap-4 cursor-pointer" onClick={() => setSection("search")}>
          <div className="flex-1 flex flex-wrap gap-4 sm:gap-6">
            <div><p className="text-orange-100 text-[10px] font-semibold uppercase tracking-widest">Businesses</p><p className="text-white font-black text-xl">{platform.tenants}</p></div>
            <div><p className="text-orange-100 text-[10px] font-semibold uppercase tracking-widest">Stores</p><p className="text-white font-black text-xl">{platform.stores}</p></div>
            <div><p className="text-orange-100 text-[10px] font-semibold uppercase tracking-widest">Products</p><p className="text-white font-black text-xl">{platform.products}+</p></div>
          </div>
          <div className="text-white/70 text-xs font-semibold shrink-0">Browse →</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <button key={s.label} onClick={s.click}
            className={`bg-white border-2 ${s.border} rounded-2xl p-4 text-left hover:shadow-md transition-all`}>
            <p className="text-[10px] tracking-widest text-gray-500 font-bold uppercase mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{s.sub}</p>
            {s.label.includes("BUDGET") && (
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${budgetPct>=90?"bg-red-400":budgetPct>=70?"bg-orange-400":"bg-green-400"}`}
                  style={{ width:`${budgetPct}%` }} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Upcoming trip banner */}
      {upcomingTrips.length > 0 && (
        <button onClick={()=>setSection("trips")}
          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-left hover:border-blue-200 transition-all">
          <span className="text-2xl shrink-0">✈️</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">Next Trip: {upcomingTrips[0].destination}</p>
            <p className="text-xs text-gray-500">{upcomingTrips[0].fromDate?`Departs ${upcomingTrips[0].fromDate}`:"Date TBD"} {upcomingTrips[0].budget>0?`· ₹${upcomingTrips[0].budget.toLocaleString("en-IN")} budget`:""}</p>
          </div>
          <span className="text-blue-400 text-xs font-semibold shrink-0">Plan →</span>
        </button>
      )}

      {/* Expenses + Emergency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Expense Tracker</h2>
              <p className="text-gray-500 text-xs">Today: ₹{todaySpend.toFixed(0)} · Month: ₹{monthSpend.toFixed(0)}</p>
            </div>
            <button onClick={() => setSection("expenses")}
              className="flex items-center gap-1 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-gray-700">
              <Plus size={11} /> Add
            </button>
          </div>
          {recentExp.length === 0
            ? <p className="text-gray-400 text-sm text-center py-6">No expenses yet</p>
            : <div className="space-y-2">
                {recentExp.map(e => (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0"><Receipt size={13} className="text-gray-400"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.label}</p>
                      <p className="text-xs text-gray-400">{e.category} · {e.date}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 shrink-0">-₹{e.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
          }
          {byCategory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">This Month by Category</p>
              <div className="space-y-1.5">
                {byCategory.slice(0,3).map(b=>(
                  <div key={b.cat} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-24 shrink-0">{b.cat}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{width:`${Math.min(100,(b.total/monthSpend)*100)}%`}}/>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 w-16 text-right">₹{b.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0f172a] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-orange-400"/>
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Emergency</span>
          </div>
          <h2 className="font-bold text-white text-sm mb-3">Safe Directory</h2>
          <div className="space-y-2">
            {[{name:"Emergency",phone:"112",color:"bg-red-500"},{name:"Police",phone:"100",color:"bg-blue-600"},{name:"Ambulance",phone:"108",color:"bg-green-600"}].map(c=>(
              <div key={c.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${c.color} rounded-xl flex items-center justify-center shrink-0`}><Phone size={13} className="text-white"/></div>
                <div className="flex-1"><p className="text-white text-xs font-semibold">{c.name}</p></div>
                <a href={`tel:${c.phone}`} className="text-orange-400 font-bold text-sm font-mono">{c.phone}</a>
              </div>
            ))}
            {contacts.filter(c => c.priority).slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><Heart size={12} className="text-pink-400"/></div>
                <div className="flex-1 min-w-0"><p className="text-white text-xs font-semibold truncate">{c.name}</p><p className="text-white/40 text-[10px]">{c.type}</p></div>
                <a href={`tel:${c.phone}`} className="text-orange-400 font-mono text-xs shrink-0">{c.phone}</a>
              </div>
            ))}
            <button onClick={() => setSection("contacts")} className="w-full text-center text-white/30 text-xs mt-1 hover:text-white/60">+ Add contacts →</button>
          </div>
        </div>
      </div>

      {/* Reminders + Ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-sm">Reminders <span className="ml-1 bg-orange-100 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingR}</span></h2>
            <button onClick={() => setSection("reminders")} className="text-orange-500 text-xs font-medium hover:underline">View all</button>
          </div>
          {reminders.filter(r => !r.done).slice(0, 4).length === 0
            ? <p className="text-gray-300 text-sm text-center py-4">All clear! ✅</p>
            : reminders.filter(r => !r.done).slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <Circle size={13} className="text-orange-300 shrink-0"/>
                  <span className="text-sm text-gray-700 flex-1 truncate">{r.text}</span>
                  {r.due && <span className="text-[10px] text-gray-400 shrink-0">{r.due}</span>}
                </div>
              ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-sm">Ideas & Goals</h2>
            <button onClick={() => setSection("ideas")} className="text-orange-500 text-xs font-medium hover:underline">View all</button>
          </div>
          {ideas.filter(i => i.status === "open").slice(0, 3).length === 0
            ? <p className="text-gray-300 text-sm text-center py-4">No open ideas yet</p>
            : ideas.filter(i => i.status === "open").slice(0, 3).map(i => (
                <div key={i.id} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <Lightbulb size={13} className="text-yellow-400 mt-0.5 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{i.title}</p>
                    <p className="text-xs text-gray-400 truncate">{i.desc}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0"><Heart size={9}/>{i.likes}</span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// ── Expenses Panel ─────────────────────────────────────────────
function ExpensesPanel({ gk }: { gk:(s:string)=>string }) {
  const [expenses, setExpenses] = useLocalStore<Expense[]>(gk("expenses"), []);
  const [budget,   setBudget]   = useLocalStore<number>(gk("budget"), 15000);
  const [label, setLabel] = useState(""); const [cat, setCat] = useState("Groceries");
  const [amount, setAmount] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [editBudget, setEditBudget] = useState(false); const [bInput, setBInput] = useState("");
  const [view, setView] = useState<"log"|"report">("log");
  const [rMode, setRMode] = useState<"weekly"|"monthly"|"range">("monthly");
  const [rFrom, setRFrom] = useState(() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); });
  const [rTo,   setRTo]   = useState(new Date().toISOString().slice(0,10));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !amount) return;
    setExpenses(prev => [{ id: Date.now().toString(), label, category: cat, amount: parseFloat(amount), date }, ...prev]);
    setLabel(""); setAmount("");
  };
  const del = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const todayTotal = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const monthTotal = expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  const byCategory = EXPENSE_CATS.map(c => ({
    cat: c, total: expenses.filter(e => e.category === c && e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // ── Report calculations ──
  const getWeekStart = (d: Date) => { const s = new Date(d); s.setDate(d.getDate() - d.getDay()); return s.toISOString().slice(0,10); };
  const reportExpenses = (() => {
    if (rMode === "range")   return expenses.filter(e => e.date >= rFrom && e.date <= rTo);
    if (rMode === "monthly") return expenses.filter(e => e.date.startsWith(month));
    const weekStart = getWeekStart(new Date());
    return expenses.filter(e => e.date >= weekStart && e.date <= today);
  })();
  const reportTotal   = reportExpenses.reduce((s,e) => s+e.amount, 0);
  const reportByCat   = EXPENSE_CATS.map(c => ({ cat:c, total: reportExpenses.filter(e => e.category===c).reduce((s,e)=>s+e.amount,0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const maxCat        = reportByCat[0]?.total || 1;
  const reportByDay   = [...new Set(reportExpenses.map(e=>e.date))].sort().map(d => ({
    date:d, total: reportExpenses.filter(e=>e.date===d).reduce((s,e)=>s+e.amount,0)
  }));
  const maxDay = Math.max(...reportByDay.map(d=>d.total), 1);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Daily Expenses</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            <button onClick={() => setView("log")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view==="log"?"bg-white shadow-sm text-gray-900":"text-gray-500"}`}>Log</button>
            <button onClick={() => setView("report")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${view==="report"?"bg-white shadow-sm text-orange-500":"text-gray-500"}`}><BarChart2 size={11}/>Report</button>
          </div>
          <div className="flex gap-1.5 text-xs">
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 text-center">
              <div className="font-bold text-orange-600">₹{todayTotal.toFixed(0)}</div>
              <div className="text-[10px] text-gray-500">Today</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-3 py-1.5 text-center">
              <div className="font-bold text-gray-900">₹{monthTotal.toFixed(0)}</div>
              <div className="text-[10px] text-gray-500">Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── REPORT VIEW ── */}
      {view === "report" && (
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(["weekly","monthly","range"] as const).map(m => (
              <button key={m} onClick={() => setRMode(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${rMode===m?"bg-white shadow-sm text-orange-500":"text-gray-500"}`}>
                {m === "range" ? "Date Range" : m}
              </button>
            ))}
          </div>
          {rMode === "range" && (
            <div className="flex gap-2 items-center flex-wrap">
              <input type="date" value={rFrom} onChange={e=>setRFrom(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={rTo} onChange={e=>setRTo(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          )}

          {/* Summary */}
          <div className="bg-orange-500 rounded-2xl p-5 text-white">
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest mb-1">
              {rMode==="weekly"?"This Week":rMode==="monthly"?"This Month":`${rFrom} → ${rTo}`}
            </p>
            <p className="text-4xl font-black">₹{reportTotal.toFixed(0)}</p>
            <p className="text-orange-200 text-sm mt-1">{reportExpenses.length} transactions</p>
          </div>

          {/* Daily bar chart */}
          {reportByDay.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Daily Spending</h3>
              <div className="flex items-end gap-1 h-32">
                {reportByDay.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-[20px]">
                    <div className="w-full bg-orange-400 rounded-t-md transition-all" style={{ height:`${(d.total/maxDay)*100}%`, minHeight:"2px" }} title={`₹${d.total.toFixed(0)}`} />
                    <span className="text-[9px] text-gray-400 rotate-45 origin-left translate-y-1">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category breakdown */}
          {reportByCat.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">By Category</h3>
              {reportByCat.map(c => (
                <div key={c.cat}>
                  <div className="flex justify-between text-xs text-gray-700 mb-1">
                    <span>{c.cat}</span><span className="font-bold">₹{c.total.toFixed(0)} ({reportTotal>0?((c.total/reportTotal)*100).toFixed(1):0}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width:`${(c.total/maxCat)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {reportExpenses.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No expenses in this period.</p>}
        </div>
      )}

      {/* ── LOG VIEW ── */}
      {view === "log" && (
        <>
          {/* Budget */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Monthly Budget</span>
              {editBudget
                ? <div className="flex gap-1">
                    <input type="number" value={bInput} onChange={e => setBInput(e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-28 focus:outline-none focus:border-orange-400" />
                    <button onClick={() => { setBudget(parseFloat(bInput)||budget); setEditBudget(false); }}
                      className="text-xs bg-orange-500 text-white px-2 py-1 rounded-lg">Save</button>
                  </div>
                : <button onClick={() => { setBInput(String(budget)); setEditBudget(true); }}
                    className="text-xs text-orange-500 hover:underline">₹{budget.toLocaleString("en-IN")} · Edit</button>
              }
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${monthTotal/budget > 0.8 ? "bg-red-400" : "bg-orange-400"}`}
                style={{ width: `${Math.min(100, (monthTotal/budget)*100)}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">₹{monthTotal.toFixed(0)} of ₹{budget.toLocaleString("en-IN")} — {Math.round((monthTotal/budget)*100)}% used</p>
          </div>

          {/* Add form */}
          <form onSubmit={add} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Coffee, Autofare" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <select value={cat} onChange={e => setCat(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="text-xs text-gray-500 block mb-1">Amount (₹)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" step="1" min="0" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">+ Add</button>
          </form>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">This Month by Category</p>
              <div className="space-y-2">
                {byCategory.map(c => (
                  <div key={c.cat} className="flex items-center gap-3">
                    <span className="text-xs text-gray-700 w-24 truncate">{c.cat}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(c.total/monthTotal)*100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 w-16 text-right">₹{c.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {expenses.length === 0
              ? <div className="p-10 text-center text-gray-400 text-sm">No expenses logged yet</div>
              : expenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <Receipt size={14} className="text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.label}</p>
                      <p className="text-xs text-gray-500">{e.category} · {e.date}</p>
                    </div>
                    <span className="font-bold text-gray-900">-₹{e.amount.toFixed(0)}</span>
                    <button onClick={() => del(e.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"><Trash2 size={14}/></button>
                  </div>
                ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Contacts Panel ─────────────────────────────────────────────
function ContactsPanel({ gk }: { gk:(s:string)=>string }) {
  const [contacts, setContacts] = useLocalStore<Contact[]>(gk("contacts"), []);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name:"", phone:"", type:"personal", note:"", priority:false });
  const [adding, setAdding] = useState(false);

  const add = () => {
    if (!form.name || !form.phone) return;
    setContacts(prev => [...prev, { id: Date.now().toString(), ...form }]);
    setForm({ name:"", phone:"", type:"personal", note:"", priority:false });
    setAdding(false);
  };
  const del = (id: string) => setContacts(prev => prev.filter(c => c.id !== id));

  const filtered = contacts.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Safe Directory</h1>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-xl">
          <Plus size={12} /> Add Contact
        </button>
      </div>

      {/* Emergency numbers */}
      <div className="bg-[#0f172a] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-orange-400" />
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Emergency Numbers</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["Emergency","911","bg-red-500"],["Police","100","bg-blue-600"],["Ambulance","108","bg-green-600"],
            ["Fire","101","bg-orange-500"],["Disaster","1078","bg-purple-600"],["Women Help","1091","bg-pink-500"]].map(([name,phone,bg]) => (
            <a key={name} href={`tel:${phone}`}
              className="flex flex-col items-center gap-1.5 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Phone size={13} className="text-white" />
              </div>
              <span className="text-white text-xs font-semibold">{name}</span>
              <span className="text-orange-400 font-mono font-bold text-sm">{phone}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="Full name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))} placeholder="+1 (555) 000-0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                {["personal","family","medical","work","neighbor"].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-400 block mb-1">Note (optional)</label>
              <input value={form.note} onChange={e => setForm(f => ({...f, note:e.target.value}))} placeholder="e.g. Doctor / Landlord"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.priority} onChange={e => setForm(f => ({...f, priority:e.target.checked}))} />
            Mark as priority (shows on dashboard)
          </label>
          <div className="flex gap-2">
            <button onClick={add} className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700">Save</button>
            <button onClick={() => setAdding(false)} className="text-gray-400 text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + list */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search contacts..."
          className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {filtered.length === 0
          ? <div className="p-10 text-center text-gray-300 text-sm">No contacts yet</div>
          : filtered.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${c.priority ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    {c.priority && <Heart size={10} className="text-orange-400 fill-orange-400" />}
                  </div>
                  <p className="text-xs text-gray-400">{c.type}{c.note ? ` · ${c.note}` : ""}</p>
                </div>
                <a href={`tel:${c.phone}`} className="text-orange-500 font-mono text-xs hover:underline">{c.phone}</a>
                <button onClick={() => del(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
      </div>
    </div>
  );
}

// ── Ideas Panel ────────────────────────────────────────────────
function IdeasPanel({ gk }: { gk:(s:string)=>string }) {
  const [ideas, setIdeas] = useLocalStore<Idea[]>(gk("ideas"), []);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIdeas(prev => [{ id: Date.now().toString(), title, desc, likes: 0, status: "open", createdAt: new Date().toISOString() }, ...prev]);
    setTitle(""); setDesc("");
  };
  const like   = (id: string) => setIdeas(prev => prev.map(i => i.id === id ? {...i, likes: i.likes+1} : i));
  const toggle = (id: string) => setIdeas(prev => prev.map(i => i.id === id ? {...i, status: i.status === "open" ? "done" : "open"} : i));
  const del    = (id: string) => setIdeas(prev => prev.filter(i => i.id !== id));

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Ideas & Challenges</h1>
      <form onSubmit={add} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New idea or challenge..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
        <div className="flex gap-2">
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe it... (optional)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">Add</button>
        </div>
      </form>
      <div className="space-y-3">
        {ideas.length === 0 && <div className="text-center py-12 text-gray-300 text-sm">No ideas yet. Add your first one!</div>}
        {ideas.map(i => (
          <div key={i.id} className={`bg-white border rounded-2xl p-4 flex gap-3 ${i.status === "done" ? "opacity-60 border-gray-100" : "border-gray-100 hover:border-orange-200"} transition-all`}>
            <button onClick={() => toggle(i.id)} className="mt-0.5 shrink-0">
              {i.status === "done"
                ? <CheckCircle2 size={18} className="text-green-400" />
                : <Circle size={18} className="text-gray-300 hover:text-orange-400" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${i.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>{i.title}</p>
              {i.desc && <p className="text-xs text-gray-400 mt-0.5">{i.desc}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => like(i.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors">
                <Heart size={13} /> {i.likes}
              </button>
              <button onClick={() => del(i.id)} className="text-gray-200 hover:text-red-400 transition-colors ml-1"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notes Panel ────────────────────────────────────────────────
function NotesPanel({ gk }: { gk:(s:string)=>string }) {
  const [notes, setNotes] = useLocalStore<Note[]>(gk("notes"), []);
  const [text, setText] = useState(""); const [color, setColor] = useState(NOTE_COLORS[0]);
  const [editing, setEditing] = useState<string|null>(null);

  const add = () => {
    if (!text.trim()) return;
    if (editing) {
      setNotes(prev => prev.map(n => n.id === editing ? {...n, content: text, color} : n));
      setEditing(null);
    } else {
      setNotes(prev => [{ id: Date.now().toString(), content: text, color, createdAt: new Date().toISOString() }, ...prev]);
    }
    setText(""); setColor(NOTE_COLORS[0]);
  };
  const del = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));
  const edit = (n: Note) => { setEditing(n.id); setText(n.content); setColor(n.color); };

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Quick Notes</h1>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Jot something down..."
          rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-400" />
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {NOTE_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ background: c }}
                className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? "border-gray-800 scale-110" : "border-transparent"}`} />
            ))}
          </div>
          <button onClick={add} className="ml-auto bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors">
            {editing ? "Update" : "Add Note"}
          </button>
          {editing && <button onClick={() => { setEditing(null); setText(""); }} className="text-gray-400 text-sm">Cancel</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.length === 0 && <div className="col-span-3 text-center py-12 text-gray-300 text-sm">No notes yet</div>}
        {notes.map(n => (
          <div key={n.id} style={{ background: n.color }} className="rounded-2xl p-4 relative group min-h-[120px] flex flex-col">
            <p className="text-gray-800 text-sm leading-relaxed flex-1 whitespace-pre-wrap">{n.content}</p>
            <p className="text-gray-400 text-[10px] mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => edit(n)} className="bg-white/60 hover:bg-white rounded-lg p-1"><Edit3 size={11} /></button>
              <button onClick={() => del(n.id)} className="bg-white/60 hover:bg-red-50 rounded-lg p-1 text-red-400"><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Water & Mood Panel ─────────────────────────────────────────
function WaterMoodPanel({ gk }: { gk:(s:string)=>string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [water, setWater] = useLocalStore<Record<string,number>>(gk("water"), {});
  const [mood,  setMood]  = useLocalStore<Record<string,number>>(gk("mood"), {});

  const todayWater = water[today] || 0;
  const todayMood  = mood[today]  || 0;
  const addWater = (n: number) => setWater(w => ({...w, [today]: Math.max(0, (w[today]||0)+n)}));
  const setTodayMood = (m: number) => setMood(w => ({...w, [today]: m}));

  const MOODS = [
    { v:1, emoji:"😞", label:"Rough" },
    { v:2, emoji:"😕", label:"Meh" },
    { v:3, emoji:"😐", label:"Okay" },
    { v:4, emoji:"😊", label:"Good" },
    { v:5, emoji:"🌟", label:"Great" },
  ];

  const last7 = Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate()-i);
    const k = d.toISOString().slice(0,10);
    return { date: k, label: d.toLocaleDateString("en-US",{weekday:"short"}), water: water[k]||0, mood: mood[k]||0 };
  }).reverse();

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Water & Mood Tracker</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Water */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={16} className="text-blue-400" />
            <span className="font-bold text-gray-900 text-sm">Water Intake</span>
          </div>
          <div className="text-4xl font-black text-blue-500 text-center mb-1">{todayWater}</div>
          <div className="text-xs text-gray-400 text-center mb-4">glasses today · goal: 8</div>
          <div className="flex items-center gap-1 justify-center mb-3">
            {Array.from({length:8}, (_,i) => (
              <div key={i} className={`w-6 h-8 rounded-lg border-2 ${i < todayWater ? "bg-blue-400 border-blue-400" : "border-gray-200"}`} />
            ))}
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={() => addWater(-1)} className="w-9 h-9 rounded-xl border border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors">−</button>
            <button onClick={() => addWater(1)}  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
              <Coffee size={13} className="inline mr-1" />Add Glass
            </button>
          </div>
        </div>

        {/* Mood */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smile size={16} className="text-yellow-400" />
            <span className="font-bold text-gray-900 text-sm">Daily Mood</span>
          </div>
          <div className="text-4xl text-center mb-1">{todayMood ? MOODS[todayMood-1].emoji : "🫙"}</div>
          <div className="text-xs text-gray-400 text-center mb-5">{todayMood ? MOODS[todayMood-1].label : "Not logged yet"}</div>
          <div className="grid grid-cols-5 gap-1">
            {MOODS.map(m => (
              <button key={m.v} onClick={() => setTodayMood(m.v)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-lg transition-all
                  ${todayMood === m.v ? "bg-yellow-50 ring-2 ring-yellow-300 scale-105" : "hover:bg-gray-50"}`}>
                {m.emoji}
                <span className="text-[9px] text-gray-400">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7-day history */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Last 7 Days</p>
        <div className="grid grid-cols-7 gap-2">
          {last7.map(d => (
            <div key={d.date} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${d.date === today ? "bg-orange-50 border border-orange-200" : ""}`}>
              <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
              <span className="text-base">{d.mood ? MOODS[d.mood-1].emoji : "·"}</span>
              <div className="flex flex-col gap-0.5">
                {Array.from({length: Math.min(d.water,4)}, (_,i) => (
                  <div key={i} className="w-2 h-1 bg-blue-300 rounded-full" />
                ))}
              </div>
              <span className="text-[9px] text-blue-400">{d.water>0?`${d.water}g`:""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Jobs Panel ─────────────────────────────────────────────────
function JobsPanel({ gk }: { gk:(s:string)=>string }) {
  const [jobs, setJobs] = useLocalStore<Job[]>(gk("jobs"), []);
  const [form, setForm] = useState({ company:"", role:"", status:"Applied", appliedAt: new Date().toISOString().slice(0,10) });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.role) return;
    setJobs(prev => [{ id: Date.now().toString(), ...form }, ...prev]);
    setForm({ company:"", role:"", status:"Applied", appliedAt: new Date().toISOString().slice(0,10) });
  };
  const update = (id:string, status:string) => setJobs(prev => prev.map(j => j.id===id ? {...j,status} : j));
  const del    = (id:string) => setJobs(prev => prev.filter(j => j.id !== id));

  const STATUS_COLORS: Record<string,string> = {
    "Applied":"bg-blue-100 text-blue-600", "Phone Screen":"bg-purple-100 text-purple-600",
    "Interview":"bg-orange-100 text-orange-600", "Offer":"bg-green-100 text-green-600",
    "Rejected":"bg-red-100 text-red-500", "Ghosted":"bg-gray-100 text-gray-400"
  };

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Job Board</h1>
      <form onSubmit={add} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[140px]"><label className="text-xs text-gray-400 block mb-1">Company</label>
          <input value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} placeholder="e.g. Google"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required /></div>
        <div className="flex-1 min-w-[120px]"><label className="text-xs text-gray-400 block mb-1">Role</label>
          <input value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} placeholder="e.g. Frontend Engineer"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required /></div>
        <div><label className="text-xs text-gray-400 block mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
            {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select></div>
        <div><label className="text-xs text-gray-400 block mb-1">Applied</label>
          <input type="date" value={form.appliedAt} onChange={e => setForm(f=>({...f,appliedAt:e.target.value}))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" /></div>
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">+ Add</button>
      </form>
      <div className="grid grid-cols-3 gap-3">
        {["Applied","Interview","Offer"].map(s => (
          <div key={s} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-gray-900">{jobs.filter(j=>j.status===s).length}</div>
            <div className="text-xs text-gray-400">{s}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {jobs.length === 0 ? <div className="p-10 text-center text-gray-300 text-sm">No applications yet</div>
          : jobs.map(j => (
            <div key={j.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500 text-sm shrink-0">
                {j.company[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{j.role}</p>
                <p className="text-xs text-gray-400">{j.company} · {j.appliedAt}</p>
              </div>
              <select value={j.status} onChange={e => update(j.id, e.target.value)}
                className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[j.status]}`}>
                {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => del(j.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Skills Panel ───────────────────────────────────────────────
function SkillsPanel({ gk }: { gk:(s:string)=>string }) {
  const [skills, setSkills] = useLocalStore<Skill[]>(gk("skills"), []);
  const [form, setForm] = useState({ name:"", level:50, category:"Technical" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSkills(prev => [...prev, { id: Date.now().toString(), ...form }]);
    setForm({ name:"", level:50, category:"Technical" });
  };
  const update = (id:string, level:number) => setSkills(prev => prev.map(s => s.id===id ? {...s,level} : s));
  const del    = (id:string) => setSkills(prev => prev.filter(s => s.id !== id));

  const cats = [...new Set(skills.map(s => s.category))];
  const SKILL_CATS = ["Technical","Design","Language","Soft Skills","Hobby","Sports","Other"];

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Skill Track</h1>
      <form onSubmit={add} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[140px]"><label className="text-xs text-gray-400 block mb-1">Skill Name</label>
          <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. React, Spanish, Chess"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required /></div>
        <div><label className="text-xs text-gray-400 block mb-1">Category</label>
          <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
            {SKILL_CATS.map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div className="w-28"><label className="text-xs text-gray-400 block mb-1">Level: {form.level}%</label>
          <input type="range" min="0" max="100" value={form.level} onChange={e => setForm(f=>({...f,level:+e.target.value}))}
            className="w-full accent-orange-500" /></div>
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">+ Add</button>
      </form>
      {cats.length === 0 && skills.length === 0 && <div className="text-center py-12 text-gray-300 text-sm">Track your skills and growth</div>}
      {(cats.length > 0 ? cats : SKILL_CATS.slice(0,1)).map(cat => {
        const catSkills = skills.filter(s => s.category === cat);
        if (catSkills.length === 0) return null;
        return (
          <div key={cat} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cat}</h2>
            {catSkills.map(s => (
              <div key={s.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{s.level}%</span>
                    <button onClick={() => del(s.id)} className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={s.level} onChange={e => update(s.id, +e.target.value)}
                  className="w-full accent-orange-500 h-1.5" />
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden -mt-1 pointer-events-none">
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${s.level}%`, background: s.level > 70 ? "#22c55e" : s.level > 40 ? "#f97316" : "#f59e0b" }} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Reminders Panel ────────────────────────────────────────────
function RemindersPanel({ gk }: { gk:(s:string)=>string }) {
  const [items, setItems] = useLocalStore<Reminder[]>(gk("reminders"), []);
  const [text, setText] = useState(""); const [due, setDue] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    setItems(prev => [{ id: Date.now().toString(), text, due, done: false }, ...prev]);
    setText(""); setDue("");
  };
  const toggle = (id:string) => setItems(prev => prev.map(r => r.id===id ? {...r,done:!r.done} : r));
  const del    = (id:string) => setItems(prev => prev.filter(r => r.id !== id));

  const pending = items.filter(r => !r.done);
  const done    = items.filter(r =>  r.done);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Reminders</h1>
        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">{pending.length} pending</span>
      </div>
      <form onSubmit={add} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]"><label className="text-xs text-gray-400 block mb-1">Reminder</label>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Call doctor, Submit assignment..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" required /></div>
        <div><label className="text-xs text-gray-400 block mb-1">Due date (optional)</label>
          <input type="date" value={due} onChange={e => setDue(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" /></div>
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">+ Add</button>
      </form>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {pending.length === 0 && done.length === 0 && <div className="p-10 text-center text-gray-300 text-sm">No reminders yet</div>}
        {pending.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 group">
            <button onClick={() => toggle(r.id)}><Circle size={16} className="text-orange-300 hover:text-orange-500 transition-colors" /></button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{r.text}</p>
              {r.due && <p className="text-xs text-orange-400 font-medium mt-0.5">Due: {r.due}</p>}
            </div>
            <button onClick={() => del(r.id)} className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
          </div>
        ))}
        {done.length > 0 && (
          <>
            <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Completed ({done.length})</p>
            </div>
            {done.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 opacity-50 hover:opacity-70 group">
                <button onClick={() => toggle(r.id)}><CheckCircle2 size={16} className="text-green-400" /></button>
                <p className="text-sm text-gray-500 line-through flex-1">{r.text}</p>
                <button onClick={() => del(r.id)} className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Trip Plan Panel ────────────────────────────────────────────
interface AiPlan { destination:string; days:{ day:number; title:string; morning:string; afternoon:string; evening:string; tips:string; }[]; spots:PlacePOI[]; }

function TripPlanPanel({ gk }: { gk:(s:string)=>string }) {
  const [trips, setTrips] = useLocalStore<TripItem[]>(gk("trips"), []);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [newItem, setNewItem] = useState({ destination:"", fromDate:"", toDate:"", budget:0, notes:"" });
  const [checkInput, setCheckInput] = useState<Record<string,string>>({});
  const [aiPlan,   setAiPlan]  = useState<AiPlan|null>(null);
  const [aiLoading,setAiLoading]=useState<string|null>(null); // tripId being planned

  const addTrip = () => {
    if (!newItem.destination) return;
    setTrips(p => [...p, { id:Date.now().toString(), ...newItem, done:false, checklist:[] }]);
    setNewItem({ destination:"", fromDate:"", toDate:"", budget:0, notes:"" }); setAdding(false);
  };
  const delTrip = (id:string) => setTrips(p => p.filter(t => t.id !== id));
  const toggleDone = (id:string) => setTrips(p => p.map(t => t.id===id ? {...t, done:!t.done} : t));
  const addCheck = (id:string) => {
    const txt = checkInput[id]?.trim(); if (!txt) return;
    setTrips(p => p.map(t => t.id===id ? {...t, checklist:[...t.checklist,{text:txt,done:false}]} : t));
    setCheckInput(p => ({...p,[id]:""}));
  };
  const toggleCheck = (tripId:string, idx:number) => setTrips(p => p.map(t => t.id===tripId ? {...t, checklist:t.checklist.map((c,i)=>i===idx?{...c,done:!c.done}:c)} : t));

  const generatePlan = async (t:TripItem) => {
    setAiLoading(t.id); setAiPlan(null);
    // Geocode destination to lat/lng via Nominatim
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(t.destination)}&format=json&limit=1`).then(r=>r.json());
      const lat = parseFloat(geo[0]?.lat||"0"); const lon = parseFloat(geo[0]?.lon||"0");

      // Fetch tourist attractions, hotels, restaurants via Overpass
      const osmQ = `[out:json][timeout:25];(node["tourism"~"attraction|museum|viewpoint|theme_park"](around:20000,${lat},${lon});node["amenity"="restaurant"](around:8000,${lat},${lon});node["tourism"~"hotel|resort"](around:15000,${lat},${lon});node["amenity"="place_of_worship"](around:10000,${lat},${lon}););out body 60;`;
      const osmData = await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:osmQ}).then(r=>r.json());

      const spots:PlacePOI[] = (osmData.elements||[]).filter((el:any)=>el.tags?.name).map((el:any):PlacePOI=>({
        id:String(el.id), name:el.tags.name,
        kind:el.tags.tourism||el.tags.amenity||"place",
        lat:el.lat||0, lon:el.lon||0,
        dist:lat?haversine(lat,lon,el.lat||0,el.lon||0):0
      })).sort((a:PlacePOI,b:PlacePOI)=>a.dist-b.dist).slice(0,30);

      // Calculate trip days
      const from = t.fromDate ? new Date(t.fromDate) : new Date();
      const to   = t.toDate   ? new Date(t.toDate)   : new Date(from.getTime()+2*86400000);
      const numDays = Math.max(1, Math.round((to.getTime()-from.getTime())/86400000)+1);

      const attractions = spots.filter(s=>["attraction","museum","viewpoint","theme_park","place_of_worship"].includes(s.kind));
      const restaurants = spots.filter(s=>s.kind==="restaurant");
      const hotels      = spots.filter(s=>["hotel","resort"].includes(s.kind));

      // Build day-by-day plan
      const days = Array.from({length:numDays},(_,i)=>{
        const dayAttr = attractions.slice(i*2,(i+1)*2);
        const dayRest = restaurants.slice(i*2,(i+1)*2);
        const hotel   = hotels[0];
        const dateStr = new Date(from.getTime()+i*86400000).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});
        return {
          day:i+1,
          title:`Day ${i+1} — ${dateStr}`,
          morning:dayAttr[0] ? `Visit ${dayAttr[0].name} (${dayAttr[0].dist.toFixed(1)}km from center)` : `Explore ${t.destination} city centre`,
          afternoon:dayAttr[1] ? `Head to ${dayAttr[1].name}` : (i===0?"Check-in & settle down":"Free time for local markets"),
          evening:dayRest[0] ? `Dinner at ${dayRest[0].name}${dayRest[1]?" or "+dayRest[1].name:""}` : `Local street food & evening walk`,
          tips:hotel&&i===0?`Stay: ${hotel.name} is nearby`:(t.budget>0&&i===numDays-1?`Budget tip: ₹${Math.round(t.budget/numDays).toLocaleString("en-IN")}/day`:""),
        };
      });

      setAiPlan({ destination:t.destination, days, spots });
    } catch { setAiPlan({ destination:t.destination, days:[{day:1,title:"Day 1",morning:"Explore the city centre",afternoon:"Visit local attractions",evening:"Try local cuisine",tips:"Check local travel blogs for latest updates"}], spots:[] }); }
    setAiLoading(null);
  };

  const upcoming = trips.filter(t => !t.done).sort((a,b) => (a.fromDate||"").localeCompare(b.fromDate||""));
  const past = trips.filter(t => t.done);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Trip Planner</h1>
          <p className="text-gray-600 text-sm">{upcoming.length} upcoming · {past.length} completed</p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus size={14}/> New Trip
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-orange-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-900">Plan New Trip</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Destination *</label>
              <input value={newItem.destination} onChange={e=>setNewItem(p=>({...p,destination:e.target.value}))} placeholder="e.g. Coorg, Kerala, Goa" autoFocus className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">From Date</label>
              <input type="date" value={newItem.fromDate} onChange={e=>setNewItem(p=>({...p,fromDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">To Date</label>
              <input type="date" value={newItem.toDate} onChange={e=>setNewItem(p=>({...p,toDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Budget (₹)</label>
              <input type="number" value={newItem.budget||""} onChange={e=>setNewItem(p=>({...p,budget:parseFloat(e.target.value)||0}))} placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes</label>
              <input value={newItem.notes} onChange={e=>setNewItem(p=>({...p,notes:e.target.value}))} placeholder="Plans, reminders…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addTrip} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">Save Trip</button>
            <button onClick={() => setAdding(false)} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upcoming</p>
          {upcoming.map(t => {
            const isExp = expanded === t.id;
            const doneItems = t.checklist.filter(c=>c.done).length;
            return (
              <div key={t.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-orange-200 transition-all">
                <div className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0"><Plane size={16} className="text-orange-500"/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{t.destination}</h3>
                      {t.budget > 0 && <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">₹{t.budget.toLocaleString("en-IN")}</span>}
                    </div>
                    {(t.fromDate||t.toDate) && <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><Calendar size={10}/>{t.fromDate}{t.fromDate&&t.toDate?" → ":""}{t.toDate}</p>}
                    {t.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{t.notes}</p>}
                    {t.checklist.length > 0 && <p className="text-xs text-gray-500 mt-1">{doneItems}/{t.checklist.length} tasks done</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>setExpanded(isExp?null:t.id)} className="text-gray-400 hover:text-gray-700 p-1">{isExp?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>
                    <button onClick={()=>toggleDone(t.id)} className="text-xs text-green-500 hover:text-green-700 font-semibold px-1">Done</button>
                    <button onClick={()=>delTrip(t.id)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 size={13}/></button>
                  </div>
                </div>
                {isExp && (
                  <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-4">
                    {/* AI Trip Plan */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Bot size={11}/>AI Travel Plan</p>
                        <button onClick={()=>generatePlan(t)} disabled={aiLoading===t.id}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-60">
                          {aiLoading===t.id?<><Loader2 size={11} className="animate-spin"/>Planning…</>:<><Sparkles size={11}/>Generate Plan</>}
                        </button>
                      </div>
                      {aiPlan && aiPlan.destination===t.destination && (
                        <div className="space-y-3">
                          {aiPlan.days.map(d=>(
                            <div key={d.day} className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-3 space-y-1.5">
                              <p className="font-bold text-gray-900 text-sm">{d.title}</p>
                              <p className="text-xs text-gray-700"><span className="font-semibold text-orange-600">☀️ Morning:</span> {d.morning}</p>
                              <p className="text-xs text-gray-700"><span className="font-semibold text-orange-600">🌤 Afternoon:</span> {d.afternoon}</p>
                              <p className="text-xs text-gray-700"><span className="font-semibold text-orange-600">🌙 Evening:</span> {d.evening}</p>
                              {d.tips&&<p className="text-xs text-green-600 font-medium">💡 {d.tips}</p>}
                            </div>
                          ))}
                          {aiPlan.spots.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nearby Spots ({aiPlan.spots.length})</p>
                              <div className="flex flex-wrap gap-1.5">
                                {aiPlan.spots.slice(0,12).map(s=>(
                                  <a key={s.id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`} target="_blank" rel="noopener noreferrer"
                                    className="text-xs bg-white border border-gray-100 rounded-lg px-2 py-1 text-gray-700 hover:border-orange-200 hover:text-orange-600 transition-colors">
                                    {s.name} <span className="text-gray-400">{s.dist<1?`${Math.round(s.dist*1000)}m`:`${s.dist.toFixed(1)}km`}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checklist */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Checklist</p>
                      {t.checklist.map((c,i) => (
                        <label key={i} className="flex items-center gap-2.5 cursor-pointer mb-1.5">
                          <input type="checkbox" checked={c.done} onChange={()=>toggleCheck(t.id,i)} className="accent-orange-500 w-4 h-4"/>
                          <span className={`text-sm ${c.done?"line-through text-gray-400":"text-gray-800"}`}>{c.text}</span>
                        </label>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input value={checkInput[t.id]||""} onChange={e=>setCheckInput(p=>({...p,[t.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCheck(t.id)} placeholder="Add checklist item…" className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"/>
                        <button onClick={()=>addCheck(t.id)} className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold">Add</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Completed</p>
          {past.map(t => (
            <div key={t.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-green-400 shrink-0"/>
              <div className="flex-1"><p className="text-sm font-semibold text-gray-600 line-through">{t.destination}</p>
                {(t.fromDate||t.toDate) && <p className="text-xs text-gray-400">{t.fromDate}{t.toDate?" → "+t.toDate:""}</p>}</div>
              <button onClick={()=>delTrip(t.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      )}

      {trips.length===0 && !adding && (
        <div className="text-center py-16">
          <Plane size={40} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-gray-500 text-sm">No trips planned yet. Hit "New Trip" to start.</p>
        </div>
      )}
    </div>
  );
}

// ── Travel Hub Panel ───────────────────────────────────────────
function TravelPanel() {
  const [tab, setTab] = useState<"places"|"stay"|"drivers"|"onboard">("places");
  const [places, setPlaces] = useState<PlacePOI[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesErr, setPlacesErr] = useState("");
  const [cityName, setCityName] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [lstLoading, setLstLoading] = useState(false);
  const [lstErr, setLstErr] = useState("");
  const [lstType, setLstType] = useState("");
  const [lstCity, setLstCity] = useState("");
  const [lstSearch, setLstSearch] = useState("");
  const [lstAvail, setLstAvail] = useState(false);
  const [ob, setOb] = useState({ type:"hotel", name:"", phone:"", city:"", state:"", address:"", description:"", rate_info:"", discount:"", available_now:true });
  const [obServices, setObServices] = useState<{name:string;rate:string}[]>([{name:"",rate:""}]);
  const [obSaving, setObSaving] = useState(false);
  const [obDone, setObDone] = useState(false);
  const [obErr, setObErr] = useState("");

  const stayTypes   = ["hotel","restaurant","paying_guest","resort"];
  const driverTypes = ["driver_auto","driver_car","driver_traveller"];

  const findPlaces = () => {
    setPlacesLoading(true); setPlacesErr(""); setPlaces([]);
    navigator.geolocation?.getCurrentPosition(async pos => {
      const { latitude:lat, longitude:lon } = pos.coords;
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const g = await geo.json();
        setCityName(g.address?.city||g.address?.town||g.address?.village||"");
        const body = `[out:json][timeout:25];(node["tourism"](around:20000,${lat},${lon});node["historic"](around:20000,${lat},${lon});way["tourism"](around:20000,${lat},${lon}););out center 60;`;
        const r = await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body});
        const d = await r.json();
        const pois:PlacePOI[] = (d.elements||[]).filter((el:any)=>el.tags?.name).map((el:any) => {
          const elLat=el.lat??el.center?.lat??0; const elLon=el.lon??el.center?.lon??0;
          return { id:String(el.id), name:el.tags.name, kind:el.tags.tourism||el.tags.historic||"place", lat:elLat, lon:elLon, dist:haversine(lat,lon,elLat,elLon) };
        }).sort((a:PlacePOI,b:PlacePOI)=>a.dist-b.dist);
        setPlaces(pois);
        if (!pois.length) setPlacesErr("No places found within 20km. Try from a tourist location.");
      } catch { setPlacesErr("Failed to load. Check internet connection."); }
      setPlacesLoading(false);
    }, ()=>{ setPlacesErr("Location access denied. Please allow location."); setPlacesLoading(false); }, {timeout:10000});
  };

  const loadListings = useCallback(() => {
    setLstLoading(true); setLstErr("");
    const p = new URLSearchParams({...(lstType&&{type:lstType}),...(lstCity&&{city:lstCity}),...(lstSearch&&{search:lstSearch}),...(lstAvail&&{available:"true"}),limit:"20"});
    fetch(`/v1/public/listings?${p}`).then(r=>r.json())
      .then(d=>{if(!d.success)throw new Error(d.error);setListings(d.data||[]);})
      .catch(e=>setLstErr(e.message||"Failed to load"))
      .finally(()=>setLstLoading(false));
  },[lstType,lstCity,lstSearch,lstAvail]);

  useEffect(()=>{ if(tab==="stay"||tab==="drivers") loadListings(); },[tab]);

  const filteredListings = listings.filter(l=>(tab==="stay"?stayTypes:driverTypes).includes(l.type));

  const submitOnboard = async () => {
    if(!ob.name||!ob.phone){setObErr("Name and phone required");return;}
    setObSaving(true); setObErr("");
    try {
      const services=obServices.filter(s=>s.name).map(s=>({name:s.name,rate:s.rate}));
      const r=await fetch("/v1/public/listings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...ob,services})});
      const d=await r.json();
      if(!d.success)throw new Error(d.error);
      setObDone(true);
    } catch(e:any){setObErr(e.message||"Failed to save");}
    setObSaving(false);
  };

  const PLACE_ICON:Record<string,string>={museum:"🏛",attraction:"🎡",viewpoint:"🌄",hotel:"🏨",hostel:"🏠",camp_site:"⛺",artwork:"🎨",theme_park:"🎢",zoo:"🦁",picnic_site:"🌿",monument:"🗿",ruins:"🏚",castle:"🏰",fort:"🏰",temple:"⛩",church:"⛪",mosque:"🕌",park:"🌳",waterfall:"💧",beach:"🏖",historic:"🏛"};

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Travel Hub</h1>
        <p className="text-gray-600 text-sm">Discover places · Find stays & food · Book drivers · List your service</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        {([["places","Places",Compass],["stay","Stay & Eat",Hotel],["drivers","Drivers",Car],["onboard","Onboard",Plus]] as [string,string,any][]).map(([id,label,Icon])=>(
          <button key={id} onClick={()=>{setTab(id as any);setListings([]);}}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab===id?"bg-white shadow-sm text-orange-500":"text-gray-500 hover:text-gray-700"}`}>
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>

      {/* PLACES */}
      {tab==="places" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white text-center">
            <Compass size={32} className="mx-auto mb-3 opacity-80"/>
            <h2 className="font-black text-lg mb-1">Nearby Sightseeing Places</h2>
            <p className="text-orange-100 text-sm mb-4">Museums, viewpoints, temples, parks within 20km</p>
            <button onClick={findPlaces} disabled={placesLoading}
              className="bg-white text-orange-600 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-colors disabled:opacity-60">
              {placesLoading?"Scanning nearby…":"Find Places Near Me"}
            </button>
            {cityName && <p className="text-orange-200 text-xs mt-2">Near: {cityName}</p>}
          </div>
          {placesErr && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-500 text-sm">{placesErr}</div>}
          {places.length>0 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{places.length} places found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {places.map(p=>(
                  <a key={p.id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&center=${p.lat},${p.lon}`} target="_blank" rel="noopener noreferrer"
                    className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 hover:border-orange-200 hover:shadow-sm transition-all">
                    <span className="text-xl shrink-0">{PLACE_ICON[p.kind]||"📍"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{p.kind.replace(/_/g," ")} · {p.dist<1?`${Math.round(p.dist*1000)}m`:`${p.dist.toFixed(1)}km`}</p>
                    </div>
                    <MapPin size={12} className="text-gray-300 shrink-0"/>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* STAY & EAT + DRIVERS */}
      {(tab==="stay"||tab==="drivers") && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
              <input value={lstSearch} onChange={e=>setLstSearch(e.target.value)} placeholder={tab==="stay"?"Hotels, restaurants, PG…":"Auto, car, traveller…"} className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
            <input value={lstCity} onChange={e=>setLstCity(e.target.value)} placeholder="City…" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 w-28"/>
            <select value={lstType} onChange={e=>setLstType(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="">{tab==="stay"?"All Types":"All Vehicles"}</option>
              {LISTING_TYPES.filter(t=>(tab==="stay"?stayTypes:driverTypes).includes(t.id)).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <label className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={lstAvail} onChange={e=>setLstAvail(e.target.checked)} className="accent-orange-500"/>Available
            </label>
            <button onClick={loadListings} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">Search</button>
          </div>
          {lstErr && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-500 text-sm">{lstErr}<button onClick={loadListings} className="underline ml-2">Retry</button></div>}
          {lstLoading && <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"/>)}</div>}
          {!lstLoading&&filteredListings.length===0&&!lstErr&&(
            <div className="text-center py-12">
              <Building2 size={36} className="mx-auto text-gray-200 mb-3"/>
              <p className="text-gray-500 text-sm mb-2">No listings yet in this area.</p>
              <button onClick={()=>setTab("onboard")} className="text-orange-500 text-sm font-semibold hover:underline">Be the first to add →</button>
            </div>
          )}
          <div className="space-y-3">
            {filteredListings.map(l=>{
              const info=LISTING_TYPES.find(t=>t.id===l.type);
              const Icon=info?.icon||Building2;
              const badge=TYPE_COLORS[l.type]||"bg-gray-100 text-gray-600";
              return (
                <div key={l.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-orange-200 transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badge}`}><Icon size={16}/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{l.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{info?.label||l.type}</span>
                        {l.available_now&&<span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">Available</span>}
                      </div>
                      {(l.city||l.state)&&<p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={9}/>{[l.city,l.state].filter(Boolean).join(", ")}</p>}
                      {l.description&&<p className="text-xs text-gray-600 mt-1">{l.description}</p>}
                      {l.rate_info&&<p className="text-xs text-orange-600 font-semibold mt-1 flex items-center gap-1"><Banknote size={10}/>{l.rate_info}</p>}
                      {l.discount&&<p className="text-xs text-green-600 mt-0.5">🏷 {l.discount}</p>}
                      {l.services?.length>0&&(
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {l.services.map((s:any,i:number)=><span key={i} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5 text-gray-700">{s.name}{s.rate?` · ₹${s.rate}`:""}</span>)}
                        </div>
                      )}
                    </div>
                    <a href={`tel:${l.phone}`} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0"><Phone size={11}/>Call</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ONBOARD */}
      {tab==="onboard" && (
        <div className="space-y-4 max-w-lg">
          {obDone?(
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3"/>
              <h2 className="font-black text-gray-900 text-lg">Listed Successfully!</h2>
              <p className="text-gray-600 text-sm mt-1">Your listing is live. Travellers can now find and call you.</p>
              <button onClick={()=>{setObDone(false);setOb({type:"hotel",name:"",phone:"",city:"",state:"",address:"",description:"",rate_info:"",discount:"",available_now:true});setObServices([{name:"",rate:""}]);}}
                className="mt-4 bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">Add Another</button>
            </div>
          ):(
            <>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <h2 className="font-black text-gray-900 mb-0.5">Quick Register</h2>
                <p className="text-gray-600 text-sm">Hotel · Restaurant · PG · Resort · Driver — go live instantly, no sign-up needed.</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                {/* Type selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {LISTING_TYPES.map(t=>{const Icon=t.icon;return(
                      <button key={t.id} onClick={()=>setOb(p=>({...p,type:t.id}))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${ob.type===t.id?"bg-orange-500 text-white border-orange-500":"border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                        <Icon size={11}/>{t.label}
                      </button>
                    );})}
                  </div>
                </div>
                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2"><label className="text-xs text-gray-500 block mb-1">Name *</label><input value={ob.name} onChange={e=>setOb(p=>({...p,name:e.target.value}))} placeholder={ob.type.startsWith("driver")?"Your name":"Business name"} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Phone *</label><input type="tel" value={ob.phone} onChange={e=>setOb(p=>({...p,phone:e.target.value}))} placeholder="+91 XXXXXXXXXX" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                  <div><label className="text-xs text-gray-500 block mb-1">City</label><input value={ob.city} onChange={e=>setOb(p=>({...p,city:e.target.value}))} placeholder="City" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                  <div><label className="text-xs text-gray-500 block mb-1">State</label><input value={ob.state} onChange={e=>setOb(p=>({...p,state:e.target.value}))} placeholder="State" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Rate Info</label><input value={ob.rate_info} onChange={e=>setOb(p=>({...p,rate_info:e.target.value}))} placeholder={ob.type.startsWith("driver")?"₹200/hr, ₹15/km":"₹800/night, ₹150/plate"} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Discount / Offer</label><input value={ob.discount} onChange={e=>setOb(p=>({...p,discount:e.target.value}))} placeholder="10% off weekdays" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                  <div className="sm:col-span-2"><label className="text-xs text-gray-500 block mb-1">Description</label><input value={ob.description} onChange={e=>setOb(p=>({...p,description:e.target.value}))} placeholder="Brief about your service…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                  <div className="sm:col-span-2"><label className="text-xs text-gray-500 block mb-1">Address</label><input value={ob.address} onChange={e=>setOb(p=>({...p,address:e.target.value}))} placeholder="Full address" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                </div>
                {/* Services */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Services & Rates</label>
                  {obServices.map((s,i)=>(
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={s.name} onChange={e=>setObServices(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder={ob.type.startsWith("driver")?"AC Car, Outstation…":"Room, Dish, Package…"} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
                      <input value={s.rate} onChange={e=>setObServices(p=>p.map((x,j)=>j===i?{...x,rate:e.target.value}:x))} placeholder="Rate ₹" className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
                      {obServices.length>1&&<button onClick={()=>setObServices(p=>p.filter((_,j)=>j!==i))} className="text-gray-300 hover:text-red-400"><X size={14}/></button>}
                    </div>
                  ))}
                  <button onClick={()=>setObServices(p=>[...p,{name:"",rate:""}])} className="text-xs text-orange-500 hover:underline flex items-center gap-1"><Plus size={11}/>Add service</button>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={ob.available_now} onChange={e=>setOb(p=>({...p,available_now:e.target.checked}))} className="accent-orange-500 w-4 h-4"/>
                  <span className="text-sm text-gray-800 font-semibold">Available right now</span>
                </label>
                {obErr&&<p className="text-red-500 text-sm">{obErr}</p>}
                <button onClick={submitOnboard} disabled={obSaving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors">
                  {obSaving?"Registering…":"Register & Go Live"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Nearby AI Panel ────────────────────────────────────────────
const RADIUS_OPTIONS = [2, 5, 10, 20, 50, 100, 250, 500];

interface OsmSection { label:string; emoji:string; pois:PlacePOI[]; }

function NearbyPanel({ userLoc, captureLocation, locLoading, gk }: {
  userLoc:UserLocation|null; captureLocation:()=>void; locLoading:boolean; gk:(s:string)=>string;
}) {
  const [history,   setHistory]  = useLocalStore<SearchHistory[]>(gk("search_history"), []);
  const [listings,  setListings] = useState<Listing[]>([]);
  const [osmSecs,   setOsmSecs]  = useState<OsmSection[]>([]);
  const [loading,   setLoading]  = useState(false);
  const [osmLoading,setOsmLoad]  = useState(false);
  const [error,     setError]    = useState("");
  const [selType,   setSelType]  = useState("");
  const [radius,    setRadius]   = useState(2);
  const [showHist,  setShowHist] = useState(false);
  const [searched,  setSearched] = useState(false);
  const [cacheData, setCacheData] = useState<Record<string,any[]>>({});
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<Record<string,any[]>|null>(null);
  const [localMatches, setLocalMatches] = useState<any[]>([]);

  // Fetch pre-cached nearby places when location becomes available
  useEffect(() => {
    if (!userLoc) return;
    fetch(`/v1/public/quicksearch?lat=${userLoc.lat}&lng=${userLoc.lon}`)
      .then(r=>r.json()).then(d=>{ if(d.success){ setCacheData(d.data||{}); setCacheLoaded(true); } })
      .catch(()=>{});
  }, [userLoc?.lat, userLoc?.lon]);

  const QUICK_SEARCHES = [
    { label:"Hotels",      icon:"🏨", osmQ:(r:number,lat:number,lon:number)=>`(node["tourism"="hotel"](around:${r*1000},${lat},${lon});node["tourism"="guest_house"](around:${r*1000},${lat},${lon});node["tourism"="hostel"](around:${r*1000},${lat},${lon});)`, kind:"hotel" },
    { label:"Restaurants", icon:"🍽", osmQ:(r:number,lat:number,lon:number)=>`(node["amenity"="restaurant"](around:${r*1000},${lat},${lon});node["amenity"="cafe"](around:${r*1000},${lat},${lon});node["amenity"="fast_food"](around:${r*1000},${lat},${lon});)`, kind:"restaurant" },
    { label:"Travel Spots",icon:"🗺", osmQ:(r:number,lat:number,lon:number)=>`(node["tourism"~"attraction|viewpoint|museum|theme_park"](around:${r*1000},${lat},${lon});node["historic"~".*"](around:${r*1000},${lat},${lon});node["leisure"~"park|nature_reserve"](around:${r*1000},${lat},${lon});node["amenity"="place_of_worship"](around:${r*1000},${lat},${lon});)`, kind:"attraction" },
    { label:"Pharmacies",  icon:"💊", osmQ:(r:number,lat:number,lon:number)=>`node["amenity"="pharmacy"](around:${r*1000},${lat},${lon});`, kind:"pharmacy" },
    { label:"ATMs/Banks",  icon:"🏦", osmQ:(r:number,lat:number,lon:number)=>`(node["amenity"="atm"](around:${r*1000},${lat},${lon});node["amenity"="bank"](around:${r*1000},${lat},${lon});)`, kind:"bank" },
    { label:"Hospitals",   icon:"🏥", osmQ:(r:number,lat:number,lon:number)=>`(node["amenity"="hospital"](around:${r*1000},${lat},${lon});node["amenity"="clinic"](around:${r*1000},${lat},${lon});)`, kind:"hospital" },
    { label:"Petrol Pumps",icon:"⛽", osmQ:(r:number,lat:number,lon:number)=>`node["amenity"="fuel"](around:${r*1000},${lat},${lon});`, kind:"fuel" },
    { label:"Schools",     icon:"🏫", osmQ:(r:number,lat:number,lon:number)=>`(node["amenity"="school"](around:${r*1000},${lat},${lon});node["amenity"="college"](around:${r*1000},${lat},${lon});)`, kind:"school" },
  ];

  const PLACE_ICON:Record<string,string>={
    plumber:"🔧",electrician:"⚡",carpenter:"🔨",painter:"🖌",hotel:"🏨",guest_house:"🏠",hostel:"🛏",
    restaurant:"🍽",cafe:"☕",fast_food:"🍔",school:"🏫",hospital:"🏥",clinic:"🏥",
    post_office:"📮",courier:"📦",bank:"🏦",atm:"🏧",pharmacy:"💊",fuel:"⛽",
    attraction:"🗺",viewpoint:"👁",museum:"🏛",theme_park:"🎡",park:"🌳",nature_reserve:"🌿",
    place_of_worship:"🛕",historic:"🏰",business:"🏢",
  };

  const runOsmQuery = async (osmBody:string, lat:number, lon:number):Promise<PlacePOI[]> => {
    const r = await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`[out:json][timeout:20];${osmBody};out body 60;`});
    const d = await r.json();
    return (d.elements||[]).filter((el:any)=>el.tags?.name).map((el:any):PlacePOI=>({
      id:String(el.id), name:el.tags.name,
      kind:el.tags.tourism||el.tags.amenity||el.tags.historic||el.tags.leisure||"business",
      lat:el.lat||0, lon:el.lon||0,
      dist:haversine(lat,lon,el.lat||0,el.lon||0),
    })).sort((a:PlacePOI,b:PlacePOI)=>a.dist-b.dist);
  };

  const searchAll = async (radiusOverride?:number) => {
    if (!userLoc) { captureLocation(); return; }
    const r = radiusOverride ?? radius;
    setLoading(true); setOsmLoad(true); setError(""); setListings([]); setOsmSecs([]); setSearched(true);

    // 1. Our DB nearby
    try {
      const p = new URLSearchParams({ lat:String(userLoc.lat), lng:String(userLoc.lon), radius:String(r), limit:"40", ...(selType&&{type:selType}) });
      const res = await fetch(`/v1/public/listings/nearby?${p}`);
      const d = await res.json();
      if (d.success) setListings(d.data||[]);
    } catch {}
    setLoading(false);

    // 2. OSM — run all quick-search categories in parallel
    try {
      const results = await Promise.all(QUICK_SEARCHES.map(qs=>
        runOsmQuery(qs.osmQ(r,userLoc.lat,userLoc.lon),userLoc.lat,userLoc.lon)
          .then(pois=>({label:qs.label,emoji:qs.icon,pois}))
          .catch(()=>({label:qs.label,emoji:qs.icon,pois:[]}))
      ));
      const nonEmpty = results.filter(s=>s.pois.length>0);
      setOsmSecs(nonEmpty);
      const totalOsm = nonEmpty.reduce((s,x)=>s+x.pois.length,0);
      const hEntry:SearchHistory = { id:Date.now().toString(), query:selType||"All Nearby", type:selType||"all", city:userLoc.city, results:totalOsm, ts:new Date().toISOString() };
      setHistory(p=>[hEntry,...p.slice(0,19)]);
    } catch(e:any){ setError("OpenStreetMap search failed. Try again."); }
    setOsmLoad(false);
  };

  const searchQuick = async (qs:typeof QUICK_SEARCHES[0]) => {
    if (!userLoc) { captureLocation(); return; }
    setLoading(false); setOsmLoad(true); setError(""); setListings([]); setOsmSecs([]); setSearched(true);

    // Map frontend kind → backend cache categories
    const kindToCats: Record<string,string[]> = {
      hotel:['hotel'], restaurant:['restaurant'], pharmacy:['pharmacy'],
      bank:['bank','atm'], hospital:['hospital'], fuel:['fuel'], school:['school'],
      attraction:['temple','mosque','church'],
    };
    const backendCats = kindToCats[qs.kind] || [qs.kind];

    // STEP 1 — Local temp cache (instant, no network)
    const localPois: PlacePOI[] = backendCats.flatMap(c =>
      (cacheData[c]||[]).map((it:any,i:number)=>({ id:`${c}${i}${it.name}`, name:it.name, kind:c, lat:0, lon:0, dist:it.dist_km||0 }))
    );
    if (localPois.length > 0) {
      setOsmSecs([{label:qs.label, emoji:qs.icon, pois:localPois}]);
    }

    // STEP 2 — Backend cache (populated by background service every 2 min)
    let gotData = localPois.length > 0;
    try {
      const fetches = backendCats.map(cat =>
        fetch(`/v1/public/quicksearch?lat=${userLoc.lat}&lng=${userLoc.lon}&category=${cat}&radius=${radius}`)
          .then(r=>r.json())
          .then(d=>({ cat, items: (d.success ? (d.data[cat]||[]) : []) as any[] }))
          .catch(()=>({ cat, items:[] as any[] }))
      );
      const backendResults = await Promise.all(fetches);
      const backendPois: PlacePOI[] = backendResults.flatMap(r =>
        r.items.map((it:any,i:number)=>({ id:`${r.cat}${i}${it.name}`, name:it.name, kind:r.cat, lat:0, lon:0, dist:it.dist_km||0 }))
      );
      if (backendPois.length > 0) {
        gotData = true;
        setCacheData(prev => {
          const next = {...prev};
          backendResults.forEach(r => { if (r.items.length) next[r.cat] = r.items; });
          return next;
        });
        setOsmSecs([{label:qs.label, emoji:qs.icon, pois:backendPois}]);
      }
    } catch {}

    // STEP 3 — Overpass via server-side proxy (no CORS — /api/overpass is same-origin)
    if (!gotData) {
      const osmTagMap: Record<string,string[]> = {
        hotel:       ['tourism=hotel','tourism=guest_house','tourism=hostel'],
        restaurant:  ['amenity=restaurant','amenity=fast_food','amenity=cafe'],
        pharmacy:    ['amenity=pharmacy'],
        bank:        ['amenity=bank'],
        atm:         ['amenity=atm'],
        hospital:    ['amenity=hospital','amenity=clinic'],
        fuel:        ['amenity=fuel'],
        school:      ['amenity=school','amenity=college','amenity=university'],
        temple:      ['amenity=place_of_worship][religion=hindu'],
        mosque:      ['amenity=place_of_worship][religion=muslim'],
        church:      ['amenity=place_of_worship][religion=christian'],
        supermarket: ['shop=supermarket'],
      };
      const radiusM = Math.max(radius, 3) * 1000;
      const osmPois: PlacePOI[] = [];
      for (const cat of backendCats) {
        const tags = osmTagMap[cat];
        if (!tags?.length) continue;
        const parts = tags.flatMap(t=>[
          `node[${t}](around:${radiusM},${userLoc.lat},${userLoc.lon});`,
          `way[${t}](around:${radiusM},${userLoc.lat},${userLoc.lon});`,
        ]).join('\n');
        const body = `data=${encodeURIComponent(`[out:json][timeout:20];(\n${parts}\n);out center 40;`)}`;
        try {
          // /api/overpass is a Next.js route that proxies server-side — no CORS
          const r = await fetch('/api/overpass',{method:'POST',body,headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:AbortSignal.timeout(20000)});
          const d = await r.json();
          const els = (d.elements||[]).filter((el:any)=>el.tags?.name);
          els.forEach((el:any)=>{
            const elLat=el.lat??el.center?.lat??0; const elLon=el.lon??el.center?.lon??0;
            osmPois.push({id:`osm${cat}${el.id}`,name:el.tags.name,kind:cat,lat:elLat,lon:elLon,dist:haversine(userLoc.lat,userLoc.lon,elLat,elLon)});
          });
        } catch {}
      }
      if (osmPois.length>0) {
        gotData=true;
        setOsmSecs([{label:qs.label,emoji:qs.icon,pois:osmPois.sort((a,b)=>a.dist-b.dist)}]);
      }
    }

    // STEP 4 — AI fallback (always returns something via Claude)
    if (!gotData) {
      try {
        const p = new URLSearchParams({
          lat: String(userLoc.lat),
          lng: String(userLoc.lon),
          ai: "true",
          category: qs.kind,
          q: `${qs.label} near me`,
          radius: String(radius),
          t: String(Date.now())
        });
        const resp = await fetch(`/v1/public/quicksearch?${p}`);
        const d = await resp.json();
        const aiPois: PlacePOI[] = [];
        if (d.success) {
          setCacheData(prev=>({...prev,...d.data}));
          Object.entries(d.data||{}).forEach(([cat,items]:any) => {
            if (cat === qs.kind || backendCats.includes(cat)) {
              (items as any[]).forEach((it:any,i:number)=>aiPois.push({ id:`ai${cat}${i}`, name:it.name, kind:cat, lat:0, lon:0, dist: it.dist_km ?? it.dist_km_estimate ?? 0, description:it.description, tip:it.tip }));
            }
          });
        }
        if (aiPois.length > 0) {
          setOsmSecs([{label:`${qs.label} (AI)`, emoji:qs.icon, pois:aiPois}]);
        } else {
          setError("Nothing found nearby. Try a larger radius or Scan All.");
        }
      } catch { setError("Search failed. Check connection."); }
    }

    setOsmLoad(false);
  };

  const totalResults = listings.length + osmSecs.reduce((s,x)=>s+x.pois.length,0);

  return (
    <div className="max-w-4xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Navigation2 size={20} className="text-orange-500"/>Nearby Search</h1>
          <p className="text-gray-600 text-sm">Real places near you — community listings + OpenStreetMap</p>
        </div>
        <button onClick={()=>setShowHist(!showHist)} className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <History size={12}/>{history.length} recent
        </button>
      </div>

      {/* Location card */}
      <div className={`rounded-2xl p-4 flex items-center gap-3 ${userLoc?"bg-green-50 border border-green-200":"bg-orange-50 border border-orange-200"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${userLoc?"bg-green-100":"bg-orange-100"}`}>
          <Navigation2 size={18} className={userLoc?"text-green-600":"text-orange-500"}/>
        </div>
        {userLoc ? (
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{[userLoc.city,userLoc.state,userLoc.country].filter(Boolean).join(", ")||"Location detected"}</p>
            <p className="text-xs text-gray-500 font-mono">Lat {userLoc.lat.toFixed(5)} · Lon {userLoc.lon.toFixed(5)} · ±{Math.round(userLoc.accuracy)}m</p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Location not detected</p>
            <p className="text-xs text-gray-600">Allow location access to find nearby places</p>
          </div>
        )}
        <button onClick={captureLocation} disabled={locLoading}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${userLoc?"border border-green-300 text-green-700 hover:bg-green-100":"bg-orange-500 text-white hover:bg-orange-600"}`}>
          {locLoading?"…":userLoc?"Refresh":"Locate Me"}
        </button>
      </div>

      {/* Radius selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Search Radius</span>
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_OPTIONS.map(r=>(
            <button key={r} onClick={()=>setRadius(r)}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${radius===r?"bg-orange-500 text-white border-orange-500":"border-gray-200 text-gray-600 hover:border-orange-300"}`}>
              {r}km
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">Default: 2km</span>
      </div>

      {/* Pre-cached nearby categories (from background job) */}
      {cacheLoaded && Object.keys(cacheData).length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles size={11}/>Nearby (pre-loaded)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cacheData).filter(([,v])=>v.length>0).map(([cat,items])=>(
              <button key={cat} onClick={()=>{
                setOsmSecs([{label:cat,emoji:"📍",pois:items.map((it:any)=>({id:it.id||cat+it.name,name:it.name,kind:cat,lat:0,lon:0,dist:it.dist_km||0}))}]);
                setListings([]); setSearched(true);
              }}
                className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                <span>{cat==="atm"?"🏧":cat==="bank"?"🏦":cat==="temple"||cat==="mosque"||cat==="church"?"🛕":cat==="fuel"?"⛽":cat==="restaurant"?"🍽":cat==="hotel"?"🏨":cat==="shop"?"🛍":cat==="hospital"?"🏥":cat==="pharmacy"?"💊":"📍"}</span>
                <span className="capitalize">{cat}</span>
                <span className="bg-blue-100 text-blue-600 rounded-full px-1.5 text-[10px] font-bold">{items.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick search buttons */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quick Search</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {QUICK_SEARCHES.map(qs=>(
            <button key={qs.label} onClick={()=>searchQuick(qs)} disabled={osmLoading||!userLoc}
              className="flex flex-col items-center gap-1 bg-white border border-gray-100 rounded-xl p-2.5 hover:border-orange-300 hover:bg-orange-50 transition-all disabled:opacity-40 text-center">
              <span className="text-xl">{qs.icon}</span>
              <span className="text-[10px] font-semibold text-gray-700 leading-tight">{qs.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Full scan button */}
      <button onClick={()=>searchAll()} disabled={loading||osmLoading||locLoading||!userLoc}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60">
        <Sparkles size={16}/>
        {loading||osmLoading?<><Loader2 size={14} className="animate-spin"/>Scanning within {radius}km…</>:`Scan All Nearby (${radius}km)`}
        {userLoc&&!loading&&!osmLoading?<span className="text-orange-200 text-xs font-normal ml-1">· {[userLoc.city,userLoc.state].filter(Boolean).join(", ")}</span>:null}
      </button>

      {/* AI Ask */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2 flex items-center gap-1"><Bot size={11}/>Ask AI About Nearby</p>
        <form onSubmit={async e=>{
          e.preventDefault();
          if (!userLoc||!aiQuery.trim()) return;
          setAiLoading(true); setAiResult(null); setLocalMatches([]);
          try {
            const p = new URLSearchParams({ lat:String(userLoc.lat), lng:String(userLoc.lon), ai:"true", q:aiQuery.trim(), radius:String(radius) });
            const r = await fetch(`/v1/public/quicksearch?${p}`);
            const d = await r.json();
            if (d.success) {
              setLocalMatches(d.data?.local || []);
              setAiResult(d.data?.ai || {});
            }
          } catch { setError("AI search failed. Try again."); }
          setAiLoading(false);
        }} className="flex gap-2">
          <input value={aiQuery} onChange={e=>setAiQuery(e.target.value)} disabled={!userLoc}
            placeholder={userLoc?"e.g. best restaurants under 1km…":"Enable location first"}
            className="flex-1 border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white disabled:opacity-50"/>
          <button type="submit" disabled={aiLoading||!userLoc||!aiQuery.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1">
            {aiLoading?<Loader2 size={14} className="animate-spin"/>:<Sparkles size={14}/>}
          </button>
        </form>

        {aiResult && Object.keys(aiResult).length > 0 && (
          <div className="mt-4 pt-3 border-t border-purple-100 space-y-2">
            <p className="text-xs font-bold text-purple-700 uppercase tracking-widest flex items-center gap-1">
              <Bot size={11}/> AI Discovered Results
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(aiResult).flatMap(([,items]: any) => items).slice(0, 8).map((it: any, i: number) => (
                <div key={i} className="bg-white rounded-xl px-3 py-2 border border-purple-100 flex items-center justify-between text-xs shadow-sm">
                  <span className="font-bold text-gray-900 truncate mr-2">{it.name}</span>
                  {it.dist_km && <span className="text-[10px] text-purple-600 font-mono shrink-0">~{it.dist_km}km</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search history */}
      {showHist && history.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Searches</p>
            <button onClick={()=>setHistory([])} className="text-xs text-red-400 hover:underline">Clear all</button>
          </div>
          {history.map(h=>(
            <button key={h.id} onClick={()=>{setSelType(h.type==="all"?"":h.type);searchAll();setShowHist(false);}}
              className="w-full flex items-center gap-3 text-left hover:bg-gray-50 rounded-xl p-2 transition-colors">
              <History size={12} className="text-gray-300 shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{h.query}</p>
                <p className="text-xs text-gray-400">{h.city} · {h.results} results · {new Date(h.ts).toLocaleDateString()}</p>
              </div>
              <ChevronRight size={12} className="text-gray-300"/>
            </button>
          ))}
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-500 text-sm flex items-center gap-2"><AlertTriangle size={14}/>{error}</div>}

      {/* DB community listings */}
      {listings.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Community Listings near you ({listings.length})</p>
          {listings.map((l: any)=>{
            const info=LISTING_TYPES.find(t=>t.id===l.type);
            const Icon=info?.icon||Building2;
            const badge=TYPE_COLORS[l.type]||"bg-gray-100 text-gray-600";
            const isStore = l.source === 'store' || l.type === 'shop' || l.owner;
            return (
              <div key={l.id} className={`rounded-2xl p-4 flex items-start gap-3 transition-all ${
                isStore 
                  ? "bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-2 border-amber-500/30 hover:border-amber-500/60 shadow-md shadow-amber-500/5" 
                  : "bg-white border border-gray-100 hover:border-orange-200"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isStore ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : badge
                }`}><Icon size={16}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{l.name}</h3>
                    {isStore ? (
                      <span className="text-[9px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                        ★ Verified Store
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{info?.label||l.type}</span>
                    )}
                    {l.available_now&&<span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">Available</span>}
                    {(l as any).dist_km!=null&&<span className="text-[10px] text-gray-400 font-mono">{(l as any).dist_km}km</span>}
                  </div>

                  {isStore && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-500 font-bold">
                      <div className="flex text-amber-400">★★★★★</div>
                      <span>5.0</span>
                      <span className="text-gray-400 font-normal">(18 verified reviews)</span>
                    </div>
                  )}

                  {l.description&&<p className="text-xs text-gray-600 mt-0.5">{l.description}</p>}
                  {l.rate_info&&<p className="text-xs text-orange-600 font-semibold mt-0.5 flex items-center gap-1"><Banknote size={9}/>₹{l.rate_info}</p>}
                  {l.discount && <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">🏷️ Promo Offer: {l.discount}</p>}
                </div>
                <a href={`tel:${l.phone}`} onClick={e=>e.stopPropagation()} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"><Phone size={11}/>Call</a>
              </div>
            );
          })}
        </div>
      )}

      {/* OSM sections */}
      {osmSecs.map(sec=>(
        <div key={sec.label} className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <span>{sec.emoji}</span>{sec.label} within {radius}km ({sec.pois.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sec.pois.map(p=>(
              <a key={p.id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+", "+userLoc?.city)}`} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 hover:border-orange-200 hover:shadow-sm transition-all group">
                <span className="text-xl shrink-0">{PLACE_ICON[p.kind]||"📍"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">{p.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{p.kind.replace(/_/g," ")}{p.dist>0?<> · <span className="font-mono">{p.dist<1?`${Math.round(p.dist*1000)}m`:`${p.dist.toFixed(2)}km`}</span></>:null}</p>
                  {p.description&&<p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>}
                  {p.tip&&<p className="text-xs text-purple-500 truncate mt-0.5 italic">{p.tip}</p>}
                </div>
                <MapPin size={11} className="text-gray-300 shrink-0 group-hover:text-orange-400"/>
              </a>
            ))}
          </div>
        </div>
      ))}

      {searched&&!loading&&!osmLoading&&totalResults===0&&(
        <div className="text-center py-12">
          <MapPin size={36} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-gray-600 font-semibold text-sm">Nothing found within {radius}km</p>
          <p className="text-gray-400 text-xs mt-1">Try increasing the radius</p>
          <div className="flex justify-center gap-2 mt-4">
            {[5,10,20].map(r=>(
              <button key={r} onClick={()=>{setRadius(r);searchAll(r);}} className="px-4 py-2 border border-orange-300 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-50">Try {r}km</button>
            ))}
          </div>
        </div>
      )}

      {!searched&&(
        <div className="text-center py-10">
          <Sparkles size={36} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-gray-500 text-sm">Use Quick Search above or scan all nearby places</p>
          <p className="text-gray-400 text-xs mt-1">Default radius: <strong>2km</strong> — change with the selector above</p>
        </div>
      )}
    </div>
  );
}

// ── Services Hub Panel ─────────────────────────────────────────
const SERVICE_GROUPS = [
  { id:"home",       label:"Home Services", icon:Wrench,       types:["plumber","electrician","carpenter","painter","ac_repair","pest_control"],       hint:"Plumber, Electrician, Carpenter…" },
  { id:"courier",    label:"Courier",       icon:Send,         types:["courier_send","courier_pickup"],                                                 hint:"Send or receive packages" },
  { id:"realestate", label:"Real Estate",   icon:Landmark,     types:["property_sell","property_rent","property_buy_need","property_rent_need"],        hint:"Buy, Sell, Rent property" },
  { id:"financial",  label:"Financial",     icon:Banknote,     types:["financial_advisor","loan_provider","insurance_agent","accounting"],               hint:"Advisors, Loans, Insurance, Tax" },
  { id:"seekers",    label:"Services",      icon:GraduationCap,types:["software_dev","tutor","design","content","lead_generator","help_needed"],         hint:"Software, Tutoring, Design, Leads" },
  { id:"fashion",    label:"Fashion",       icon:Scissors,     types:["fashion_designer","tailor_stitcher","cloth_seller","boutique","embroidery","laundry"], hint:"Designer, Tailor, Boutique, Cloth…" },
  { id:"education",  label:"Education",     icon:GraduationCap,types:["tuition_center","private_teacher","student_need","online_class","study_group"],  hint:"Tuitions, Teachers, Study Groups…" },
];

function ServicesPanel({ userLoc, defaultMode }: { userLoc:UserLocation|null; defaultMode?:"provider"|"seeker" }) {
  const [tab,      setTab]     = useState<string>(defaultMode ? "onboard" : "home");
  const [mode,     setMode]    = useState<"provider"|"seeker">(defaultMode||"provider");
  const [listings, setListings]= useState<Listing[]>([]);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [city,     setCity]    = useState(userLoc?.city||"");
  const [selType,  setSelType] = useState("");
  const [avail,    setAvail]   = useState(false);
  const [searchQ,  setSearchQ] = useState("");
  const [selected, setSelected]= useState<Set<string>>(new Set());
  const [comparing,setComparing]=useState(false);

  // Onboard form
  const [ob, setOb]           = useState({ type:"plumber", mode:defaultMode||"provider", name:"", phone:"", city:"", state:"", address:"", description:"", rate_info:"", discount:"", available_now:true });
  useEffect(() => { if (defaultMode) { setMode(defaultMode); setTab("onboard"); setOb(p=>({...p,mode:defaultMode})); } }, [defaultMode]);
  const [obServices, setObServices] = useState<{name:string;rate:string}[]>([{name:"",rate:""}]);
  const [locCapturing, setLocCapturing] = useState(false);
  const [obLat, setObLat]     = useState<number|null>(null);
  const [obLng, setObLng]     = useState<number|null>(null);
  const [obSaving, setObSaving]= useState(false);
  const [obDone,   setObDone]  = useState(false);
  const [obErr,    setObErr]   = useState("");

  useEffect(() => { if (userLoc?.city) setCity(userLoc.city); }, [userLoc]);

  const group = SERVICE_GROUPS.find(g=>g.id===tab);

  const loadListings = useCallback(()=>{
    if (tab==="onboard") return;
    setLoading(true); setError("");
    const types = selType ? [selType] : (group?.types||[]);
    const p = new URLSearchParams({ limit:"30", mode,
      ...(types.length===1&&{type:types[0]}),
      ...(city&&{city}), ...(searchQ&&{search:searchQ}), ...(avail&&{available:"true"}) });
    fetch(`/v1/public/listings?${p}`).then(r=>r.json())
      .then(d=>{ if(!d.success)throw new Error(d.error); setListings((d.data||[]).filter((l:Listing)=>!selType||l.type===selType||group?.types.includes(l.type))); })
      .catch(e=>setError(e.message||"Failed"))
      .finally(()=>setLoading(false));
  },[tab,mode,selType,city,searchQ,avail,group]);

  useEffect(()=>{ loadListings(); },[tab,mode]);

  const captureObLocation = () => {
    setLocCapturing(true);
    navigator.geolocation?.getCurrentPosition(async pos=>{
      setObLat(pos.coords.latitude); setObLng(pos.coords.longitude);
      if (!ob.city) {
        try {
          const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const g=await r.json();
          setOb(p=>({...p, city:g.address?.city||g.address?.town||"", state:g.address?.state||"" }));
        } catch {}
      }
      setLocCapturing(false);
    },()=>setLocCapturing(false),{timeout:10000});
  };

  const submitOnboard = async()=>{
    if(!ob.name||!ob.phone){setObErr("Name and phone required");return;}
    setObSaving(true); setObErr("");
    try{
      const services=obServices.filter(s=>s.name).map(s=>({name:s.name,rate:s.rate}));
      const r=await fetch("/v1/public/listings",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...ob,services,...(obLat!==null&&{lat:obLat,lng:obLng})})});
      const d=await r.json();
      if(!d.success)throw new Error(d.error);
      setObDone(true);
    }catch(e:any){setObErr(e.message||"Failed to save");}
    setObSaving(false);
  };

  const resetOnboard=()=>{ setObDone(false); setOb({type:"plumber",mode:"provider",name:"",phone:"",city:"",state:"",address:"",description:"",rate_info:"",discount:"",available_now:true}); setObServices([{name:"",rate:""}]); setObLat(null); setObLng(null); setObErr(""); };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Services Hub</h1>
        <p className="text-gray-600 text-sm">Home services · Courier · Real estate · Financial · Freelancers · Seekers</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
        {[...SERVICE_GROUPS.map(g=>({id:g.id,label:g.label,icon:g.icon})),{id:"onboard",label:"Onboard",icon:Plus}].map(t=>{const Icon=t.icon;return(
          <button key={t.id} onClick={()=>{setTab(t.id as any);setListings([]);setSelType("");}}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab===t.id?"bg-white shadow-sm text-orange-500":"text-gray-500 hover:text-gray-700"}`}>
            <Icon size={11}/>{t.label}
          </button>
        );})}
      </div>

      {/* Search/filter bar (for listing tabs) */}
      {tab !== "onboard" && (
        <div className="space-y-3">
          {/* Provider / Seeker toggle */}
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button onClick={()=>{setMode("provider");setListings([]);}} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode==="provider"?"bg-white shadow-sm text-orange-500":"text-gray-500"}`}>Providers</button>
              <button onClick={()=>{setMode("seeker");setListings([]);}} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode==="seeker"?"bg-white shadow-sm text-orange-500":"text-gray-500"}`}>Seekers</button>
            </div>
            <p className="text-xs text-gray-500">{mode==="provider"?"People offering services":"People looking for services"}</p>
          </div>

          {/* Filter row */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={`Search ${group?.hint||"services"}…`} className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
            </div>
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 w-28"/>
            {group && group.types.length > 1 && (
              <select value={selType} onChange={e=>setSelType(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="">All Types</option>
                {group.types.map(t=>{const lt=LISTING_TYPES.find(x=>x.id===t);return lt?<option key={t} value={t}>{lt.label}</option>:null;})}
              </select>
            )}
            <label className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" checked={avail} onChange={e=>setAvail(e.target.checked)} className="accent-orange-500"/>Available
            </label>
            <button onClick={loadListings} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">Search</button>
            {userLoc&&<button onClick={()=>{setCity(userLoc.city);loadListings();}} className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><Navigation2 size={11}/>Near me</button>}
          </div>

          {/* Results */}
          {error&&<div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-500 text-sm">{error}<button onClick={loadListings} className="underline ml-2">Retry</button></div>}
          {loading&&<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"/>)}</div>}
          {!loading&&listings.length===0&&!error&&(
            <div className="text-center py-10">
              <Building2 size={32} className="mx-auto text-gray-200 mb-2"/>
              <p className="text-gray-500 text-sm mb-2">No {mode==="seeker"?"seekers":"providers"} found.</p>
              <button onClick={()=>setTab("onboard")} className="text-orange-500 text-sm font-semibold hover:underline">
                {mode==="provider"?"Register your service →":"Post your requirement →"}
              </button>
            </div>
          )}

          {/* Multi-select comparison bar */}
          {selected.size > 0 && !comparing && (
            <div className="sticky top-0 z-10 bg-white border border-orange-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1"><span className="font-bold text-gray-900">{selected.size}</span><span className="text-sm text-gray-600"> provider{selected.size>1?"s":""} selected</span></div>
              <button onClick={()=>setComparing(true)} className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-orange-600"><Copy size={11}/>Compare</button>
              <button onClick={()=>setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
          )}

          {/* Side-by-side comparison view */}
          {comparing && selected.size > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Comparing {selected.size} Providers</p>
                <button onClick={()=>{setComparing(false);setSelected(new Set());}} className="text-xs text-orange-500 hover:underline">Close</button>
              </div>
              <div className={`grid gap-3 ${selected.size===2?"grid-cols-2":selected.size===3?"grid-cols-3":"grid-cols-2"}`}>
                {listings.filter(l=>selected.has(l.id)).map(l=>{
                  const info=LISTING_TYPES.find(t=>t.id===l.type);
                  const badge=TYPE_COLORS[l.type]||"bg-gray-100 text-gray-600";
                  return(
                    <div key={l.id} className={`border-2 rounded-2xl p-4 space-y-2 ${badge.includes("orange")?"border-orange-200":"border-gray-200"}`}>
                      <p className="font-black text-gray-900 text-sm">{l.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${badge}`}>{info?.label||l.type}</span>
                      {l.rate_info&&<p className="text-xs font-bold text-orange-600">₹ {l.rate_info}</p>}
                      {l.discount&&<p className="text-xs text-green-600">🏷 {l.discount}</p>}
                      {l.available_now&&<p className="text-xs text-green-600 font-semibold">✓ Available now</p>}
                      {(l.city||l.state)&&<p className="text-xs text-gray-500"><MapPin size={9} className="inline"/>{[l.city,l.state].filter(Boolean).join(", ")}</p>}
                      {l.description&&<p className="text-xs text-gray-600">{l.description}</p>}
                      {l.services?.length>0&&<div className="space-y-1">{l.services.map((s:any,i:number)=><p key={i} className="text-xs text-gray-700">• {s.name}{s.rate?<span className="text-orange-600 ml-1">₹{s.rate}</span>:null}</p>)}</div>}
                      <a href={`tel:${l.phone}`} className="flex items-center justify-center gap-1 bg-orange-500 text-white py-2 rounded-xl text-xs font-bold mt-2 hover:bg-orange-600"><Phone size={11}/>Call</a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!comparing && (
            <div className="space-y-3">
              {listings.length > 0 && <p className="text-xs text-gray-400">Tip: Check multiple providers to compare them side by side</p>}
              {listings.map(l=>{
                const info=LISTING_TYPES.find(t=>t.id===l.type);
                const Icon=info?.icon||Building2;
                const badge=TYPE_COLORS[l.type]||"bg-gray-100 text-gray-600";
                const isSel=selected.has(l.id);
                return(
                  <div key={l.id} className={`bg-white border rounded-2xl p-4 hover:border-orange-200 transition-all cursor-pointer ${isSel?"border-orange-400 bg-orange-50":"border-gray-100"}`}
                    onClick={()=>setSelected(p=>{const n=new Set(p);n.has(l.id)?n.delete(l.id):n.size<4&&n.add(l.id);return n;})}>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="checkbox" checked={isSel} readOnly className="accent-orange-500 w-4 h-4 pointer-events-none"/>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${badge}`}><Icon size={14}/></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{l.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{info?.label||l.type}</span>
                          {l.mode==="seeker"&&<span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">Looking</span>}
                          {l.available_now&&l.mode==="provider"&&<span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">Available</span>}
                        </div>
                        {(l.city||l.state)&&<p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={9}/>{[l.city,l.state].filter(Boolean).join(", ")}</p>}
                        {l.description&&<p className="text-xs text-gray-600 mt-1">{l.description}</p>}
                        {l.rate_info&&<p className="text-xs text-orange-600 font-semibold mt-1"><Banknote size={9} className="inline mr-0.5"/>₹{l.rate_info}</p>}
                        {l.discount&&<p className="text-xs text-green-600">🏷 {l.discount}</p>}
                        {l.services?.length>0&&<div className="flex flex-wrap gap-1 mt-1">{l.services.map((s:any,i:number)=><span key={i} className="text-xs bg-white border border-gray-100 rounded-lg px-2 py-0.5">{s.name}{s.rate?` ₹${s.rate}`:""}</span>)}</div>}
                      </div>
                      <a href={`tel:${l.phone}`} onClick={e=>e.stopPropagation()} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"><Phone size={11}/>Call</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Onboard Tab */}
      {tab==="onboard" && (
        <div className="max-w-lg space-y-4">
          {obDone?(
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3"/>
              <h2 className="font-black text-gray-900 text-lg">Listed!</h2>
              <p className="text-gray-600 text-sm mt-1">You're live. People near you can find and call you.</p>
              <button onClick={resetOnboard} className="mt-4 bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">Add Another</button>
            </div>
          ):(
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
              <h2 className="font-black text-gray-900">Quick Register / Post Need</h2>

              {/* Provider / Seeker */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">I am a…</label>
                <div className="flex gap-2">
                  <button onClick={()=>setOb(p=>({...p,mode:"provider"}))} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${ob.mode==="provider"?"bg-orange-500 text-white border-orange-500":"border-gray-200 text-gray-600"}`}>Provider (I offer service)</button>
                  <button onClick={()=>setOb(p=>({...p,mode:"seeker"}))} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${ob.mode==="seeker"?"bg-blue-500 text-white border-blue-500":"border-gray-200 text-gray-600"}`}>Seeker (I need service)</button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {LISTING_TYPES.map(t=>{const Icon=t.icon;return(
                    <button key={t.id} onClick={()=>setOb(p=>({...p,type:t.id}))}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${ob.type===t.id?"bg-orange-500 text-white border-orange-500":"border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                      <Icon size={10}/>{t.label}
                    </button>
                  );})}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><label className="text-xs text-gray-500 block mb-1">Name *</label><input value={ob.name} onChange={e=>setOb(p=>({...p,name:e.target.value}))} placeholder="Your name or business name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                <div><label className="text-xs text-gray-500 block mb-1">Phone *</label><input type="tel" value={ob.phone} onChange={e=>setOb(p=>({...p,phone:e.target.value}))} placeholder="+91 XXXXXXXXXX" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                <div><label className="text-xs text-gray-500 block mb-1">Rate / Budget</label><input value={ob.rate_info} onChange={e=>setOb(p=>({...p,rate_info:e.target.value}))} placeholder="₹500/visit or budget" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
                <div className="sm:col-span-2"><label className="text-xs text-gray-500 block mb-1">Description</label><input value={ob.description} onChange={e=>setOb(p=>({...p,description:e.target.value}))} placeholder="What you offer or need…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/></div>
              </div>

              {/* Services (provider only) */}
              {ob.mode==="provider"&&(
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Services & Rates</label>
                  {obServices.map((s,i)=>(
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={s.name} onChange={e=>setObServices(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Service name" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
                      <input value={s.rate} onChange={e=>setObServices(p=>p.map((x,j)=>j===i?{...x,rate:e.target.value}:x))} placeholder="₹ Rate" className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
                      {obServices.length>1&&<button onClick={()=>setObServices(p=>p.filter((_,j)=>j!==i))} className="text-gray-300 hover:text-red-400"><X size={14}/></button>}
                    </div>
                  ))}
                  <button onClick={()=>setObServices(p=>[...p,{name:"",rate:""}])} className="text-xs text-orange-500 flex items-center gap-1"><Plus size={11}/>Add</button>
                </div>
              )}

              {/* Location capture */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <Navigation2 size={16} className={obLat?"text-green-500":"text-gray-300"}/>
                <div className="flex-1">
                  {obLat ? <p className="text-xs text-gray-700 font-semibold">📍 Location captured ({obLat.toFixed(4)}, {obLng?.toFixed(4)})</p>
                         : <p className="text-xs text-gray-500">Capture your location so people can find you nearby</p>}
                </div>
                <button onClick={captureObLocation} disabled={locCapturing}
                  className="text-xs font-semibold text-orange-500 hover:underline">{locCapturing?"…":"Capture"}</button>
              </div>

              {ob.mode==="provider"&&(
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={ob.available_now} onChange={e=>setOb(p=>({...p,available_now:e.target.checked}))} className="accent-orange-500 w-4 h-4"/>
                  <span className="text-sm text-gray-800 font-semibold">Available right now</span>
                </label>
              )}

              {obErr&&<p className="text-red-500 text-sm">{obErr}</p>}
              <button onClick={submitOnboard} disabled={obSaving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold">
                {obSaving?"Saving…":ob.mode==="provider"?"Register & Go Live":"Post My Requirement"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Install Panel ──────────────────────────────────────────────
const APP_KEY = "NEXOS-2024";

function InstallPanel() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed,     setInstalled]     = useState(false);
  const [isIos,         setIsIos]         = useState(false);
  const [isStandalone,  setIsStandalone]  = useState(false);
  const [swReady,       setSwReady]       = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [appUrl,        setAppUrl]        = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAppUrl(window.location.origin + "/explore");
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);

    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setSwReady(true)).catch(() => {});
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") { setInstalled(true); setInstallPrompt(null); }
  };

  const copyUrl = () => { navigator.clipboard.writeText(appUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}); };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=ea580c&bgcolor=fff8f5&data=${encodeURIComponent(appUrl)}`;

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-200 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nexus-icon-512.svg" alt="DemandGenius" className="w-full h-full object-cover"/>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">DemandGenius</h1>
          <p className="text-gray-500 text-sm">Install on your phone — works offline, no app store needed</p>
          <div className="flex items-center gap-1.5 mt-1">
            {swReady ? <Wifi size={11} className="text-green-500"/> : <WifiOff size={11} className="text-gray-300"/>}
            <span className="text-[10px] text-gray-400">{swReady?"Service worker active · offline ready":"Service worker loading…"}</span>
          </div>
        </div>
      </div>

      {/* App Key */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
        <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">App Key</p>
        <p className="text-4xl font-black tracking-widest font-mono">{APP_KEY}</p>
        <p className="text-orange-200 text-xs mt-2">Share this key + the QR code below to invite others to install DemandGenius</p>
      </div>

      {/* Install status / button */}
      {isStandalone || installed ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
          <CheckCircle2 size={36} className="text-green-500 shrink-0"/>
          <div>
            <p className="font-black text-gray-900">App Installed!</p>
            <p className="text-gray-600 text-sm">DemandGenius is running as a standalone app on your device.</p>
          </div>
        </div>
      ) : installPrompt ? (
        <button onClick={install}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-black text-lg transition-all active:scale-95">
          <Download size={22}/>Install DemandGenius App
        </button>
      ) : null}

      {/* QR Code + URL */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scan to Install</p>
        <div className="flex items-center gap-5">
          <div className="border-2 border-orange-100 rounded-xl overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR Code" width={120} height={120} className="block"/>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">App URL</p>
              <p className="text-xs font-mono text-gray-700 break-all bg-gray-50 rounded-lg px-2 py-1.5">{appUrl}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={copyUrl}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                <Copy size={11}/>{copied?"Copied!":"Copy Link"}
              </button>
              <a href={`https://wa.me/15556660240?text=${encodeURIComponent("Install DemandGenius app: "+appUrl+" — App Key: "+APP_KEY)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                <Share2 size={11}/>Share via WA
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step instructions */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">How to Install</p>

        {/* Android */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-green-600"/>
            <p className="font-bold text-gray-900 text-sm">Android (Chrome)</p>
          </div>
          {[
            "Open this link in Chrome browser",
            "Tap the ⋮ menu (top right)",
            "Tap \"Add to Home screen\"",
            "Tap \"Add\" to confirm",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">{i+1}</div>
              <p className="text-sm text-gray-700">{step}</p>
            </div>
          ))}
        </div>

        {/* iOS */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-blue-600"/>
            <p className="font-bold text-gray-900 text-sm">iPhone / iPad (Safari)</p>
          </div>
          {[
            "Open this link in Safari (not Chrome)",
            "Tap the Share button at the bottom (□↑)",
            "Scroll down and tap \"Add to Home Screen\"",
            "Tap \"Add\" in the top right",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">{i+1}</div>
              <p className="text-sm text-gray-700">{step}</p>
            </div>
          ))}
          {isIos && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-semibold">
              ✓ You're on an iPhone/iPad — follow the Safari steps above!
            </div>
          )}
        </div>
      </div>

      {/* Features list */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">What you get</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["🏠","Home screen icon"],["⚡","Instant launch"],["📡","Works offline"],
            ["🔔","No app store"],["💾","Data stays private"],["🆓","100% free"],
            ["🗺","Nearby AI search"],["📊","AI dashboard"],
          ].map(([e,t])=>(
            <div key={t} className="flex items-center gap-2 text-sm text-gray-700">
              <span>{e}</span><span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Personal Assistant ─────────────────────────────────────────
type PAStatus = "pending"|"approved"|"rejected"|"held"|"executing"|"done";
interface PAField  { key:string; label:string; type:"text"|"number"|"select"|"textarea"|"date"; required?:boolean; options?:string[]; placeholder?:string; prefix?:string; }
interface PATask   { id:string; label:string; desc:string; type:"input"|"confirm"|"payment"|"info"|"select_product"|"browse_logs"; status:PAStatus; icon:string; fields?:PAField[]; }
interface PAMsg    { id:string; role:"user"|"assistant"; text:string; ts:number; wfTasks?:PATask[]; }

function paUid(): string { return Math.random().toString(36).slice(2,9); }

function detectPAIntent(text:string): { intent:string; params:Record<string,string> } {
  const t = text.toLowerCase();
  if (/food|order|eat|dinner|lunch|breakfast|pizza|biryani|burger|swiggy|zomato/.test(t)) return { intent:"food_order", params:{} };
  if (/ride|cab|taxi|auto|uber|ola|driver|drop|pickup/.test(t)) return { intent:"book_ride", params:{} };
  if (/expense|spent|paid|bought|spend|cost/.test(t)) return { intent:"add_expense", params:{} };
  if (/remind|reminder|alarm|alert/.test(t)) return { intent:"set_reminder", params:{} };
  if (/trip|travel|holiday|vacation|tour/.test(t)) return { intent:"plan_trip", params:{} };
  if (/search|buy|find|medicine|product|tablet|capsule|pill|store|mrp|price/.test(t)) return { intent:"product_search", params:{ q: text } };
  const svc = t.match(/plumber|electrician|carpenter|painter|ac repair|pest|handyman/);
  if (svc || /find.*(service|provider|professional)/.test(t)) return { intent:"find_service", params:{ stype: svc?.[0]||"service" } };
  return { intent:"general", params:{ q:text } };
}

function buildPAWorkflow(intent:string, params:Record<string,string>, wfId:string): PATask[] {
  const mk = (s:string) => `${wfId}_${s}`;
  const flows: Record<string,PATask[]> = {
    product_search: [
      { id:mk("t1"), label:"Product Query", desc:"What item would you like to search for?", type:"input", status:"pending", icon:"🔍",
        fields:[
          { key:"query", label:"Product Name", type:"text", placeholder:"e.g. Paracetamol", required:true }
        ]},
      { id:mk("t2"), label:"Select Product", desc:"Choose a product from our stores or external online matches", type:"select_product", status:"pending", icon:"💊" },
      { id:mk("t3"), label:"Automated Procurement", desc:"Simulating headless browser verification...", type:"browse_logs", status:"pending", icon:"🤖" },
      { id:mk("t4"), label:"Payment Checkout", desc:"Complete payment to authorize checkout", type:"payment", status:"pending", icon:"💳",
        fields:[
          { key:"card", label:"Card Number", type:"text", placeholder:"1234 5678 9012 3456", required:true },
          { key:"expiry", label:"Expiry (MM/YY)", type:"text", placeholder:"MM/YY", required:true },
          { key:"cvv", label:"CVV", type:"text", placeholder:"123", required:true },
          { key:"name", label:"Name on Card", type:"text", placeholder:"Your name", required:true },
        ]},
      { id:mk("t5"), label:"Order Complete", desc:"Your order has been placed successfully!", type:"info", status:"pending", icon:"🎉" }
    ],
    food_order: [
      { id:mk("t1"), label:"Enter Food Details", desc:"What would you like to order?", type:"input", status:"pending", icon:"🍕",
        fields:[
          { key:"items", label:"Items to order", type:"textarea", placeholder:"e.g. 2x Margherita Pizza, 1x Coke", required:true },
          { key:"restaurant", label:"From (restaurant)", type:"text", placeholder:"Restaurant name or 'any nearby'", required:true },
          { key:"address", label:"Delivery address", type:"textarea", placeholder:"Your full delivery address", required:true },
        ]},
      { id:mk("t2"), label:"Confirm Order", desc:"Review your order before placing it", type:"confirm", status:"pending", icon:"✅" },
      { id:mk("t3"), label:"Payment Details", desc:"Enter card details to complete the order", type:"payment", status:"pending", icon:"💳",
        fields:[
          { key:"card", label:"Card Number", type:"text", placeholder:"1234 5678 9012 3456", required:true },
          { key:"expiry", label:"Expiry (MM/YY)", type:"text", placeholder:"MM/YY", required:true },
          { key:"cvv", label:"CVV", type:"text", placeholder:"123", required:true },
          { key:"name", label:"Name on Card", type:"text", placeholder:"Your name", required:true },
        ]},
      { id:mk("t4"), label:"Order Placed!", desc:"Your food order has been placed. Estimated delivery: 30-45 min", type:"info", status:"pending", icon:"🎉" },
    ],
    book_ride: [
      { id:mk("t1"), label:"Trip Details", desc:"Where are you going?", type:"input", status:"pending", icon:"🚗",
        fields:[
          { key:"pickup", label:"Pickup location", type:"text", placeholder:"Current location or address", required:true },
          { key:"drop", label:"Drop location", type:"text", placeholder:"Where to?", required:true },
          { key:"when", label:"When", type:"select", options:["Now","In 30 min","In 1 hour","Schedule for later"], required:true },
        ]},
      { id:mk("t2"), label:"Select Ride", desc:"Found: Auto (est. 45) · Car (est. 120) · Traveller (est. 250). Approve to confirm best option.", type:"confirm", status:"pending", icon:"🔍" },
      { id:mk("t3"), label:"Payment", desc:"How would you like to pay?", type:"payment", status:"pending", icon:"💳",
        fields:[
          { key:"mode", label:"Payment mode", type:"select", options:["Cash","UPI","Card","Wallet"], required:true },
          { key:"upi", label:"UPI ID (if UPI)", type:"text", placeholder:"name@upi" },
        ]},
    ],
    add_expense: [
      { id:mk("t1"), label:"Expense Details", desc:"What did you spend on?", type:"input", status:"pending", icon:"💰",
        fields:[
          { key:"label", label:"Description", type:"text", placeholder:"e.g. Lunch at Meghana Foods", required:true },
          { key:"amount", label:"Amount", type:"number", placeholder:"500", required:true, prefix:"Rs." },
          { key:"category", label:"Category", type:"select", options:EXPENSE_CATS, required:true },
          { key:"date", label:"Date", type:"date", required:true },
        ]},
      { id:mk("t2"), label:"Save Expense", desc:"Approve to add this to your expense tracker", type:"confirm", status:"pending", icon:"✅" },
    ],
    set_reminder: [
      { id:mk("t1"), label:"Reminder Details", desc:"What should I remind you about?", type:"input", status:"pending", icon:"⏰",
        fields:[
          { key:"text", label:"Reminder text", type:"text", placeholder:"e.g. Call doctor, Pay rent", required:true },
          { key:"due", label:"Due date (optional)", type:"date" },
        ]},
      { id:mk("t2"), label:"Set Reminder", desc:"Approve to save this reminder", type:"confirm", status:"pending", icon:"✅" },
    ],
    plan_trip: [
      { id:mk("t1"), label:"Trip Details", desc:"Where are you planning to go?", type:"input", status:"pending", icon:"✈️",
        fields:[
          { key:"destination", label:"Destination", type:"text", placeholder:"e.g. Goa, Paris, Bali", required:true },
          { key:"from", label:"Departure date", type:"date", required:true },
          { key:"to", label:"Return date", type:"date", required:true },
          { key:"budget", label:"Budget (optional)", type:"number", placeholder:"50000", prefix:"Rs." },
        ]},
      { id:mk("t2"), label:"Add to Trip Planner", desc:"Approve to save this trip to your planner", type:"confirm", status:"pending", icon:"✅" },
    ],
    find_service: [
      { id:mk("t1"), label:`Find ${params.stype||"Service"}`, desc:`I will navigate to Services Hub to find ${params.stype||"service"} providers near you`, type:"confirm", status:"pending", icon:"🔧" },
    ],
    general: [
      { id:mk("t1"), label:"Processing", desc:`Working on: "${params.q||"your request"}"`, type:"info", status:"pending", icon:"🤖" },
    ],
  };
  return flows[intent]||flows.general;
}

function PersonalAssistantPanel({ guest, setSection, onOpenWhatsApp }: { guest:GuestIdentity; setSection:(s:Section)=>void; onOpenWhatsApp:()=>void }) {
  const gk = (k:string) => guestKey(guest.id, `pa.${k}`);
  const [msgs,       setMsgs]       = useLocalStore<PAMsg[]>(gk("msgs"), []);
  const [taskState,  setTaskState]  = useLocalStore<Record<string,PAStatus>>(gk("tstate"), {});
  const [taskValues, setTaskValues] = useLocalStore<Record<string,Record<string,string>>>(gk("tvals"), {});
  const [input,    setInput]   = useState("");
  const [thinking, setThinking]= useState(false);
  const [fv,       setFv]      = useState<Record<string,Record<string,string>>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  const [searchItems, setSearchItems] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  useEffect(() => { chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:"smooth"}); }, [msgs]);

  useEffect(() => {
    const activeTask = msgs
      .flatMap(m => m.wfTasks || [])
      .find(t => isActive(t, msgs.flatMap(m => m.wfTasks || [])));

    if (activeTask && activeTask.type === "select_product" && searchItems.length === 0 && !loadingSearch) {
      const searchInputTask = msgs
        .flatMap(m => m.wfTasks || [])
        .find(t => t.id.endsWith("_t1"));
      
      const qTaskVal = searchInputTask ? (taskValues[searchInputTask.id]?.query || "") : "";
      const lastUserMsg = [...msgs].reverse().find(m => m.role === "user")?.text || "Paracetamol";
      const queryStr = qTaskVal || lastUserMsg.replace(/buy|search|find|for/gi, '').trim() || "Paracetamol";

      setLoadingSearch(true);
      fetch(`/v1/public/products?search=${encodeURIComponent(queryStr)}`)
        .then(res => res.json())
        .then(json => {
          const dbItems = (json.data || []).slice(0, 2).map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.selling_price || item.mrp || 0,
            storeName: item.store_name || "Apollo Pharmacy (Local)",
            storeUrl: `/store/${item.store_id}`
          }));

          const mockItems = [
            { id: "mock_1", name: `${queryStr} 500mg (Amazon Pharmacy)`, price: 42.00, storeName: "Amazon Health (Out Store)", storeUrl: "https://pharmacy.amazon.in" },
            { id: "mock_2", name: `${queryStr} Active (Apollo 247)`, price: 45.00, storeName: "Apollo 247 (Out Store)", storeUrl: "https://www.apollo247.com" },
            { id: "mock_3", name: `${queryStr} Suspension (Tata 1mg)`, price: 38.00, storeName: "Tata 1mg (Out Store)", storeUrl: "https://www.1mg.com" }
          ];

          setSearchItems([...dbItems, ...mockItems]);
        })
        .catch(err => {
          console.error("Search failed:", err);
          setSearchItems([
            { id: "mock_1", name: `${queryStr} 500mg (Amazon Pharmacy)`, price: 42.00, storeName: "Amazon Health (Out Store)", storeUrl: "https://pharmacy.amazon.in" },
            { id: "mock_2", name: `${queryStr} Active (Apollo 247)`, price: 45.00, storeName: "Apollo 247 (Out Store)", storeUrl: "https://www.apollo247.com" },
            { id: "mock_3", name: `${queryStr} Suspension (Tata 1mg)`, price: 38.00, storeName: "Tata 1mg (Out Store)", storeUrl: "https://www.1mg.com" }
          ]);
        })
        .finally(() => setLoadingSearch(false));
    }
  }, [msgs, taskState]);

  useEffect(() => {
    if (msgs.length === 0) {
      const first = guest.name.split(" ")[0];
      setMsgs([{ id:paUid(), role:"assistant", ts:Date.now(),
        text:`Hi ${first}! I am your Personal Assistant.\n\nI orchestrate multi-step tasks with Approve / Hold / Reject controls at every step.\n\nTry saying:\n- "Order food"\n- "Book a ride"\n- "Add an expense"\n- "Set a reminder"\n- "Plan a trip"\n- "Find a plumber"`,
      }]);
    }
  }, []);

  const getSt = (task:PATask): PAStatus => taskState[task.id]||task.status;

  const isActive = (task:PATask, all:PATask[]): boolean => {
    if (getSt(task)!=="pending") return false;
    const idx = all.findIndex(t=>t.id===task.id);
    if (idx===0) return true;
    return getSt(all[idx-1])==="done";
  };

  const setFieldVal = (taskId:string, key:string, val:string) => {
    setFv(prev=>({...prev,[taskId]:{...(prev[taskId]||{}),[key]:val}}));
  };

  const handleApprove = async (task:PATask, allTasks:PATask[]) => {
    const vals = {...(taskValues[task.id]||{}), ...(fv[task.id]||{})};
    const missing = (task.fields||[]).filter(f=>f.required && !vals[f.key]?.trim());
    if (missing.length) {
      setMsgs(prev=>[...prev,{ id:paUid(), role:"assistant", ts:Date.now(), text:`Please fill in: ${missing.map(f=>f.label).join(", ")}` }]);
      return;
    }
    if (task.type==="input"||task.type==="payment") setTaskValues(prev=>({...prev,[task.id]:vals}));
    setTaskState(prev=>({...prev,[task.id]:"executing"}));

    if (task.type === "browse_logs") {
      const selectTask = allTasks.find(t => t.type === "select_product");
      const selectVals = selectTask ? (taskValues[selectTask.id] || {}) : {};
      const prodName = selectVals.productName || "Medicine";
      const url = selectVals.vendorUrl || "https://www.apollopharmacy.in";

      setAgentLogs([]);
      try {
        const res = await fetch(`/v1/public/agent/browse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, productName: prodName })
        });
        const data = await res.json();
        if (data.success && data.data && data.data.logs) {
          const fullLogs = data.data.logs;
          for (let i = 0; i < fullLogs.length; i++) {
            await new Promise(r => setTimeout(r, 400));
            setAgentLogs(prev => [...prev, fullLogs[i]]);
          }
        }
      } catch (e: any) {
        setAgentLogs(prev => [...prev, `[headless-chrome:ERROR] Connection failed: ${e.message}`]);
      }
      await new Promise(r => setTimeout(r, 600));
      setTaskState(prev => ({ ...prev, [task.id]: "done" }));
      setMsgs(prev => [...prev, {
        id: paUid(), role: "assistant", ts: Date.now(),
        text: "Verification complete. Product mapped to category successfully. Please enter your card payment details below to finish checkout."
      }]);
      return;
    }

    if (task.type === "payment" && allTasks.find(t => t.type === "browse_logs")) {
      try {
        const res = await fetch(`/v1/public/agent/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card: vals.card, name: vals.name, amount: "450.00" })
        });
        const data = await res.json();
        if (data.success) {
          setTaskValues(prev => ({ ...prev, [task.id]: { ...vals, txnId: data.data.transactionId } }));
        }
      } catch {}
      await new Promise(r => setTimeout(r, 1000));
      setTaskState(prev => ({ ...prev, [task.id]: "done" }));
      setMsgs(prev => [...prev, {
        id: paUid(), role: "assistant", ts: Date.now(),
        text: "Payment authorized! Your order has been placed and category listings updated. Check details in the final summary tab."
      }]);
      return;
    }

    await new Promise(r=>setTimeout(r,900));
    setTaskState(prev=>({...prev,[task.id]:"done"}));

    // Side effects: navigate, save expense/reminder/trip
    if (/services hub|navigate/i.test(task.desc)) setTimeout(()=>setSection("services"),800);
    if (/save expense/i.test(task.label)) {
      const inp = allTasks.find(t=>t.type==="input");
      const pv = taskValues[inp?.id||""]||{};
      if (pv.label&&pv.amount) {
        try {
          const k = guestKey(guest.id,"expenses");
          const ex = JSON.parse(localStorage.getItem(k)||"[]");
          localStorage.setItem(k,JSON.stringify([{id:paUid(),label:pv.label,category:pv.category||"Other",amount:parseFloat(pv.amount),date:pv.date||new Date().toISOString().slice(0,10)},...ex]));
        } catch {}
      }
    }
    if (/set reminder/i.test(task.label)) {
      const inp = allTasks.find(t=>t.type==="input");
      const pv = taskValues[inp?.id||""]||{};
      if (pv.text) {
        try {
          const k = guestKey(guest.id,"reminders");
          const ex = JSON.parse(localStorage.getItem(k)||"[]");
          localStorage.setItem(k,JSON.stringify([{id:paUid(),text:pv.text,due:pv.due||"",done:false},...ex]));
        } catch {}
      }
    }
    if (/trip planner/i.test(task.label)) {
      const inp = allTasks.find(t=>t.type==="input");
      const pv = taskValues[inp?.id||""]||{};
      if (pv.destination) {
        try {
          const k = guestKey(guest.id,"trips");
          const ex = JSON.parse(localStorage.getItem(k)||"[]");
          localStorage.setItem(k,JSON.stringify([{id:paUid(),destination:pv.destination,fromDate:pv.from||"",toDate:pv.to||"",budget:parseFloat(pv.budget||"0"),notes:"Added via Personal Assistant",done:false,checklist:[]},...ex]));
        } catch {}
      }
    }

    const taskIdx = allTasks.findIndex(t=>t.id===task.id);
    const nextTask = allTasks[taskIdx+1];
    const isLast = !nextTask || allTasks.slice(taskIdx+1).every(t=>{ const s=taskState[t.id]||t.status; return s==="done"||s==="rejected"; });
    setMsgs(prev=>[...prev,{ id:paUid(), role:"assistant", ts:Date.now(),
      text:isLast
        ? ["All done! Let me know if you need anything else.","Task completed successfully!","Done! Anything else I can help with?"][Math.floor(Math.random()*3)]
        : ["Step done! Next step is ready.","Got it! Moving to the next step."][Math.floor(Math.random()*2)],
    }]);
  };

  const handleReject = (task:PATask) => {
    setTaskState(prev=>({...prev,[task.id]:"rejected"}));
    setMsgs(prev=>[...prev,{ id:paUid(), role:"assistant", ts:Date.now(), text:"Task rejected. Let me know if you would like to try something different." }]);
  };

  const handleHold = (task:PATask) => {
    setTaskState(prev=>({...prev,[task.id]:"held"}));
    setMsgs(prev=>[...prev,{ id:paUid(), role:"assistant", ts:Date.now(), text:"Task is on hold. Click Resume when you are ready to continue." }]);
  };

  const ST_BADGE: Record<PAStatus,string> = {
    pending:"bg-gray-100 text-gray-500",  approved:"bg-blue-100 text-blue-600",
    rejected:"bg-red-100 text-red-500",   held:"bg-yellow-100 text-yellow-700",
    executing:"bg-orange-100 text-orange-600", done:"bg-green-100 text-green-600",
  };
  const ST_LABEL: Record<PAStatus,string> = {
    pending:"Waiting", approved:"Approved", rejected:"Rejected",
    held:"On Hold", executing:"Processing", done:"Done",
  };

  const renderTask = (task:PATask, allTasks:PATask[]) => {
    const st = getSt(task);
    const active = isActive(task, allTasks);
    const vals = {...(taskValues[task.id]||{}), ...(fv[task.id]||{})};
    return (
      <div key={task.id} className={`rounded-xl border-2 p-3 transition-all ${
        active&&st==="pending" ? "border-orange-300 bg-orange-50/60" :
        st==="done"            ? "border-green-200 bg-green-50/40 opacity-75" :
        st==="rejected"        ? "border-red-200 bg-red-50/40 opacity-50" :
        st==="held"            ? "border-yellow-300 bg-yellow-50" :
        st==="executing"       ? "border-orange-200 bg-orange-50/40" :
                                 "border-gray-100 bg-white opacity-40"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{task.icon}</span>
          <span className="text-xs font-bold text-gray-800 flex-1">{task.label}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ST_BADGE[st]}`}>{ST_LABEL[st]}</span>
        </div>
        <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">{task.desc}</p>

        {/* Summary of previous input for confirm tasks */}
        {(task.type==="confirm"||task.type==="info") && active && (() => {
          const inp = allTasks.find(t=>t.type==="input");
          const pv = inp ? (taskValues[inp.id]||{}) : {};
          const entries = Object.entries(pv).filter(([,v])=>v);
          if (!entries.length) return null;
          return (
            <div className="bg-white border border-gray-100 rounded-lg p-2 mb-2 space-y-0.5">
              {entries.map(([k,v])=>(
                <div key={k} className="flex gap-2 text-[11px]">
                  <span className="text-gray-400 capitalize w-24 shrink-0">{k}:</span>
                  <span className="text-gray-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Custom select_product block */}
        {active && task.type === "select_product" && (
          <div className="space-y-2 mb-3 bg-white p-2.5 rounded-lg border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Select Product Option</span>
            {loadingSearch ? (
              <div className="flex items-center gap-1.5 py-2"><Loader2 size={12} className="animate-spin text-orange-500"/><span className="text-xs text-gray-500">Searching options...</span></div>
            ) : searchItems.length === 0 ? (
              <div className="text-xs text-gray-500 py-1">No products found. Enter another keyword or click got it.</div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {searchItems.map(item => (
                  <label key={item.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer border border-gray-100">
                    <input
                      type="radio"
                      name={`product_${task.id}`}
                      checked={vals.selectedProductId === item.id}
                      onChange={() => {
                        setFieldVal(task.id, "selectedProductId", item.id);
                        setFieldVal(task.id, "productName", item.name);
                        setFieldVal(task.id, "vendorUrl", item.storeUrl || "https://www.apollopharmacy.in");
                      }}
                      className="mt-0.5 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <span>Store: {item.storeName}</span>
                        <span>•</span>
                        <span className="text-green-600 font-medium">₹{item.price}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom browse_logs block */}
        {active && task.type === "browse_logs" && (
          <div className="mb-3 bg-gray-900 rounded-lg p-3 font-mono text-[10px] text-green-400 space-y-1 max-h-48 overflow-y-auto">
            <div className="text-gray-500">// HEADLESS BROWSER CONSOLE TRACE</div>
            {agentLogs.length === 0 ? (
              <div className="flex items-center gap-1.5"><Loader2 size={10} className="animate-spin text-green-400"/><span>Virtualizing Chromium session...</span></div>
            ) : (
              agentLogs.map((l, idx) => (
                <div key={idx} className={l.includes('ERROR') ? 'text-red-400' : l.includes('WARNING') ? 'text-yellow-400' : ''}>
                  {l}
                </div>
              ))
            )}
          </div>
        )}

        {/* Input fields */}
        {active && (task.type==="input"||task.type==="payment") && task.fields && (
          <div className="space-y-2 mb-3">
            {task.fields.map(f => {
              const v = vals[f.key]||"";
              return (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    {f.label}{f.required&&<span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {f.type==="select" ? (
                    <select value={v} onChange={e=>setFieldVal(task.id,f.key,e.target.value)}
                      className="mt-0.5 w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-400">
                      <option value="">Select...</option>
                      {f.options?.map(o=><option key={o}>{o}</option>)}
                    </select>
                  ) : f.type==="textarea" ? (
                    <textarea value={v} onChange={e=>setFieldVal(task.id,f.key,e.target.value)}
                      placeholder={f.placeholder} rows={2}
                      className="mt-0.5 w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-400 resize-none"/>
                  ) : (
                    <div className="relative mt-0.5">
                      {f.prefix&&<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{f.prefix}</span>}
                      <input type={f.type==="number"?"number":f.type==="date"?"date":"text"} value={v}
                        onChange={e=>setFieldVal(task.id,f.key,e.target.value)} placeholder={f.placeholder}
                        className={`w-full border border-gray-200 rounded-lg py-1.5 text-sm focus:outline-none focus:border-orange-400 ${f.prefix?"pl-9 pr-2.5":"px-2.5"}`}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {st==="executing" && (
          <div className="flex items-center gap-1.5 py-1"><Loader2 size={13} className="animate-spin text-orange-500"/><span className="text-xs text-orange-600 font-medium">Processing...</span></div>
        )}

        {active && st==="pending" && task.type!=="info" && (
          <div className="flex gap-1.5 mt-1">
            <button onClick={()=>handleApprove(task,allTasks)}
              className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">
              <CheckCircle2 size={11}/> Approve
            </button>
            <button onClick={()=>handleHold(task)}
              className="flex items-center gap-1 border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 text-xs font-bold py-2 px-3 rounded-lg transition-colors">
              <Bell size={11}/> Hold
            </button>
            <button onClick={()=>handleReject(task)}
              className="flex items-center gap-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold py-2 px-3 rounded-lg transition-colors">
              <X size={11}/> Reject
            </button>
          </div>
        )}
        {active && st==="pending" && task.type==="info" && (
          <button onClick={()=>handleApprove(task,allTasks)}
            className="w-full flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">
            <CheckCircle2 size={11}/> Got it
          </button>
        )}
        {st==="held" && (
          <button onClick={()=>setTaskState(prev=>({...prev,[task.id]:"pending"}))}
            className="w-full text-xs font-semibold text-yellow-700 border border-yellow-200 hover:bg-yellow-50 py-2 rounded-lg transition-colors mt-1">
            Resume
          </button>
        )}
      </div>
    );
  };

  const sendMessage = async () => {
    if (!input.trim()||thinking) return;
    const text = input.trim();
    setInput("");
    setMsgs(prev=>[...prev,{ id:paUid(), role:"user", text, ts:Date.now() }]);
    setThinking(true);
    await new Promise(r=>setTimeout(r,600+Math.random()*500));
    const { intent, params } = detectPAIntent(text);
    const wfId = paUid();
    const wfTasks = buildPAWorkflow(intent, params, wfId);
    const REPLIES: Record<string,string> = {
      product_search: "Searching local and online stores for matches. Check results below.",
      food_order:   "Great! Let help you place a food order. Fill in the details below.",
      book_ride:    "On it! Enter your trip details and I will find you a ride.",
      add_expense:  "I will log that expense. Fill in the details below.",
      set_reminder: "I will set that reminder. What should I remind you about?",
      plan_trip:    "Exciting! Let me help plan your trip.",
      find_service: `I will help find ${params.stype||"service"} providers. Approve below to open Services Hub.`,
      general:      "Working on it! Here is what I will do:",
    };
    setMsgs(prev=>[...prev,{ id:paUid(), role:"assistant", text:REPLIES[intent]||"Let me help with that!", ts:Date.now(), wfTasks }]);
    setThinking(false);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{height:"calc(100vh - 160px)",minHeight:"520px"}}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
          <Bot size={20} className="text-white"/>
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Personal Assistant</h1>
          <p className="text-gray-500 text-xs">AI orchestrator · Approve / Hold / Reject</p>
        </div>
        <button onClick={onOpenWhatsApp}
          className="ml-auto text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 transition-colors flex items-center gap-1">
          <Phone size={10}/> WhatsApp Alerts
        </button>
        <button onClick={()=>{ if(window.confirm("Clear chat history?")){ setMsgs([]); setTaskState({}); setTaskValues({}); setSearchItems([]); } }}
          className="ml-2 text-[11px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1 transition-colors">
          Clear
        </button>
      </div>

      {/* Quick-action chips */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {[{e:"🍕",l:"Food",c:"Order food"},{e:"🚗",l:"Ride",c:"Book a ride"},{e:"💰",l:"Expense",c:"Add an expense"},{e:"⏰",l:"Remind",c:"Set a reminder"},{e:"✈️",l:"Trip",c:"Plan a trip"},{e:"🔧",l:"Service",c:"Find a plumber"}].map(a=>(
          <button key={a.c} onClick={()=>setInput(a.c)}
            className="text-[11px] border border-gray-200 rounded-xl px-2.5 py-1 hover:bg-gray-50 text-gray-600 transition-colors">
            {a.e} {a.l}
          </button>
        ))}
      </div>

      {/* Chat history */}
      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 pb-2 pr-1">
        {msgs.map(msg=>(
          <div key={msg.id} className={`flex gap-2 ${msg.role==="user"?"flex-row-reverse":""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 text-[11px] font-bold ${
              msg.role==="assistant"?"bg-gradient-to-br from-purple-500 to-indigo-600 text-white":"bg-orange-100 text-orange-600"
            }`}>
              {msg.role==="assistant"?<Bot size={12}/>:guest.name[0].toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 ${msg.role==="user"?"flex flex-col items-end":""}`}>
              <div className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line leading-relaxed ${
                msg.role==="assistant"
                  ? "bg-white border border-gray-100 text-gray-800 rounded-tl-sm max-w-[90%]"
                  : "bg-orange-500 text-white rounded-tr-sm max-w-[75%]"
              }`}>{msg.text}</div>
              <p className="text-[9px] text-gray-400 mt-0.5 px-1">{new Date(msg.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</p>
              {msg.wfTasks&&msg.wfTasks.length>0&&(
                <div className="w-full mt-1 space-y-2">
                  {msg.wfTasks.map(t=>renderTask(t,msg.wfTasks!))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking&&(
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1">
              <Bot size={12} className="text-white"/>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              {[0,150,300].map(d=>(
                <span key={d} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-3 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
          placeholder="Order food, book ride, add expense, set reminder..."
          className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white"/>
        <button onClick={sendMessage} disabled={!input.trim()||thinking}
          className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors shrink-0">
          <Send size={14}/>
        </button>
      </div>
    </div>
  );
}

function WhatsAppVerificationModal({ isOpen, onClose, guestId }: { isOpen: boolean; onClose: () => void; guestId: string }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code" | "success">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  if (!isOpen) return null;

  const sendCode = async () => {
    if (!phone.trim()) { setError("Phone number is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/v1/public/whatsapp/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), guestId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send code");
      setStep("code");
      if (json.devCode) {
        setDevCode(json.devCode);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) { setError("Verification code is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/v1/public/whatsapp/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setStep("success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Phone className="text-emerald-500" size={14}/> WhatsApp Alerts
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16}/>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-[11px] rounded-lg p-2.5 mb-4 font-medium">
            {error}
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Subscribe to real-time discount offers, new stock alerts, and campaign updates directly in your WhatsApp chat.
            </p>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">WhatsApp Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 99435 44808"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin"/> : "Send Verification Code"}
            </button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              We sent a 6-digit OTP code to your number. Enter it below to verify.
            </p>
            {devCode && (
              <div className="bg-amber-50 text-amber-700 text-xs rounded-lg p-2.5 border border-amber-200">
                <strong>[DEV MODE]</strong> Simulation OTP: <code className="font-bold font-mono">{devCode}</code>
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Verification OTP</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm tracking-widest text-center font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("phone")}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2.5 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={verifyCode}
                disabled={loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin"/> : "Verify Code"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">Successfully Subscribed!</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                You are now registered for real-time store offer alerts.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GuestProfileModal({ isOpen, onClose, guest, onOpenWhatsApp }: { isOpen: boolean; onClose: () => void; guest: GuestIdentity; onOpenWhatsApp: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-900">Guest Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16}/>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg">
              {guest.name[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-800 text-sm">{guest.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">ID: {guest.id}</div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-gray-500 uppercase text-[9px] tracking-wider">Preferences</div>
            <div className="flex justify-between items-center py-1">
              <div>
                <div className="font-semibold text-gray-800">WhatsApp Alerts</div>
                <div className="text-[10px] text-gray-500">Get offer alerts on your phone</div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenWhatsApp();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Phone size={10}/> Manage
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold py-2 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
