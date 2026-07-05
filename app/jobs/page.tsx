"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Briefcase, Users, Building2, X, Send, Mail,
  Bookmark, Sparkles, Clock, IndianRupee, Wifi, Star, CheckCircle,
  Plus, Loader2, Upload, FileText, Printer, LogOut, Eye,
  AlertCircle, Lock, UserCheck, ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NexusUser {
  id: string; name: string; email: string; phone: string;
  type: "talent" | "employer"; org?: string; createdAt: string;
}
interface ResumeData {
  name: string; headline: string;
  contact: { phone: string; email: string; city: string };
  summary: string;
  experience: Array<{ title: string; org: string; period: string; bullets: string[] }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  skills: string[]; certifications: string[];
  experience_years: number; salary_min: number; salary_max: number;
  subjects: string[]; qualifications: string[];
}
interface Job {
  id: string; title: string; org: string; city: string; state: string;
  type: "permanent" | "contract" | "remote" | "parttime";
  category: string; salary_min: number; salary_max: number;
  requirements: string; description: string; tags: string[];
  phone: string; email: string; posted: string; enhanced?: boolean;
  experience_years: number; is_verified?: boolean;
}
interface Seeker {
  id: string; name: string; headline: string; city: string; state: string;
  qualifications: string[]; subjects: string[]; experience_years: number;
  salary_min: number; salary_max: number; job_mode_pref: string;
  summary: string; skills: string[]; phone: string; email: string;
  posted: string; available: boolean;
}
type Mode = "jobs" | "talent";
type JobType = "all" | "permanent" | "contract" | "remote" | "parttime";

// ── Auth utilities (localStorage only — no backend) ────────────────────────────
const SESSION_KEY = "nexus_session";
const USERS_KEY   = "nexus_users";
const RESUME_KEY  = (id: string) => `nexus_resume_${id}`;

const loadSession = (): NexusUser | null => {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};
const saveSession = (u: NexusUser) => localStorage.setItem(SESSION_KEY, JSON.stringify(u));
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const allUsers = (): Array<NexusUser & { pw: string }> => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
};

const doRegister = (d: { name: string; email: string; phone: string; pw: string; type: "talent"|"employer"; org?: string }): NexusUser | string => {
  const users = allUsers();
  if (users.find(u => u.email === d.email)) return "Email already registered — please sign in.";
  const u: NexusUser = { id: `u${Date.now()}`, name: d.name, email: d.email, phone: d.phone, type: d.type, org: d.org, createdAt: new Date().toISOString() };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, { ...u, pw: d.pw }]));
  saveSession(u);
  return u;
};

const doLogin = (email: string, pw: string): NexusUser | string => {
  const found = allUsers().find(u => u.email === email && u.pw === pw);
  if (!found) return "Invalid email or password.";
  const { pw: _, ...u } = found;
  saveSession(u);
  return u;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}k`;
const sal  = (a: number, b: number) => `₹${fmt(a)}–${fmt(b)}/mo`;
const AB   = ["bg-teal-600","bg-emerald-600","bg-blue-600","bg-violet-600","bg-rose-600","bg-amber-600","bg-cyan-600","bg-indigo-600"];
const clr  = (s: string) => AB[s.charCodeAt(0) % AB.length];
const TYPE_BADGE: Record<string, string> = {
  permanent: "bg-teal-100 text-teal-700",
  contract:  "bg-amber-100 text-amber-700",
  remote:    "bg-blue-100 text-blue-700",
  parttime:  "bg-purple-100 text-purple-700",
};
const CATS   = ["All","Education","IT","EdTech","Finance","Healthcare","Marketing","Engineering"];
const CITIES = ["All Cities","Bengaluru","Mumbai","Delhi","Hyderabad","Chennai","Pune","Mysuru"];

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_JOBS: Job[] = [
  { id:"j1", title:"Mathematics Teacher (Grade 8-12)", org:"Greenwood International School", city:"Bengaluru", state:"Karnataka", type:"permanent", category:"Education", salary_min:40000, salary_max:65000, requirements:"B.Ed + M.Sc Mathematics, 3+ years CBSE/ICSE", description:"Experienced Maths teacher for secondary section. Strong conceptual teaching and result-oriented approach required.", tags:["CBSE","Mathematics","ICSE"], phone:"9880001234", email:"hr@greenwood.edu.in", posted:"2026-07-05", enhanced:true, experience_years:3, is_verified:true },
  { id:"j2", title:"React / Node.js Developer", org:"TechNova Solutions Pvt Ltd", city:"Bengaluru", state:"Karnataka", type:"remote", category:"IT", salary_min:80000, salary_max:140000, requirements:"3+ years React + Node.js, REST APIs, PostgreSQL", description:"Join our product team building SaaS applications. Remote-first culture, flexible hours, great team.", tags:["React","Node.js","Remote","SaaS"], phone:"9900112233", email:"careers@technova.io", posted:"2026-07-04", enhanced:true, experience_years:3, is_verified:true },
  { id:"j3", title:"College Lecturer — Commerce & Accounting", org:"Sri Vidya Degree College", city:"Mysuru", state:"Karnataka", type:"permanent", category:"Education", salary_min:30000, salary_max:50000, requirements:"M.Com + NET/SLET preferred, 2+ years teaching", description:"Commerce lecturer for Accountancy and Business Studies. NET/SLET preferred.", tags:["Commerce","Accountancy","NET"], phone:"9845556789", email:"principal@srividya.ac.in", posted:"2026-07-03", experience_years:2 },
  { id:"j4", title:"Python / Data Science Trainer", org:"Upskill Academy", city:"Hyderabad", state:"Telangana", type:"contract", category:"EdTech", salary_min:50000, salary_max:90000, requirements:"Strong Python, ML/AI fundamentals, prior training experience preferred", description:"Deliver Python and Data Science bootcamps. Contract with performance bonus.", tags:["Python","Data Science","Training","Hybrid"], phone:"9700445566", email:"hr@upskill.in", posted:"2026-07-02", enhanced:true, experience_years:2 },
  { id:"j5", title:"Chartered Accountant — Finance Manager", org:"Meridian Retail Pvt Ltd", city:"Chennai", state:"Tamil Nadu", type:"permanent", category:"Finance", salary_min:90000, salary_max:130000, requirements:"CA qualified, 5+ years post-qualification, GST/TDS expertise", description:"Full ownership of accounts, audit, compliance, and MIS reporting.", tags:["CA","Finance","GST","TDS"], phone:"9841122334", email:"hr@meridianretail.com", posted:"2026-07-01", experience_years:5, is_verified:true },
  { id:"j6", title:"Science Teacher (Physics & Chemistry)", org:"DPS Modern School", city:"Pune", state:"Maharashtra", type:"permanent", category:"Education", salary_min:45000, salary_max:70000, requirements:"B.Sc + B.Ed, CBSE curriculum experience", description:"Science teacher for Classes 9-12. Lab handling experience is a plus.", tags:["Physics","Chemistry","CBSE","Labs"], phone:"9823456789", email:"recruitment@dpsmodern.in", posted:"2026-06-30", experience_years:2 },
  { id:"j7", title:"UI/UX Designer — Mobile Apps", org:"AppCraft Studio", city:"Mumbai", state:"Maharashtra", type:"remote", category:"IT", salary_min:60000, salary_max:100000, requirements:"3+ years Figma, mobile UX patterns, design systems", description:"Design beautiful mobile experiences. Close collaboration with product and engineering.", tags:["Figma","UI/UX","Remote","Mobile"], phone:"9821334455", email:"design@appcraft.io", posted:"2026-06-29", enhanced:true, experience_years:3 },
  { id:"j8", title:"English Language Trainer", org:"GlobalSpeak Institute", city:"Delhi", state:"Delhi", type:"parttime", category:"EdTech", salary_min:20000, salary_max:35000, requirements:"Excellent English, IELTS coaching experience preferred", description:"Part-time evening batches. Online + in-center. Flexible hours.", tags:["English","IELTS","Part-time","Online"], phone:"9810998877", email:"jobs@globalspeak.in", posted:"2026-06-28", experience_years:1 },
];

const MOCK_SEEKERS: Seeker[] = [
  { id:"s1", name:"Priya Sharma", headline:"CBSE Maths & Physics Teacher · 8 years · Bengaluru", city:"Bengaluru", state:"Karnataka", qualifications:["B.Ed","M.Sc Mathematics"], subjects:["Mathematics","Physics","Science"], experience_years:8, salary_min:45000, salary_max:65000, job_mode_pref:"fulltime", summary:"Experienced CBSE teacher with 8 years at reputed schools. Strong board results track record.", skills:["CBSE","Lesson Planning","Online Teaching"], phone:"9845001122", email:"priya.sharma@gmail.com", posted:"2026-07-05", available:true },
  { id:"s2", name:"Rahul Verma", headline:"Full-Stack Developer · 5 years · React + Node · Open to Remote", city:"Pune", state:"Maharashtra", qualifications:["B.Tech (CS)","AWS Certified"], subjects:["React","Node.js","PostgreSQL"], experience_years:5, salary_min:100000, salary_max:150000, job_mode_pref:"remote", summary:"5 years building scalable SaaS products. Strong in full-stack JS and cloud infrastructure.", skills:["React","Next.js","Node.js","PostgreSQL","AWS"], phone:"9823445566", email:"rahul.verma@outlook.com", posted:"2026-07-04", available:true },
  { id:"s3", name:"Deepa Menon", headline:"Commerce Lecturer · NET Qualified · 6 years", city:"Mysuru", state:"Karnataka", qualifications:["M.Com","UGC-NET","SET"], subjects:["Accountancy","Business Studies","Economics"], experience_years:6, salary_min:35000, salary_max:55000, job_mode_pref:"fulltime", summary:"NET-qualified Commerce lecturer with 6 years at degree colleges. Published research papers.", skills:["Accountancy","Cost Accounting","GST","Tally"], phone:"9845778899", email:"deepa.menon@gmail.com", posted:"2026-07-03", available:true },
  { id:"s4", name:"Arjun Nair", headline:"Data Scientist · Python / ML · 4 years · Hybrid", city:"Hyderabad", state:"Telangana", qualifications:["M.Tech (Data Science)","Google ML Cert"], subjects:["Python","Machine Learning","NLP"], experience_years:4, salary_min:90000, salary_max:130000, job_mode_pref:"hybrid", summary:"Data scientist with 4 years in fintech. Built fraud detection and churn prediction models.", skills:["Python","TensorFlow","Scikit-learn","SQL","Power BI"], phone:"9700223344", email:"arjun.nair@gmail.com", posted:"2026-07-02", available:false },
];

// ── ResumeCard — formatted resume template ────────────────────────────────────
function ResumeCard({ data }: { data: ResumeData }) {
  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Resume – ${data.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,serif;color:#0f172a;background:#fff;padding:40px;max-width:760px;margin:0 auto;font-size:13px;line-height:1.6}
  h1{font-size:26px;font-weight:900;letter-spacing:-0.5px}
  .hl{color:#0f766e;font-size:15px;font-weight:600;margin:4px 0 12px}
  .ct{display:flex;gap:20px;font-size:12px;color:#475569;border-bottom:2px solid #0f766e;padding-bottom:14px;margin-bottom:20px;flex-wrap:wrap}
  h2{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px}
  .et{font-weight:700;font-size:14px}.em{color:#64748b;font-size:12px;margin:2px 0 6px}
  ul{padding-left:16px;margin-bottom:12px}li{margin:3px 0;font-size:12.5px}
  .tc{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .pill{display:inline-block;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;border-radius:20px;padding:3px 10px;font-size:11px;margin:2px 3px 2px 0;font-weight:600}
  .cert{display:inline-block;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:20px;padding:3px 10px;font-size:11px;margin:2px 3px 2px 0;font-weight:600}
</style></head><body>
<h1>${data.name}</h1>
<div class="hl">${data.headline}</div>
<div class="ct">
  ${data.contact?.city ? `<span>📍 ${data.contact.city}</span>` : ""}
  ${data.contact?.email ? `<span>✉ ${data.contact.email}</span>` : ""}
  ${data.contact?.phone ? `<span>📱 ${data.contact.phone}</span>` : ""}
</div>
${data.summary ? `<h2>Professional Summary</h2><p style="font-size:13px;line-height:1.7;color:#374151">${data.summary}</p>` : ""}
${data.experience?.length ? `<h2>Experience</h2>${data.experience.map(e=>`<div style="margin-bottom:14px"><div class="et">${e.title}</div><div class="em">${e.org}${e.period?` · ${e.period}`:""}</div>${e.bullets?.length?`<ul>${e.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>`:""}</div>`).join("")}` : ""}
${data.education?.length ? `<h2>Education</h2>${data.education.map(e=>`<div style="margin-bottom:8px"><strong>${e.degree}</strong> · ${e.institution}${e.year?` · ${e.year}`:""}</div>`).join("")}` : ""}
<div class="tc">
  ${data.skills?.length ? `<div><h2>Skills</h2>${data.skills.map(s=>`<span class="pill">${s}</span>`).join("")}</div>` : ""}
  ${data.certifications?.length ? `<div><h2>Certifications</h2>${data.certifications.map(c=>`<span class="cert">${c}</span>`).join("")}</div>` : ""}
</div>
</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-h-[55vh] overflow-y-auto">
        <div className="border-b-2 border-teal-600 pb-4 mb-5">
          <h2 className="text-2xl font-black text-gray-900">{data.name}</h2>
          <p className="text-teal-600 font-semibold mt-1">{data.headline}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
            {data.contact?.city  && <span>📍 {data.contact.city}</span>}
            {data.contact?.email && <span>✉ {data.contact.email}</span>}
            {data.contact?.phone && <span>📱 {data.contact.phone}</span>}
          </div>
        </div>
        {data.summary && (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
          </div>
        )}
        {data.experience?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Experience</p>
            {data.experience.map((e, i) => (
              <div key={i} className="mb-3">
                <p className="font-bold text-sm text-gray-900">{e.title}</p>
                <p className="text-xs text-gray-500">{e.org}{e.period ? ` · ${e.period}` : ""}</p>
                {e.bullets?.length > 0 && <ul className="list-disc list-inside mt-1 space-y-0.5">{e.bullets.map((b,j)=><li key={j} className="text-xs text-gray-600">{b}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}
        {data.education?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Education</p>
            {data.education.map((e, i) => <p key={i} className="text-sm text-gray-700 mb-1"><strong>{e.degree}</strong> · {e.institution}{e.year ? ` · ${e.year}` : ""}</p>)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {data.skills?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">{data.skills.map(s=><span key={s} className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-2 py-0.5 font-semibold">{s}</span>)}</div>
            </div>
          )}
          {data.certifications?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Certifications</p>
              <div className="flex flex-wrap gap-1.5">{data.certifications.map(c=><span key={c} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 font-semibold">{c}</span>)}</div>
            </div>
          )}
        </div>
      </div>
      <button onClick={print}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition">
        <Printer size={16}/> Print / Save as PDF
      </button>
    </div>
  );
}

// ── AuthModal ─────────────────────────────────────────────────────────────────
function AuthModal({ onSuccess, initialMode = "register", context, onClose }: {
  onSuccess: (u: NexusUser) => void;
  initialMode?: "login" | "register";
  context?: string;
  onClose: () => void;
}) {
  const [tab,   setTab]   = useState(initialMode);
  const [utype, setUtype] = useState<"talent"|"employer">("talent");
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org,   setOrg]   = useState("");
  const [pw,    setPw]    = useState("");
  const [pw2,   setPw2]   = useState("");
  const [err,   setErr]   = useState("");

  const submit = () => {
    setErr("");
    if (tab === "register") {
      if (!name || !email || !phone || !pw) { setErr("All fields are required."); return; }
      if (pw !== pw2) { setErr("Passwords don't match."); return; }
      const r = doRegister({ name, email, phone, pw, type: utype, org: org || undefined });
      if (typeof r === "string") { setErr(r); return; }
      onSuccess(r);
    } else {
      if (!email || !pw) { setErr("Email and password required."); return; }
      const r = doLogin(email, pw);
      if (typeof r === "string") { setErr(r); return; }
      onSuccess(r);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Lock size={16} className="text-teal-500"/>
                {tab === "register" ? "Create Account" : "Welcome Back"}
              </h2>
              {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16}/></button>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["register","login"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab === t ? "bg-white text-teal-700 shadow" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "register" ? "Register" : "Sign In"}
              </button>
            ))}
          </div>

          {tab === "register" && (
            <div className="grid grid-cols-2 gap-2">
              {([["talent","🎓","Job Seeker"],["employer","🏢","Employer"]] as const).map(([v,e,l]) => (
                <button key={v} onClick={() => setUtype(v)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-bold transition ${utype === v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <span className="text-xl">{e}</span><span className="text-xs">{l}</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {tab === "register" && (
              <>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
                {utype === "employer" && (
                  <input value={org} onChange={e => setOrg(e.target.value)} placeholder="Organisation / Company name"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
                )}
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </>
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            {tab === "register" && (
              <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Confirm password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            )}
          </div>

          {err && <p className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><AlertCircle size={12}/>{err}</p>}

          <button onClick={submit}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
            <UserCheck size={16}/>
            {tab === "register" ? "Create Account" : "Sign In"}
          </button>

          <p className="text-center text-xs text-gray-500">
            {tab === "register" ? "Already registered? " : "New here? "}
            <button onClick={() => { setTab(tab === "register" ? "login" : "register"); setErr(""); }}
              className="text-teal-600 font-bold hover:underline">
              {tab === "register" ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Resume Builder Modal ───────────────────────────────────────────────────────
function ResumeBuilderModal({ user, existing, onClose, onSave }: {
  user: NexusUser; existing: ResumeData | null;
  onClose: () => void; onSave: (r: ResumeData) => void;
}) {
  const [step,   setStep]   = useState<"upload"|"processing"|"preview">(existing ? "preview" : "upload");
  const [paste,  setPaste]  = useState("");
  const [file,   setFile]   = useState<File | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(existing);
  const [err,    setErr]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const process = async () => {
    setErr(""); setStep("processing");
    try {
      let body: Record<string, string>;
      if (file) {
        const ab  = await file.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
        body = { fileBase64: b64, mimeType: file.type };
      } else if (paste.trim()) {
        body = { text: paste };
      } else {
        setErr("Upload a file or paste resume text."); setStep("upload"); return;
      }
      const res = await fetch("/api/extract-resume", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.success) { setErr(d.error || "AI extraction failed — try text paste instead."); setStep("upload"); return; }
      setResume(d.data); setStep("preview");
    } catch (e: any) {
      setErr(e.message); setStep("upload");
    }
  };

  const save = () => {
    if (!resume) return;
    localStorage.setItem(RESUME_KEY(user.id), JSON.stringify(resume));
    onSave(resume);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2"><FileText size={18} className="text-teal-500"/>AI Resume Builder</h2>
            <p className="text-xs text-gray-500">Upload PDF or paste text → Claude generates professional template · Not stored on server</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16}/></button>
        </div>

        <div className="p-6 space-y-4">
          {step === "upload" && (
            <>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-teal-300 transition cursor-pointer"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
                <Upload size={28} className="text-gray-300 mx-auto mb-3"/>
                {file
                  ? <p className="font-bold text-teal-700 text-sm">{file.name}</p>
                  : <><p className="font-bold text-gray-600 text-sm">Drop your resume here</p><p className="text-xs text-gray-400 mt-1">PDF or TXT · Max 5 MB</p></>}
                <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}/>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200"/>
                <span className="text-xs text-gray-400">or paste resume text</span>
                <div className="h-px flex-1 bg-gray-200"/>
              </div>

              <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={8}
                placeholder="Copy and paste your resume text here (from Word, Google Docs, or any source)…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none font-mono text-xs leading-relaxed"/>

              {err && <p className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><AlertCircle size={12}/>{err}</p>}

              <button onClick={process} disabled={!file && !paste.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                <Sparkles size={16}/> Generate Resume with AI
              </button>
            </>
          )}

          {step === "processing" && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles size={28} className="text-teal-500 animate-pulse"/>
              </div>
              <p className="font-bold text-gray-900">Claude is reading your resume…</p>
              <p className="text-xs text-gray-500">Extracting experience, qualifications, and skills</p>
              <Loader2 size={20} className="animate-spin text-teal-500 mx-auto"/>
            </div>
          )}

          {step === "preview" && resume && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">Your Resume · Preview</p>
                <button onClick={() => { setStep("upload"); setFile(null); setPaste(""); }}
                  className="text-xs text-teal-600 font-bold hover:underline">Upload Again</button>
              </div>
              <ResumeCard data={resume}/>
              <button onClick={save}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                <CheckCircle size={16}/> Save to My Profile
              </button>
              <p className="text-center text-[11px] text-gray-400">Saved to your device only — not uploaded to any server</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post Job Modal ─────────────────────────────────────────────────────────────
function PostJobModal({ onClose, onSuccess, user }: { onClose: () => void; onSuccess: (j: Job) => void; user?: NexusUser | null }) {
  const [form, setForm] = useState({
    title:"", org: user?.org || "", city:"", type:"permanent", category:"Education",
    salary_min:"", salary_max:"", description:"", requirements:"",
    phone: user?.phone || "", email: user?.email || "", experience_years:"1",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.org || !form.city || !form.phone) return;
    setSaving(true);
    try {
      await fetch("/v1/public/listings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: `job_${form.category.toLowerCase()}`, name: form.title, mode: "provider",
          phone: form.phone, email: form.email, city: form.city, description: form.description,
          rate_info: `₹${form.salary_min}–${form.salary_max}/month`,
          services: { org: form.org, job_type: form.type, category: form.category,
            salary_min: +form.salary_min||0, salary_max: +form.salary_max||0,
            requirements: form.requirements, experience_years: +form.experience_years||1, tags: [form.category, form.type] },
          available_now: true, source: "app",
        }),
      });
    } catch {}
    onSuccess({
      id: `nj${Date.now()}`, title: form.title, org: form.org, city: form.city, state:"",
      type: form.type as any, category: form.category,
      salary_min: +form.salary_min||0, salary_max: +form.salary_max||0,
      requirements: form.requirements, description: form.description,
      tags: [form.category, form.type], phone: form.phone, email: form.email,
      posted:"Just now", experience_years: +form.experience_years||1,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-black text-gray-900 text-lg">Post a Job</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16}/></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Job Title *</label>
            <input value={form.title} onChange={e => set("title",e.target.value)} placeholder="e.g. Senior Maths Teacher, React Developer"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
          </div>
          {[["Organisation *","org","School / Company name",""],["City *","city","Bengaluru, Mumbai…",""]].map(([l,k,ph]) => (
            <div key={k}>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{l}</label>
              <input value={(form as any)[k]} onChange={e => set(k,e.target.value)} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Job Type</label>
            <select value={form.type} onChange={e => set("type",e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
              <option value="permanent">Permanent</option><option value="contract">Contract</option>
              <option value="remote">Remote</option><option value="parttime">Part-time</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Category</label>
            <select value={form.category} onChange={e => set("category",e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
              {CATS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {[["Min Salary (₹/mo)","salary_min","35000"],["Max Salary (₹/mo)","salary_max","65000"],
            ["Min Experience (yrs)","experience_years","2"],["Contact Phone *","phone","9XXXXXXXXX"],
            ["Contact Email","email","hr@company.com"],
          ].map(([l,k,ph]) => (
            <div key={k}>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{l}</label>
              <input type={k.includes("salary")||k==="experience_years"?"number":"text"} value={(form as any)[k]} onChange={e => set(k,e.target.value)} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
          ))}
          {[["Requirements","requirements","B.Ed + 3yr experience…"],["Job Description","description","Describe the role…"]].map(([l,k,ph]) => (
            <div key={k} className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{l}</label>
              <textarea value={(form as any)[k]} onChange={e => set(k,e.target.value)} rows={3} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"/>
            </div>
          ))}
          <div className="sm:col-span-2">
            <button onClick={submit} disabled={saving || !form.title || !form.org || !form.phone}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
              {saving ? "Posting…" : "Post Job · Free"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Profile Modal ───────────────────────────────────────────────────────
function CreateProfileModal({ onClose, onSuccess, user }: {
  onClose: () => void; onSuccess: (s: Seeker) => void; user?: NexusUser | null;
}) {
  const [form, setForm] = useState({
    name: user?.name || "", headline:"", city:"", phone: user?.phone || "",
    email: user?.email || "", experience_years:"1", salary_min:"", salary_max:"",
    qualifications:"", subjects:"", summary:"", job_mode_pref:"fulltime",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await fetch("/v1/public/listings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "job_seeker", name: form.name, mode: "seeker",
          phone: form.phone, email: form.email, city: form.city, description: form.summary,
          rate_info: `₹${form.salary_min}–${form.salary_max}/month`,
          services: { headline: form.headline,
            qualifications: form.qualifications.split(",").map(s=>s.trim()).filter(Boolean),
            subjects: form.subjects.split(",").map(s=>s.trim()).filter(Boolean),
            experience_years: +form.experience_years||1,
            salary_min: +form.salary_min||0, salary_max: +form.salary_max||0,
            job_mode_pref: form.job_mode_pref },
          available_now: true, source: "app",
        }),
      });
    } catch {}
    onSuccess({
      id: `ns${Date.now()}`, name: form.name, headline: form.headline,
      city: form.city, state:"",
      qualifications: form.qualifications.split(",").map(s=>s.trim()).filter(Boolean),
      subjects: form.subjects.split(",").map(s=>s.trim()).filter(Boolean),
      experience_years: +form.experience_years||1,
      salary_min: +form.salary_min||0, salary_max: +form.salary_max||0,
      job_mode_pref: form.job_mode_pref, summary: form.summary,
      skills: form.subjects.split(",").map(s=>s.trim()).filter(Boolean),
      phone: form.phone, email: form.email, posted:"Just now", available:true,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-black text-gray-900 text-lg">Create Talent Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16}/></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["Full Name *","name","Priya Sharma"],["City","city","Bengaluru"]].map(([l,k,ph]) => (
            <div key={k}>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{l}</label>
              <input value={(form as any)[k]} onChange={e => set(k,e.target.value)} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Professional Headline</label>
            <input value={form.headline} onChange={e => set("headline",e.target.value)} placeholder="CBSE Maths Teacher · 8 years · Bengaluru"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
          </div>
          {[["Phone *","phone","9XXXXXXXXX"],["Email","email","you@email.com"]].map(([l,k,ph]) => (
            <div key={k}>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{l}</label>
              <input type={k==="email"?"email":"text"} value={(form as any)[k]} onChange={e => set(k,e.target.value)} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
          ))}
          {[["Experience (years)","experience_years","3"],["Min Expected (₹/mo)","salary_min","40000"],
            ["Max Expected (₹/mo)","salary_max","65000"],
          ].map(([l,k,ph]) => (
            <div key={k}>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{l}</label>
              <input type="number" value={(form as any)[k]} onChange={e => set(k,e.target.value)} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Preferred Mode</label>
            <select value={form.job_mode_pref} onChange={e => set("job_mode_pref",e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
              <option value="fulltime">Full-time</option><option value="parttime">Part-time</option>
              <option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="contract">Contract</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Qualifications (comma-separated)</label>
            <input value={form.qualifications} onChange={e => set("qualifications",e.target.value)} placeholder="B.Ed, M.Sc Mathematics, UGC-NET"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Subjects / Skills (comma-separated)</label>
            <input value={form.subjects} onChange={e => set("subjects",e.target.value)} placeholder="Mathematics, Physics, Online Teaching"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Professional Summary</label>
            <textarea value={form.summary} onChange={e => set("summary",e.target.value)} rows={3}
              placeholder="Brief summary of your experience and strengths…"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"/>
          </div>
          <div className="sm:col-span-2">
            <button onClick={save} disabled={saving || !form.name || !form.phone}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
              {saving ? "Publishing…" : "Publish Talent Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Apply / Contact Modal ─────────────────────────────────────────────────────
function ApplyModal({ target, type, onClose, user, resume }: {
  target: Job | Seeker; type: "job" | "talent";
  onClose: () => void; user?: NexusUser | null; resume?: ResumeData | null;
}) {
  const [msg,          setMsg]          = useState("");
  const [name,         setName]         = useState(user?.name  || "");
  const [phone,        setPhone]        = useState(user?.phone || "");
  const [shareResume,  setShareResume]  = useState(false);
  const [sent,         setSent]         = useState(false);
  const [sending,      setSending]      = useState(false);

  const isJob  = type === "job";
  const job    = isJob ? target as Job    : null;
  const seeker = !isJob ? target as Seeker : null;
  const title  = isJob ? job!.title    : seeker!.name;
  const org    = isJob ? job!.org      : seeker!.headline;
  const tPhone = target.phone;

  const resumeSnippet = shareResume && resume
    ? `\n\n📄 *My Profile:*\n• Experience: ${resume.experience_years} years\n• Skills: ${resume.skills?.slice(0,4).join(", ")}\n• Salary expected: ${sal(resume.salary_min, resume.salary_max)}`
    : "";

  const waMsg = isJob
    ? `Hi, I saw your job posting for *${title}* at *${org}* on Nexus Talent.\n\nMy name is ${name||"[Name]"}, contact: ${phone||"[Phone]"}.\n\n${msg}${resumeSnippet}`
    : `Hi ${title}, I found your profile on Nexus Talent and would like to connect about an opportunity.\n\n${msg}${resumeSnippet}`;

  const waLink  = `https://wa.me/91${tPhone}?text=${encodeURIComponent(waMsg)}`;

  const sendEmail = async () => {
    if (!name.trim()) return;
    setSending(true);
    try {
      await fetch("/api/send-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: target.email, toName: isJob ? org : title,
          subject: isJob ? `Job Application: ${title}` : `Talent Inquiry from ${name}`, text: waMsg }),
      });
    } catch {}
    setSent(true); setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900">{isJob ? "Apply for Job" : "Contact Talent"}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16}/></button>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
            <p className="font-bold text-gray-900 text-sm">{title}</p>
            <p className="text-xs text-gray-500">{org}</p>
          </div>

          {!sent ? (
            <>
              {[["Your Name","name","Full name"],["Your Phone","phone","9XXXXXXXXX"]].map(([l,k,ph]) => (
                <div key={k}>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{l}</label>
                  <input value={k==="name"?name:phone} onChange={e => k==="name"?setName(e.target.value):setPhone(e.target.value)} placeholder={ph}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Message</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
                  placeholder={isJob ? "Briefly introduce yourself and your experience…" : "Describe the opportunity you want to discuss…"}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"/>
              </div>

              {resume && (
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-teal-50 border border-teal-100 rounded-xl">
                  <input type="checkbox" checked={shareResume} onChange={e => setShareResume(e.target.checked)} className="w-4 h-4 accent-teal-600"/>
                  <div>
                    <p className="text-xs font-bold text-teal-700">Share my resume summary</p>
                    <p className="text-[10px] text-teal-600">Appends your experience, skills &amp; salary to the message</p>
                  </div>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                {target.email && (
                  <button onClick={sendEmail} disabled={sending}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition">
                    {sending ? <Loader2 size={14} className="animate-spin"/> : <Mail size={14}/>} Email
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto"><CheckCircle size={28} className="text-green-500"/></div>
              <p className="font-bold text-gray-900">Message Sent!</p>
              <p className="text-xs text-gray-500">The {isJob ? "employer" : "candidate"} will receive your email shortly.</p>
              <button onClick={onClose} className="mt-2 text-sm text-teal-600 font-bold hover:underline">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── JobCard ────────────────────────────────────────────────────────────────────
function JobCard({ job, onApply }: { job: Job; onApply: (j: Job) => void }) {
  const initials = job.org.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all group">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${clr(job.org)} flex items-center justify-center text-white font-black text-sm shrink-0`}>{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px] group-hover:text-teal-700 transition-colors leading-tight">{job.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1"><Building2 size={12}/> {job.org}
                {job.is_verified && <CheckCircle size={11} className="text-teal-500 ml-1"/>}
              </p>
            </div>
            <button className="text-gray-300 hover:text-teal-500 shrink-0 transition-colors"><Bookmark size={16}/></button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${TYPE_BADGE[job.type]}`}>{job.type}</span>
            {job.enhanced && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-orange-100 text-orange-700">Featured</span>}
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><MapPin size={10}/>{job.city}</span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><IndianRupee size={10}/>{sal(job.salary_min,job.salary_max)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {job.tags.slice(0,4).map(t => <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
          </div>
          <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">{job.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={10}/> {job.posted}</span>
        <button onClick={() => onApply(job)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2 rounded-lg transition active:scale-95">
          Apply Now
        </button>
      </div>
    </div>
  );
}

// ── SeekerCard ────────────────────────────────────────────────────────────────
function SeekerCard({ s, onContact }: { s: Seeker; onContact: (s: Seeker) => void }) {
  const initials = s.name.split(" ").map(w => w[0]).join("").toUpperCase();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all group">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${clr(s.name)} flex items-center justify-center text-white font-black text-sm shrink-0 relative`}>
          {initials}
          {s.available && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"/>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px] group-hover:text-teal-700 transition-colors">{s.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.headline}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${s.available?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>
              {s.available ? "Available" : "Busy"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {s.subjects.slice(0,4).map(t => <span key={t} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">{t}</span>)}
          </div>
          <div className="flex flex-wrap gap-3 mt-2.5 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><IndianRupee size={10}/>{sal(s.salary_min,s.salary_max)}</span>
            <span className="flex items-center gap-1"><MapPin size={10}/>{s.city}</span>
            <span className="flex items-center gap-1"><Briefcase size={10}/>{s.experience_years}yr exp</span>
            <span className="flex items-center gap-1"><Wifi size={10}/>{s.job_mode_pref}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">{s.summary}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={10}/> {s.posted}</span>
        <button onClick={() => onContact(s)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2 rounded-lg transition active:scale-95">
          Contact Now
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [user,    setUser]    = useState<NexusUser | null>(null);
  const [resume,  setResume]  = useState<ResumeData | null>(null);
  const [mode,    setMode]    = useState<Mode>("jobs");
  const [jobs,    setJobs]    = useState<Job[]>(MOCK_JOBS);
  const [seekers, setSeekers] = useState<Seeker[]>(MOCK_SEEKERS);

  const [keyword,    setKeyword]    = useState("");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [catFilter,  setCatFilter]  = useState("All");
  const [typeFilter, setTypeFilter] = useState<JobType>("all");

  const [showAuth,     setShowAuth]     = useState(false);
  const [authMode,     setAuthMode]     = useState<"login"|"register">("register");
  const [authContext,  setAuthContext]  = useState("");
  const [pendingApply, setPendingApply] = useState<{ target: Job|Seeker; type: "job"|"talent" } | null>(null);
  const [applyTarget,  setApplyTarget]  = useState<{ target: Job|Seeker; type: "job"|"talent" } | null>(null);
  const [showPostJob,  setShowPostJob]  = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showResume,   setShowResume]   = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const u = loadSession();
    if (u) {
      setUser(u);
      const r = localStorage.getItem(RESUME_KEY(u.id));
      if (r) { try { setResume(JSON.parse(r)); } catch {} }
    }
  }, []);

  const handleApply = useCallback((target: Job | Seeker, type: "job" | "talent") => {
    if (!user) {
      setPendingApply({ target, type });
      setAuthContext(type === "job" ? "Register to apply for this job" : "Register to contact this candidate");
      setAuthMode("register");
      setShowAuth(true);
    } else {
      setApplyTarget({ target, type });
    }
  }, [user]);

  const afterAuth = (u: NexusUser) => {
    setUser(u);
    setShowAuth(false);
    if (pendingApply) { setApplyTarget(pendingApply); setPendingApply(null); }
  };

  const handleLogout = () => { clearSession(); setUser(null); setResume(null); setShowUserMenu(false); };

  const filteredJobs = jobs.filter(j => {
    const kw = keyword.toLowerCase();
    return (!kw || j.title.toLowerCase().includes(kw) || j.org.toLowerCase().includes(kw) || j.tags.some(t=>t.toLowerCase().includes(kw)))
      && (cityFilter==="All Cities" || j.city===cityFilter)
      && (catFilter==="All"         || j.category===catFilter)
      && (typeFilter==="all"        || j.type===typeFilter);
  });

  const filteredSeekers = seekers.filter(s => {
    const kw = keyword.toLowerCase();
    return (!kw || s.name.toLowerCase().includes(kw) || s.subjects.some(x=>x.toLowerCase().includes(kw)) || s.skills.some(x=>x.toLowerCase().includes(kw)))
      && (cityFilter==="All Cities" || s.city===cityFilter);
  });

  const stats = { jobs: jobs.length, seekers: seekers.length, cities: [...new Set(jobs.map(j=>j.city))].length };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" onClick={() => setShowUserMenu(false)}>

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Briefcase size={16} className="text-white"/></div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">Nexus Talent</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none">Careers · India</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button onClick={() => setMode("jobs")} className={`hover:text-teal-600 transition ${mode==="jobs"?"text-teal-600 font-bold":""}`}>Find Jobs</button>
            <button onClick={() => setMode("talent")} className={`hover:text-teal-600 transition ${mode==="talent"?"text-teal-600 font-bold":""}`}>Find Talent</button>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            {user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(p => !p)}
                  className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 font-bold text-sm px-3 py-2 rounded-xl hover:bg-teal-100 transition">
                  <div className={`w-6 h-6 rounded-full ${clr(user.name)} flex items-center justify-center text-white text-[10px] font-black`}>{user.name[0]}</div>
                  <span className="hidden sm:block max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={12}/>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl w-52 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.type}{user.org ? ` · ${user.org}` : ""}</p>
                    </div>
                    {user.type === "talent" && (
                      <button onClick={() => { setShowResume(true); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <FileText size={14} className="text-teal-500"/> My Resume
                        {resume && <CheckCircle size={12} className="text-green-500 ml-auto"/>}
                      </button>
                    )}
                    {user.type === "talent" && (
                      <button onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <Users size={14} className="text-teal-500"/> My Public Profile
                      </button>
                    )}
                    {user.type === "employer" && (
                      <button onClick={() => { setShowPostJob(true); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <Plus size={14} className="text-teal-500"/> Post a Job
                      </button>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                        <LogOut size={14}/> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => { setAuthMode("login"); setAuthContext(""); setShowAuth(true); }}
                  className="hidden sm:block border border-teal-600 text-teal-600 hover:bg-teal-50 font-bold text-sm px-4 py-2 rounded-lg transition">
                  Sign In
                </button>
                <button onClick={() => { setAuthMode("register"); setAuthContext(""); setShowAuth(true); }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition">
                  Register Free
                </button>
              </>
            )}
            {user?.type === "employer" && (
              <button onClick={() => setShowPostJob(true)}
                className="hidden sm:flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition">
                <Plus size={14}/> Post Job
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold mb-4 border border-white/20">
              <Star size={12} className="text-yellow-300"/> India&apos;s fastest-growing talent platform
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-3">
              {mode==="jobs" ? <><span className="text-yellow-300">Find</span> Your Next Career</> : <>Find Top <span className="text-yellow-300">Talent</span></>}
            </h1>
            <p className="text-teal-100 text-sm sm:text-base max-w-lg mx-auto">
              {mode==="jobs" ? "Browse jobs in Education, IT, Finance and more. WhatsApp-first apply." : "Browse verified professionals — teachers, developers, accountants, consultants."}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search size={16} className="text-gray-400 shrink-0"/>
              <input value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="Maths Teacher, React Developer, CA…"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none py-2.5"/>
            </div>
            <div className="w-px bg-gray-100 hidden sm:block"/>
            <div className="flex items-center gap-2 px-3">
              <MapPin size={16} className="text-gray-400 shrink-0"/>
              <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                className="text-sm text-gray-700 focus:outline-none bg-transparent py-2.5 cursor-pointer">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition shrink-0">
              <Search size={16}/> Search
            </button>
          </div>

          <div className="flex justify-center gap-3 mt-6">
            {(["jobs","talent"] as Mode[]).map(v => (
              <button key={v} onClick={() => setMode(v)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${mode===v?"bg-white text-teal-700":"bg-white/15 text-white hover:bg-white/25"}`}>
                {v==="jobs" ? <Briefcase size={14}/> : <Users size={14}/>}
                {v==="jobs" ? `Find Jobs (${stats.jobs})` : `Find Talent (${stats.seekers})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto text-xs text-gray-500 font-medium">
          <span className="flex items-center gap-1.5 shrink-0"><Briefcase size={12} className="text-teal-500"/><strong className="text-gray-900">{stats.jobs}</strong> Active Jobs</span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1.5 shrink-0"><Users size={12} className="text-teal-500"/><strong className="text-gray-900">{stats.seekers}</strong> Talent Profiles</span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1.5 shrink-0"><MapPin size={12} className="text-teal-500"/><strong className="text-gray-900">{stats.cities}</strong> Cities</span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1.5 shrink-0 text-green-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"/>Live Platform</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0 space-y-4">
            {mode === "jobs" && (
              <>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Job Type</p>
                  {([["all","All Types"],["permanent","Permanent"],["contract","Contract"],["remote","Remote"],["parttime","Part-time"]] as [JobType,string][]).map(([v,l]) => (
                    <label key={v} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" checked={typeFilter===v} onChange={() => setTypeFilter(v)} className="w-3.5 h-3.5 accent-teal-600"/>
                      <span className="text-sm text-gray-700">{l}</span>
                    </label>
                  ))}
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">Category</p>
                  {CATS.map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                      className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition ${catFilter===c?"bg-teal-50 text-teal-700 font-bold":"text-gray-600 hover:bg-gray-50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(!user || user.type === "talent") && (
              <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl p-5 text-white">
                <FileText size={20} className="mb-2"/>
                <p className="font-black text-sm mb-1">AI Resume Builder</p>
                <p className="text-teal-100 text-xs mb-3">Upload PDF or paste text — Claude generates a professional template. Not stored on server.</p>
                <button onClick={() => { if (!user) { setAuthContext("Register to build your AI resume"); setShowAuth(true); } else setShowResume(true); }}
                  className="w-full bg-white text-teal-700 font-bold text-xs py-2 rounded-lg hover:bg-teal-50 transition">
                  {resume ? "Update My Resume →" : "Build Resume Free →"}
                </button>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <Building2 size={20} className="text-teal-500 mx-auto mb-2"/>
              <p className="font-bold text-gray-900 text-sm mb-1">Hiring?</p>
              <p className="text-gray-500 text-xs mb-3">Post a job and reach thousands of professionals instantly.</p>
              <button onClick={() => { if (!user) { setAuthMode("register"); setAuthContext("Register as employer to post jobs"); setShowAuth(true); } else setShowPostJob(true); }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 rounded-lg transition">
                Post a Job Free
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-700">
                {mode==="jobs" ? `${filteredJobs.length} jobs found` : `${filteredSeekers.length} talent profiles`}
              </p>
              <select className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                <option>Recently posted</option><option>Salary: High to Low</option><option>Experience</option>
              </select>
            </div>

            {mode === "jobs" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredJobs.length > 0
                  ? filteredJobs.map(j => <JobCard key={j.id} job={j} onApply={j => handleApply(j,"job")}/>)
                  : <div className="col-span-2 text-center py-20 text-gray-400"><Briefcase size={40} className="mx-auto mb-3 opacity-30"/><p className="font-medium">No jobs match your search</p></div>}
              </div>
            )}
            {mode === "talent" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredSeekers.length > 0
                  ? filteredSeekers.map(s => <SeekerCard key={s.id} s={s} onContact={s => handleApply(s,"talent")}/>)
                  : <div className="col-span-2 text-center py-20 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-30"/><p className="font-medium">No profiles match your search</p></div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Briefcase size={16} className="text-white"/></div>
            <div><p className="font-black text-sm">Nexus Talent</p><p className="text-gray-400 text-xs">Jobs · Education · IT · Finance · India</p></div>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <a href="#" className="hover:text-white transition">About</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <Link href="/explore" className="text-teal-400 hover:text-white transition">← Back to Explore</Link>
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">© 2026 Nexus Talent · Powered by Paariwala Platform</p>
      </footer>

      {/* ── Modals ── */}
      {showAuth && (
        <AuthModal initialMode={authMode} context={authContext} onSuccess={afterAuth}
          onClose={() => { setShowAuth(false); setPendingApply(null); }}/>
      )}
      {showResume && user && (
        <ResumeBuilderModal user={user} existing={resume} onClose={() => setShowResume(false)}
          onSave={r => { setResume(r); setShowResume(false); }}/>
      )}
      {showPostJob && (
        <PostJobModal user={user} onClose={() => setShowPostJob(false)}
          onSuccess={j => { setJobs(p => [j,...p]); setShowPostJob(false); }}/>
      )}
      {showProfile && (
        <CreateProfileModal user={user} onClose={() => setShowProfile(false)}
          onSuccess={s => { setSeekers(p => [s,...p]); setShowProfile(false); }}/>
      )}
      {applyTarget && (
        <ApplyModal target={applyTarget.target} type={applyTarget.type} user={user} resume={resume}
          onClose={() => setApplyTarget(null)}/>
      )}
    </div>
  );
}
