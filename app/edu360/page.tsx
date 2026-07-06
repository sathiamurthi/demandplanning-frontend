"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, GraduationCap, Users, Building2, X, Send, Mail,
  BookOpen, Star, CheckCircle, Plus, Loader2, Upload, FileText,
  Printer, LogOut, Eye, AlertCircle, Lock, UserCheck, ChevronDown,
  IndianRupee, Award, Microscope, Calculator, Globe, Clock, Phone,
  Bookmark, MessageCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Edu360User {
  id: string; name: string; email: string; phone: string;
  type: "student" | "parent" | "institution";
  org?: string; city?: string; createdAt: string;
}
interface TranscriptData {
  name: string; dob: string | null; board: string; class_or_year: string;
  stream: string; subjects: Array<{ name: string; marks: number; max_marks: number; grade: string }>;
  percentage: number | null; cgpa: number | null; year_of_passing: number | null;
  school_name: string; contact: { email: string; phone: string; city: string };
  seeking: string[]; preferred_cities: string[]; strengths: string[];
  extracurriculars: string[]; achievements: string[]; profile_headline: string;
}
interface Institution {
  id: string; name: string; type: string; city: string; state: string;
  affiliation: string; programs: string[]; fee_min: number; fee_max: number;
  seats: number; mode: "offline" | "online" | "hybrid";
  description: string; tags: string[]; phone: string; email: string;
  posted: string; established: number; accreditation: string;
  is_verified?: boolean; enhanced?: boolean;
}
interface Student {
  id: string; name: string; headline: string; city: string; state: string;
  board: string; stream: string; percentage: number | null; cgpa: number | null;
  year_of_passing: number | null; class_or_year: string;
  seeking: string[]; preferred_cities: string[]; strengths: string[];
  email: string; phone: string; posted: string; available: boolean;
}
type Mode = "institutions" | "students";

// ── Auth utilities (localStorage only) ────────────────────────────────────────
const SESSION_KEY  = "edu360_session";
const USERS_KEY    = "edu360_users";
const PROFILE_KEY  = (id: string) => `edu360_profile_${id}`;

const loadSession = (): Edu360User | null => {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};
const saveSession = (u: Edu360User) => localStorage.setItem(SESSION_KEY, JSON.stringify(u));
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const allUsers = (): Array<Edu360User & { pw: string }> => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
};

const doRegister = (d: { name: string; email: string; phone: string; pw: string; type: "student"|"parent"|"institution"; org?: string; city?: string }): Edu360User | string => {
  const users = allUsers();
  if (users.find(u => u.email === d.email)) return "Email already registered — please sign in.";
  const u: Edu360User = { id: `e${Date.now()}`, name: d.name, email: d.email, phone: d.phone, type: d.type, org: d.org, city: d.city, createdAt: new Date().toISOString() };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, { ...u, pw: d.pw }]));
  saveSession(u); return u;
};

const doLogin = (email: string, pw: string): Edu360User | string => {
  const found = allUsers().find(u => u.email === email && u.pw === pw);
  if (!found) return "Invalid email or password.";
  const { pw: _, ...u } = found; saveSession(u); return u;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n: number) => n >= 100000 ? `${(n/100000).toFixed(1)}L` : `${(n/1000).toFixed(0)}k`;
const fee  = (a: number, b: number) => `₹${fmt(a)}–${fmt(b)}/yr`;
const AB   = ["bg-indigo-600","bg-blue-600","bg-violet-600","bg-teal-600","bg-cyan-600","bg-emerald-600","bg-sky-600","bg-purple-600"];
const clr  = (s: string) => AB[s.charCodeAt(0) % AB.length];

const TYPE_BADGE: Record<string, string> = {
  school:      "bg-blue-100 text-blue-700",
  college:     "bg-indigo-100 text-indigo-700",
  university:  "bg-purple-100 text-purple-700",
  coaching:    "bg-amber-100 text-amber-700",
  online:      "bg-teal-100 text-teal-700",
  vocational:  "bg-green-100 text-green-700",
};
const MODE_BADGE: Record<string, string> = {
  offline: "bg-gray-100 text-gray-600",
  online:  "bg-sky-100 text-sky-600",
  hybrid:  "bg-violet-100 text-violet-600",
};
const CITIES = ["All Cities","Bengaluru","Mumbai","Delhi","Hyderabad","Chennai","Pune","Mysuru","Kolkata","Ahmedabad"];

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_INSTITUTIONS: Institution[] = [
  { id:"i1", name:"RV College of Engineering", type:"college", city:"Bengaluru", state:"Karnataka", affiliation:"VTU", programs:["B.E / B.Tech","M.Tech","MBA"], fee_min:80000, fee_max:120000, seats:720, mode:"offline", description:"One of Karnataka's premier engineering colleges with NBA-accredited programs and strong industry placements.", tags:["Engineering","NBA","VTU","Placements"], phone:"9880001234", email:"admissions@rvce.edu.in", posted:"2026-07-05", established:1963, accreditation:"NAAC A+", is_verified:true, enhanced:true },
  { id:"i2", name:"Delhi Public School — Bengaluru South", type:"school", city:"Bengaluru", state:"Karnataka", affiliation:"CBSE", programs:["Nursery – Class 12","Science stream","Commerce stream","Humanities"], fee_min:60000, fee_max:90000, seats:200, mode:"offline", description:"CBSE school with state-of-the-art labs, sports facilities, and a strong track record of board results.", tags:["CBSE","K-12","Board Results","Sports"], phone:"9880112233", email:"admissions@dpsbengaluru.in", posted:"2026-07-05", established:2001, accreditation:"CBSE", is_verified:true, enhanced:true },
  { id:"i3", name:"FIITJEE Hyderabad", type:"coaching", city:"Hyderabad", state:"Telangana", affiliation:"Independent", programs:["JEE Main","JEE Advanced","NEET","Foundation (8-10)"], fee_min:100000, fee_max:180000, seats:500, mode:"hybrid", description:"India's leading coaching institute for JEE and NEET with proven results and experienced faculty.", tags:["JEE","NEET","IIT","Coaching"], phone:"9700445566", email:"hyd@fiitjee.com", posted:"2026-07-04", established:1992, accreditation:"ISO 9001", is_verified:true, enhanced:true },
  { id:"i4", name:"Christ University", type:"university", city:"Bengaluru", state:"Karnataka", affiliation:"Deemed University", programs:["B.Com","BA","BCA","B.Sc","MBA","M.Sc","LLB"], fee_min:70000, fee_max:150000, seats:3000, mode:"offline", description:"Top-ranked deemed university with excellent infrastructure, diverse programs and active campus life.", tags:["Deemed","UGC","Ranked","Commerce","Law"], phone:"9880445566", email:"admission@christuniversity.in", posted:"2026-07-03", established:1969, accreditation:"NAAC A+", is_verified:true },
  { id:"i5", name:"Unacademy — Class 10 & 12 CBSE", type:"online", city:"Bengaluru", state:"Karnataka", affiliation:"Online Platform", programs:["CBSE Class 10","CBSE Class 12","NEET Foundation","JEE Foundation"], fee_min:15000, fee_max:40000, seats:10000, mode:"online", description:"India's largest ed-tech platform with live classes, tests, and personalised learning for boards and entrance exams.", tags:["Online","CBSE","EdTech","Live Classes"], phone:"9900001122", email:"help@unacademy.com", posted:"2026-07-02", established:2015, accreditation:"MCA Registered", enhanced:true },
  { id:"i6", name:"Symbiosis International University — Pune", type:"university", city:"Pune", state:"Maharashtra", affiliation:"Deemed University", programs:["BBA","B.Com","MBA","MA","B.Des","Law"], fee_min:120000, fee_max:250000, seats:2000, mode:"offline", description:"Premier institute for management, law and design. Strong international collaborations and placement record.", tags:["MBA","Law","Design","International","Ranked"], phone:"9823001122", email:"siu@symbiosis.ac.in", posted:"2026-07-01", established:2002, accreditation:"NAAC A", is_verified:true },
  { id:"i7", name:"NIIT Skills — Digital Marketing", type:"vocational", city:"Mumbai", state:"Maharashtra", affiliation:"NIIT", programs:["Digital Marketing","Data Analytics","Full Stack","Cloud Computing"], fee_min:40000, fee_max:80000, seats:200, mode:"hybrid", description:"Industry-aligned short-term certification programs with placement support. Backed by NIIT's 40+ year legacy.", tags:["Vocational","Certification","Placement","IT Skills"], phone:"9821334455", email:"admissions@niit.com", posted:"2026-06-30", established:1981, accreditation:"NSDC", enhanced:true },
  { id:"i8", name:"Kendriya Vidyalaya No. 1 — Delhi", type:"school", city:"Delhi", state:"Delhi", affiliation:"CBSE (KVS)", programs:["Class 1 – 12","Science","Commerce","Humanities"], fee_min:5000, fee_max:12000, seats:300, mode:"offline", description:"Central government school with affordable fees, quality education, and pan-India recognition.", tags:["KVS","CBSE","Government","Affordable"], phone:"9811224455", email:"kv1delhi@kvs.ac.in", posted:"2026-06-29", established:1965, accreditation:"CBSE" },
];

const MOCK_STUDENTS: Student[] = [
  { id:"st1", name:"Ananya Krishnan", headline:"CBSE Class 12 Science · 94.8% · JEE Aspirant · Bengaluru", city:"Bengaluru", state:"Karnataka", board:"CBSE", stream:"Science (PCM)", percentage:94.8, cgpa:null, year_of_passing:2026, class_or_year:"Class 12", seeking:["B.Tech Engineering","IIT/NIT","Computer Science"], preferred_cities:["Bengaluru","Hyderabad","Chennai"], strengths:["Mathematics","Physics","Computer Science"], email:"ananya.k@gmail.com", phone:"9845001122", posted:"2026-07-05", available:true },
  { id:"st2", name:"Rahul Mehta", headline:"CBSE Class 10 · 91.2% · Exploring Commerce & Management", city:"Mumbai", state:"Maharashtra", board:"CBSE", stream:"General (Class 10)", percentage:91.2, cgpa:null, year_of_passing:2026, class_or_year:"Class 10", seeking:["B.Com","BBA","Commerce stream Class 11-12"], preferred_cities:["Mumbai","Pune"], strengths:["Mathematics","Social Science","English"], email:"rahul.m@outlook.com", phone:"9823445566", posted:"2026-07-04", available:true },
  { id:"st3", name:"Preethi Sundaram", headline:"State Board 12th · Biology · 88% · NEET Aspirant · Chennai", city:"Chennai", state:"Tamil Nadu", board:"Tamil Nadu State Board", stream:"Biology (PCB)", percentage:88, cgpa:null, year_of_passing:2025, class_or_year:"Class 12", seeking:["MBBS Medical","BDS Dental","NEET Coaching"], preferred_cities:["Chennai","Vellore","Coimbatore"], strengths:["Biology","Chemistry","Botany"], email:"preethi.s@gmail.com", phone:"9840112233", posted:"2026-07-03", available:true },
  { id:"st4", name:"Aryan Sharma", headline:"B.Tech 2nd Year · CSE · 8.4 CGPA · MBA Aspirant · Delhi", city:"Delhi", state:"Delhi", board:"University", stream:"Engineering (CSE)", percentage:null, cgpa:8.4, year_of_passing:2028, class_or_year:"2nd Year B.Tech", seeking:["MBA Management","Post Graduate Program","IIM CAT Prep"], preferred_cities:["Delhi","Bengaluru","Ahmedabad"], strengths:["Data Structures","DBMS","Communication"], email:"aryan.s@gmail.com", phone:"9810334455", posted:"2026-07-02", available:false },
];

// ── ProfileCard ────────────────────────────────────────────────────────────────
function ProfileCard({ data }: { data: TranscriptData }) {
  const pct = data.percentage ? `${data.percentage}%` : data.cgpa ? `${data.cgpa} CGPA` : "—";
  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Academic Profile – ${data.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;color:#0f172a;background:#fff;padding:40px;max-width:760px;margin:0 auto;font-size:13px;line-height:1.6}
  h1{font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#1e1b4b}
  .hl{color:#4338ca;font-size:15px;font-weight:600;margin:4px 0 12px}
  .ct{display:flex;gap:20px;font-size:12px;color:#475569;border-bottom:2px solid #4338ca;padding-bottom:14px;margin-bottom:20px;flex-wrap:wrap}
  h2{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px}
  .badge{display:inline-block;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:20px;padding:3px 10px;font-size:11px;margin:2px 3px 2px 0;font-weight:600}
  .sbj{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12.5px}
  .grade{font-weight:700;color:#059669}
  .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;display:inline-block;min-width:120px;margin:4px}
  .stat-val{font-size:22px;font-weight:900;color:#4338ca}.stat-lbl{font-size:11px;color:#64748b}
</style></head><body>
<h1>${data.name}</h1>
<div class="hl">${data.profile_headline || `${data.board} · ${data.class_or_year} · ${pct}`}</div>
<div class="ct">
  ${data.contact?.city ? `<span>📍 ${data.contact.city}</span>` : ""}
  ${data.contact?.email ? `<span>✉ ${data.contact.email}</span>` : ""}
  ${data.contact?.phone ? `<span>📱 ${data.contact.phone}</span>` : ""}
  ${data.school_name ? `<span>🏫 ${data.school_name}</span>` : ""}
</div>
<div>
  <span class="stat"><div class="stat-val">${pct}</div><div class="stat-lbl">Score</div></span>
  <span class="stat"><div class="stat-val">${data.year_of_passing || '—'}</div><div class="stat-lbl">Year</div></span>
  <span class="stat"><div class="stat-val">${data.stream || '—'}</div><div class="stat-lbl">Stream</div></span>
</div>
${data.subjects?.length ? `<h2>Subject-wise Marks</h2>${data.subjects.map(s=>`<div class="sbj"><span>${s.name}</span><span class="grade">${s.marks}/${s.max_marks || 100} ${s.grade ? `(${s.grade})` : ""}</span></div>`).join("")}` : ""}
${data.seeking?.length ? `<h2>Seeking Admission In</h2>${data.seeking.map(s=>`<span class="badge">🎯 ${s}</span>`).join("")}` : ""}
${data.strengths?.length ? `<h2>Strengths</h2>${data.strengths.map(s=>`<span class="badge">${s}</span>`).join("")}` : ""}
${data.achievements?.length ? `<h2>Achievements</h2><ul style="padding-left:16px">${data.achievements.map(a=>`<li style="margin:4px 0;font-size:12.5px">${a}</li>`).join("")}</ul>` : ""}
${data.extracurriculars?.length ? `<h2>Extracurricular</h2>${data.extracurriculars.map(e=>`<span class="badge">🏆 ${e}</span>`).join("")}` : ""}
</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-h-[55vh] overflow-y-auto">
        <div className="border-b-2 border-indigo-600 pb-4 mb-5">
          <h2 className="text-2xl font-black text-gray-900">{data.name}</h2>
          <p className="text-indigo-600 font-semibold mt-1">{data.profile_headline || `${data.board} · ${data.class_or_year}`}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
            {data.contact?.city  && <span>📍 {data.contact.city}</span>}
            {data.contact?.email && <span>✉ {data.contact.email}</span>}
            {data.school_name    && <span>🏫 {data.school_name}</span>}
          </div>
        </div>
        <div className="flex gap-3 mb-5 flex-wrap">
          {pct !== "—" && <div className="text-center bg-indigo-50 rounded-xl p-3 min-w-[80px]"><p className="text-2xl font-black text-indigo-700">{pct}</p><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">Score</p></div>}
          {data.year_of_passing && <div className="text-center bg-gray-50 rounded-xl p-3 min-w-[80px]"><p className="text-2xl font-black text-gray-700">{data.year_of_passing}</p><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">Year</p></div>}
          {data.stream && <div className="text-center bg-blue-50 rounded-xl p-3 min-w-[80px]"><p className="text-lg font-black text-blue-700 leading-tight">{data.stream.split(" ")[0]}</p><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">Stream</p></div>}
        </div>
        {data.subjects?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Subjects</p>
            <div className="space-y-1">
              {data.subjects.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-700">{s.name}</span>
                  <span className="font-bold text-emerald-600">{s.marks}/{s.max_marks || 100} {s.grade && `(${s.grade})`}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.seeking?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Seeking Admission In</p>
            <div className="flex flex-wrap gap-1.5">{data.seeking.map(s=><span key={s} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 font-semibold">🎯 {s}</span>)}</div>
          </div>
        )}
        {data.strengths?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Strengths</p>
            <div className="flex flex-wrap gap-1.5">{data.strengths.map(s=><span key={s} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 font-semibold">{s}</span>)}</div>
          </div>
        )}
        {data.achievements?.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Achievements</p>
            <ul className="space-y-1">{data.achievements.map((a,i)=><li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-amber-500">🏆</span>{a}</li>)}</ul>
          </div>
        )}
      </div>
      <button onClick={print} className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition">
        <Printer size={16}/> Print / Save as PDF
      </button>
    </div>
  );
}

// ── AuthModal ──────────────────────────────────────────────────────────────────
function AuthModal({ onSuccess, initialMode = "register", context, onClose }: {
  onSuccess: (u: Edu360User) => void;
  initialMode?: "login" | "register";
  context?: string;
  onClose: () => void;
}) {
  const [tab,   setTab]   = useState(initialMode);
  const [utype, setUtype] = useState<"student"|"parent"|"institution">("student");
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city,  setCity]  = useState("");
  const [org,   setOrg]   = useState("");
  const [pw,    setPw]    = useState("");
  const [pw2,   setPw2]   = useState("");
  const [err,   setErr]   = useState("");

  const submit = () => {
    setErr("");
    if (tab === "register") {
      if (!name || !email || !phone || !pw) { setErr("All fields are required."); return; }
      if (pw !== pw2) { setErr("Passwords don't match."); return; }
      const r = doRegister({ name, email, phone, pw, type: utype, org: org || undefined, city: city || undefined });
      if (typeof r === "string") { setErr(r); return; }
      onSuccess(r);
    } else {
      if (!email || !pw) { setErr("Email and password required."); return; }
      const r = doLogin(email, pw);
      if (typeof r === "string") { setErr(r); return; }
      onSuccess(r);
    }
  };

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Lock size={16} className="text-indigo-500"/>
                {tab === "register" ? "Create Account" : "Welcome Back"}
              </h2>
              {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {(["register","login"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-sm font-semibold transition ${tab===t ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {t === "register" ? "Register" : "Sign In"}
              </button>
            ))}
          </div>
          {tab === "register" && (
            <>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(["student","parent","institution"] as const).map(t => (
                  <button key={t} onClick={() => setUtype(t)} className={`flex-1 py-2 text-xs font-bold capitalize transition ${utype===t ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>{t}</button>
                ))}
              </div>
              <input className={inp} placeholder="Full name" value={name} onChange={e => setName(e.target.value)}/>
              {utype === "institution" && <input className={inp} placeholder="Institution / Organisation name" value={org} onChange={e => setOrg(e.target.value)}/>}
              <input className={inp} placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)}/>
              <input className={inp} placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)}/>
              <input className={inp} placeholder="City" value={city} onChange={e => setCity(e.target.value)}/>
              <input className={inp} placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)}/>
              <input className={inp} placeholder="Confirm password" type="password" value={pw2} onChange={e => setPw2(e.target.value)}/>
            </>
          )}
          {tab === "login" && (
            <>
              <input className={inp} placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)}/>
              <input className={inp} placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)}/>
            </>
          )}
          {err && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {err}</p>}
          <button onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition">
            {tab === "register" ? "Create Account" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProfileBuilderModal ────────────────────────────────────────────────────────
function ProfileBuilderModal({ user, onClose, onSaved }: {
  user: Edu360User;
  onClose: () => void;
  onSaved: (d: TranscriptData) => void;
}) {
  const [step,    setStep]    = useState<"upload"|"processing"|"preview">("upload");
  const [method,  setMethod]  = useState<"pdf"|"text">("pdf");
  const [text,    setText]    = useState("");
  const [data,    setData]    = useState<TranscriptData | null>(null);
  const [err,     setErr]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const process = async (fileBase64?: string, mimeType?: string) => {
    setStep("processing"); setErr("");
    try {
      const body = fileBase64 ? { fileBase64, mimeType } : { text };
      const r = await fetch("/api/extract-transcript", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Extraction failed");
      setData(d.data); setStep("preview");
    } catch (e: any) {
      setErr(e.message); setStep("upload");
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ab = ev.target?.result as ArrayBuffer;
      const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
      process(b64, file.type);
    };
    reader.readAsArrayBuffer(file);
  };

  const save = () => {
    if (!data) return;
    localStorage.setItem(PROFILE_KEY(user.id), JSON.stringify(data));
    onSaved(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-black text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-indigo-500"/> Build Academic Profile</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="p-6">
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Upload your marksheet / transcript or paste the text. AI will extract your academic profile automatically.</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(["pdf","text"] as const).map(m => (
                  <button key={m} onClick={() => setMethod(m)} className={`flex-1 py-2 text-sm font-semibold capitalize transition ${method===m ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                    {m === "pdf" ? "Upload PDF / Image" : "Paste Text"}
                  </button>
                ))}
              </div>
              {method === "pdf" ? (
                <div>
                  <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFile}/>
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:border-indigo-400 transition flex flex-col items-center gap-3">
                    <Upload size={28} className="text-indigo-400"/>
                    <p className="font-semibold text-gray-700">Click to upload marksheet / transcript</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG supported · AI extracts all data</p>
                  </button>
                </div>
              ) : (
                <div>
                  <textarea rows={8} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" placeholder="Paste your marksheet text here..." value={text} onChange={e => setText(e.target.value)}/>
                  <button onClick={() => process()} disabled={!text.trim()} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
                    <Sparkles size={16}/> Extract with AI
                  </button>
                </div>
              )}
              {err && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {err}</p>}
            </div>
          )}
          {step === "processing" && (
            <div className="py-12 text-center space-y-4">
              <Loader2 size={32} className="animate-spin text-indigo-400 mx-auto"/>
              <p className="font-semibold text-gray-700">Analysing your document…</p>
              <p className="text-xs text-gray-400">AI is extracting marks, subjects, and achievements</p>
            </div>
          )}
          {step === "preview" && data && (
            <div className="space-y-4">
              <ProfileCard data={data}/>
              <button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
                <CheckCircle size={16}/> Save Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PostInstitutionModal ───────────────────────────────────────────────────────
function PostInstitutionModal({ enabledCats, user, onClose, onPosted }: {
  enabledCats: string[];
  user: Edu360User;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [form, setForm] = useState({ name:"", type: enabledCats[0]?.toLowerCase() || "college", city:"", state:"", affiliation:"", programs:"", fee_min:"", fee_max:"", seats:"", mode:"offline", description:"", phone:"", email:"" });
  const [err,  setErr]  = useState("");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400";

  const submit = () => {
    if (!form.name || !form.city || !form.programs || !form.email) { setErr("Name, city, programs and email are required."); return; }
    // In MVP: notify via email/WhatsApp — no backend persist
    window.open(`mailto:edu360@nexusos.in?subject=New Institution Listing — ${encodeURIComponent(form.name)}&body=${encodeURIComponent(`Institution: ${form.name}\nType: ${form.type}\nCity: ${form.city}, ${form.state}\nAffiliation: ${form.affiliation}\nPrograms: ${form.programs}\nFees: ₹${form.fee_min}–${form.fee_max}/yr\nSeats: ${form.seats}\nMode: ${form.mode}\nContact: ${form.phone} / ${form.email}\n\nDescription:\n${form.description}`)}`, "_blank");
    onPosted();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-black text-gray-900 flex items-center gap-2"><Building2 size={18} className="text-indigo-500"/> List Your Institution</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-3">
          <input className={inp} placeholder="Institution name *" value={form.name} onChange={e => set("name", e.target.value)}/>
          <div className="grid grid-cols-2 gap-3">
            <select className={inp} value={form.type} onChange={e => set("type", e.target.value)}>
              {enabledCats.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
            <select className={inp} value={form.mode} onChange={e => set("mode", e.target.value)}>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} placeholder="City *" value={form.city} onChange={e => set("city", e.target.value)}/>
            <input className={inp} placeholder="State" value={form.state} onChange={e => set("state", e.target.value)}/>
          </div>
          <input className={inp} placeholder="Affiliation (CBSE / VTU / Deemed / etc.)" value={form.affiliation} onChange={e => set("affiliation", e.target.value)}/>
          <textarea rows={2} className={`${inp} resize-none`} placeholder="Programs offered (comma-separated) *" value={form.programs} onChange={e => set("programs", e.target.value)}/>
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} placeholder="Min fee / year (₹)" type="number" value={form.fee_min} onChange={e => set("fee_min", e.target.value)}/>
            <input className={inp} placeholder="Max fee / year (₹)" type="number" value={form.fee_max} onChange={e => set("fee_max", e.target.value)}/>
          </div>
          <input className={inp} placeholder="Total seats available" type="number" value={form.seats} onChange={e => set("seats", e.target.value)}/>
          <textarea rows={3} className={`${inp} resize-none`} placeholder="Brief description of the institution" value={form.description} onChange={e => set("description", e.target.value)}/>
          <input className={inp} placeholder="Contact email *" type="email" value={form.email} onChange={e => set("email", e.target.value)}/>
          <input className={inp} placeholder="Contact phone" value={form.phone} onChange={e => set("phone", e.target.value)}/>
          {err && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {err}</p>}
          <button onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
            <Send size={16}/> Submit Listing
          </button>
          <p className="text-[10px] text-gray-400 text-center">Our team will review and publish within 24 hours.</p>
        </div>
      </div>
    </div>
  );
}

// ── EnquiryModal ───────────────────────────────────────────────────────────────
function EnquiryModal({ target, user, onClose }: {
  target: { name: string; email: string; phone: string };
  user: Edu360User;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState(`Hi, I am ${user.name}. I am interested in learning more about your programs. Please share admission details, fee structure, and available seats.`);
  const [sent, setSent] = useState(false);

  const sendEmail = () => {
    window.open(`mailto:${target.email}?subject=Admission Enquiry — ${encodeURIComponent(user.name)}&body=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
  };
  const sendWA = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${target.name},\n\n${msg}\n\n— ${user.name} (${user.phone || user.email})`)}`, "_blank");
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 flex items-center gap-2"><MessageCircle size={18} className="text-indigo-500"/> Enquire about Admission</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm">
            <p className="font-semibold text-indigo-800">{target.name}</p>
            <p className="text-indigo-600 text-xs mt-0.5">{target.email}</p>
          </div>
          <textarea rows={5} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" value={msg} onChange={e => setMsg(e.target.value)}/>
          {sent ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle size={14}/> Enquiry sent! The institution will contact you shortly.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={sendEmail} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition">
                <Mail size={15}/> Email
              </button>
              <button onClick={sendWA} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition">
                <Send size={15}/> WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── InstitutionCard ────────────────────────────────────────────────────────────
function InstitutionCard({ inst, onEnquire }: { inst: Institution; onEnquire: () => void }) {
  const ini = inst.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  return (
    <div className={`bg-white border ${inst.enhanced ? "border-indigo-200 shadow-md shadow-indigo-50" : "border-gray-100"} rounded-2xl p-5 hover:shadow-lg transition-all relative flex flex-col`}>
      {inst.enhanced && <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Featured</div>}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 ${clr(inst.name)} rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0`}>{ini}</div>
        <div className="min-w-0 flex-1 pr-14">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{inst.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_BADGE[inst.type] || "bg-gray-100 text-gray-600"}`}>{inst.type}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${MODE_BADGE[inst.mode]}`}>{inst.mode}</span>
            {inst.is_verified && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><CheckCircle size={10}/> Verified</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
        <MapPin size={11} className="text-gray-400"/>
        <span>{inst.city}, {inst.state}</span>
        {inst.affiliation && <><span className="text-gray-300">·</span><span className="text-indigo-600 font-medium">{inst.affiliation}</span></>}
      </div>
      {inst.accreditation && <p className="text-[10px] text-emerald-600 font-bold mb-2">✓ {inst.accreditation}</p>}
      {inst.programs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {inst.programs.slice(0,3).map(p => <span key={p} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md px-1.5 py-0.5 font-medium">{p}</span>)}
          {inst.programs.length > 3 && <span className="text-[10px] text-gray-400 font-medium">+{inst.programs.length-3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div>
          <p className="text-xs font-bold text-gray-700 flex items-center gap-0.5"><IndianRupee size={11}/>{fee(inst.fee_min, inst.fee_max)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{inst.seats} seats · Est. {inst.established}</p>
        </div>
        <button onClick={onEnquire} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5">
          <MessageCircle size={12}/> Enquire
        </button>
      </div>
    </div>
  );
}

// ── StudentCard ────────────────────────────────────────────────────────────────
function StudentCard({ student, onContact }: { student: Student; onContact: () => void }) {
  const score = student.percentage ? `${student.percentage}%` : student.cgpa ? `${student.cgpa} CGPA` : "—";
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 ${clr(student.name)} rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0`}>
          {student.name.split(" ").slice(0,2).map(w=>w[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{student.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{student.headline}</p>
        </div>
        {student.available
          ? <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full shrink-0">Available</span>
          : <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full shrink-0">Enrolled</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center bg-indigo-50 rounded-lg p-2">
          <p className="text-sm font-black text-indigo-700">{score}</p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">Score</p>
        </div>
        <div className="text-center bg-blue-50 rounded-lg p-2">
          <p className="text-xs font-bold text-blue-700 leading-tight">{student.stream.split(" ")[0]}</p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">Stream</p>
        </div>
        <div className="text-center bg-gray-50 rounded-lg p-2">
          <p className="text-xs font-bold text-gray-700">{student.year_of_passing || "—"}</p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">Year</p>
        </div>
      </div>
      {student.seeking.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {student.seeking.slice(0,2).map(s => <span key={s} className="text-[10px] bg-indigo-50 text-indigo-600 rounded-md px-1.5 py-0.5 font-medium">🎯 {s}</span>)}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={10}/> {student.city}
        </div>
        <button onClick={onContact} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1">
          <Mail size={11}/> Contact
        </button>
      </div>
    </div>
  );
}

// ── Sparkles component (reuse icon) ───────────────────────────────────────────
function Sparkles({ size, className }: { size: number; className?: string }) {
  return <Star size={size} className={className}/>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Edu360Page() {
  const [user,        setUser]        = useState<Edu360User | null>(null);
  const [mode,        setMode]        = useState<Mode>("institutions");
  const [enabledCats, setEnabledCats] = useState<string[]>(["School","College","University","Coaching","Online Course","Vocational"]);
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("all");
  const [filterCity,  setFilterCity]  = useState("All Cities");
  const [filterMode,  setFilterMode]  = useState("all");
  const [profile,     setProfile]     = useState<TranscriptData | null>(null);
  const [showAuth,    setShowAuth]    = useState(false);
  const [authMode,    setAuthMode]    = useState<"register"|"login">("register");
  const [authContext, setAuthContext] = useState<string | undefined>();
  const [pendingEnq,  setPendingEnq]  = useState<Institution | null>(null);
  const [enquireTarget, setEnquireTarget] = useState<Institution | null>(null);
  const [contactTarget, setContactTarget] = useState<Student | null>(null);
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const [showPostInst,       setShowPostInst]        = useState(false);
  const [showProfileView,    setShowProfileView]     = useState(false);

  useEffect(() => {
    const u = loadSession();
    if (u) {
      setUser(u);
      const p = localStorage.getItem(PROFILE_KEY(u.id));
      if (p) { try { setProfile(JSON.parse(p)); } catch {} }
    }
    fetch("/v1/public/platform-config")
      .then(r => r.json())
      .then(d => {
        const cats: string[] = d.data?.edu360?.enabled_categories;
        if (cats?.length) setEnabledCats(cats);
      })
      .catch(() => {});
  }, []);

  const afterAuth = (u: Edu360User) => {
    setUser(u);
    setShowAuth(false);
    const p = localStorage.getItem(PROFILE_KEY(u.id));
    if (p) { try { setProfile(JSON.parse(p)); } catch {} }
    if (pendingEnq) { setEnquireTarget(pendingEnq); setPendingEnq(null); }
  };

  const handleEnquire = useCallback((inst: Institution) => {
    if (!user) {
      setPendingEnq(inst);
      setAuthContext("Register to enquire about this institution");
      setAuthMode("register");
      setShowAuth(true);
    } else {
      setEnquireTarget(inst);
    }
  }, [user]);

  const handleContact = useCallback((student: Student) => {
    if (!user) {
      setAuthContext("Register to contact this student");
      setAuthMode("register");
      setShowAuth(true);
    } else {
      setContactTarget(student);
    }
  }, [user]);

  const handlePostInst = () => {
    if (!user) {
      setAuthContext("Register as an institution to list");
      setAuthMode("register");
      setShowAuth(true);
    } else {
      setShowPostInst(true);
    }
  };

  const handleBuildProfile = () => {
    if (!user) {
      setAuthContext("Register to build your academic profile");
      setAuthMode("register");
      setShowAuth(true);
    } else {
      setShowProfileBuilder(true);
    }
  };

  // Filters
  const filteredInstitutions = MOCK_INSTITUTIONS.filter(i => {
    const catMatch = enabledCats.map(c=>c.toLowerCase()).includes(i.type);
    const typeMatch = filterType === "all" || i.type === filterType;
    const cityMatch = filterCity === "All Cities" || i.city === filterCity;
    const modeMatch = filterMode === "all" || i.mode === filterMode;
    const q = search.toLowerCase();
    const textMatch = !q || i.name.toLowerCase().includes(q) || i.city.toLowerCase().includes(q) || i.programs.some(p=>p.toLowerCase().includes(q)) || i.affiliation.toLowerCase().includes(q);
    return catMatch && typeMatch && cityMatch && modeMatch && textMatch;
  });

  const filteredStudents = MOCK_STUDENTS.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.stream.toLowerCase().includes(q) || s.board.toLowerCase().includes(q) || s.seeking.some(k=>k.toLowerCase().includes(q));
  });

  const logout = () => { clearSession(); setUser(null); setProfile(null); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={16} className="text-white"/>
            </div>
            <div>
              <span className="font-black text-gray-900 text-base leading-none">Edu360</span>
              <span className="text-[10px] text-indigo-500 font-semibold tracking-widest uppercase block leading-none">by Nexus OS</span>
            </div>
          </Link>

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 ml-4">
            {([["institutions","Find Institution"],["students","Find Students"]] as const).map(([m, lbl]) => (
              <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-sm font-semibold transition ${mode===m ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="flex-1"/>

          {/* Actions */}
          {user ? (
            <div className="flex items-center gap-3">
              {(user.type === "student" || user.type === "parent") && (
                <button onClick={() => profile ? setShowProfileView(true) : setShowProfileBuilder(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
                  <UserCheck size={16}/> {profile ? "My Profile" : "Build Profile"}
                </button>
              )}
              {user.type === "institution" && (
                <button onClick={handlePostInst} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
                  <Plus size={14}/> List Institution
                </button>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className={`w-7 h-7 ${clr(user.name)} rounded-full flex items-center justify-center text-white font-black text-[10px]`}>
                  {user.name[0].toUpperCase()}
                </div>
                <span className="hidden sm:block font-medium">{user.name.split(" ")[0]}</span>
              </div>
              <button onClick={logout} className="text-gray-400 hover:text-red-500 transition" title="Logout"><LogOut size={16}/></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition">Sign In</button>
              <button onClick={() => { setAuthMode("register"); setShowAuth(true); }} className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition">Register</button>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO STRIP ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            {mode === "institutions" ? "Find the right institution for your future" : "Connect with students seeking admissions"}
          </h1>
          <p className="text-indigo-200 text-sm mb-5">
            {mode === "institutions" ? "Schools · Colleges · Universities · Coaching · Online — all in one place" : "CBSE, State Board, engineering, medical aspirants looking for the right institution"}
          </p>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
              <Search size={16} className="text-indigo-200 shrink-0"/>
              <input className="bg-transparent text-white placeholder-indigo-300 text-sm w-full focus:outline-none" placeholder={mode === "institutions" ? "Search institution, city, program…" : "Search by stream, board, city…"} value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            {mode === "institutions" ? (
              <button onClick={handlePostInst} className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition">
                <Plus size={14}/> List Institution
              </button>
            ) : (
              <button onClick={handleBuildProfile} className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition">
                <GraduationCap size={14}/> Build My Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* ── SIDEBAR ── */}
        <aside className="w-52 shrink-0 hidden lg:block space-y-5">
          {mode === "institutions" && (
            <>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Type</p>
                {["all", ...enabledCats.map(c=>c.toLowerCase())].map(t => (
                  <button key={t} onClick={() => setFilterType(t)} className={`w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium transition capitalize mb-0.5 ${filterType===t ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
                    {t === "all" ? "All Types" : t}
                  </button>
                ))}
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">City</p>
                {CITIES.map(c => (
                  <button key={c} onClick={() => setFilterCity(c)} className={`w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium transition mb-0.5 ${filterCity===c ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}>{c}</button>
                ))}
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Mode</p>
                {["all","offline","online","hybrid"].map(m => (
                  <button key={m} onClick={() => setFilterMode(m)} className={`w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium capitalize transition mb-0.5 ${filterMode===m ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}>{m === "all" ? "All Modes" : m}</button>
                ))}
              </div>
            </>
          )}

          {/* Category tags */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Categories</p>
            <div className="space-y-1">
              {enabledCats.map(c => (
                <span key={c} className="block text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1.5">{c}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0">
          {/* Result count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 font-medium">
              {mode === "institutions"
                ? `${filteredInstitutions.length} institution${filteredInstitutions.length !== 1 ? "s" : ""} found`
                : `${filteredStudents.length} student profile${filteredStudents.length !== 1 ? "s" : ""}`}
            </p>
            {/* Mobile filters */}
            <div className="flex gap-2 lg:hidden">
              <select className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-600 bg-white" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                {enabledCats.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
              </select>
            </div>
          </div>

          {mode === "institutions" ? (
            filteredInstitutions.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                <GraduationCap size={40} className="text-gray-200 mx-auto mb-3"/>
                <p className="font-semibold text-gray-500">No institutions match your filters</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting the search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredInstitutions.map(inst => (
                  <InstitutionCard key={inst.id} inst={inst} onEnquire={() => handleEnquire(inst)}/>
                ))}
              </div>
            )
          ) : (
            filteredStudents.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                <Users size={40} className="text-gray-200 mx-auto mb-3"/>
                <p className="font-semibold text-gray-500">No student profiles found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStudents.map(s => (
                  <StudentCard key={s.id} student={s} onContact={() => handleContact(s)}/>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {showAuth && (
        <AuthModal
          initialMode={authMode}
          context={authContext}
          onSuccess={afterAuth}
          onClose={() => { setShowAuth(false); setPendingEnq(null); }}
        />
      )}
      {showProfileBuilder && user && (
        <ProfileBuilderModal
          user={user}
          onClose={() => setShowProfileBuilder(false)}
          onSaved={d => { setProfile(d); setShowProfileBuilder(false); }}
        />
      )}
      {showProfileView && profile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowProfileView(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-black text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-indigo-500"/> My Academic Profile</h2>
              <div className="flex gap-2">
                <button onClick={() => { setShowProfileView(false); setShowProfileBuilder(true); }} className="text-xs text-indigo-600 font-bold hover:underline">Edit</button>
                <button onClick={() => setShowProfileView(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
              </div>
            </div>
            <div className="p-6"><ProfileCard data={profile}/></div>
          </div>
        </div>
      )}
      {showPostInst && user && (
        <PostInstitutionModal
          enabledCats={enabledCats}
          user={user}
          onClose={() => setShowPostInst(false)}
          onPosted={() => setShowPostInst(false)}
        />
      )}
      {enquireTarget && user && (
        <EnquiryModal
          target={{ name: enquireTarget.name, email: enquireTarget.email, phone: enquireTarget.phone }}
          user={user}
          onClose={() => setEnquireTarget(null)}
        />
      )}
      {contactTarget && user && (
        <EnquiryModal
          target={{ name: contactTarget.name, email: contactTarget.email, phone: contactTarget.phone }}
          user={user}
          onClose={() => setContactTarget(null)}
        />
      )}
    </div>
  );
}
