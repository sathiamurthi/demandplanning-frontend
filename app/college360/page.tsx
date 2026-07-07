"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, Briefcase, Users, Building2, X, Send, Mail, Sparkles, Star,
  Plus, Loader2, Upload, FileText, Printer, LogOut, Lock, ChevronDown,
  Code2, TestTube2, Database, Palette, TrendingUp, Shield, Cloud,
  BookOpen, Zap, Award, MapPin, IndianRupee, CheckCircle, ArrowRight,
  GraduationCap, Rocket, Brain, Globe, UserCheck, Clock, Target, Heart,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface C360User {
  id: string; name: string; email: string; phone: string;
  role: "student" | "recruiter"; college?: string; year?: string;
  premium: boolean; createdAt: string;
}
interface StudentProfile {
  name: string; headline: string; college: string; year: string; cgpa: string;
  contact: { phone: string; email: string; city: string };
  summary: string; skills: string[]; domains: string[];
  projects: Array<{ name: string; tech: string; desc: string }>;
  education: Array<{ degree: string; institution: string; year: string; score: string }>;
  certifications: string[]; languages: string[];
  github?: string; linkedin?: string; portfolio?: string;
  seeking: string[]; preferred_cities: string[];
  achievements: string[];
}
interface Opportunity {
  id: string; title: string; company: string; city: string; type: "internship"|"placement"|"job"|"freelance";
  domain: string; stipend_min: number; stipend_max: number; duration?: string;
  skills: string[]; desc: string; apply_by: string; spots: number;
  is_premium_only: boolean; is_verified: boolean; logo_color: string;
  email: string; wa_number: string;
}
interface Mentor {
  id: string; name: string; role: string; company: string; domain: string;
  exp: number; rating: number; sessions: number; bio: string;
  skills: string[]; wa_number: string; is_premium: boolean; avatar_color: string;
}
interface LearningTrack {
  id: string; title: string; domain: string; icon: React.ReactNode;
  modules: number; hours: number; level: string; desc: string;
  color: string; bg: string; is_premium: boolean;
}
type Mode = "student" | "recruiter";

// ── Auth (localStorage) ────────────────────────────────────────────────────────
const SK = "college360_session";
const UK = "college360_users";
const PK = (id: string) => `college360_profile_${id}`;

const loadSess = (): C360User | null => {
  try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : null; } catch { return null; }
};
const saveSess = (u: C360User) => localStorage.setItem(SK, JSON.stringify(u));
const clearSess = () => localStorage.removeItem(SK);

const allUsers = (): Array<C360User & { pw: string }> => {
  try { return JSON.parse(localStorage.getItem(UK) || "[]"); } catch { return []; }
};

const doRegister = (d: { name: string; email: string; phone: string; pw: string; role: "student"|"recruiter"; college?: string; year?: string }): C360User | string => {
  const users = allUsers();
  if (users.find(u => u.email === d.email)) return "Email already registered.";
  const u: C360User = { id: `c${Date.now()}`, name: d.name, email: d.email, phone: d.phone, role: d.role, college: d.college, year: d.year, premium: false, createdAt: new Date().toISOString() };
  localStorage.setItem(UK, JSON.stringify([...users, { ...u, pw: d.pw }]));
  saveSess(u); return u;
};
const doLogin = (email: string, pw: string): C360User | string => {
  const found = allUsers().find(u => u.email === email && u.pw === pw);
  if (!found) return "Invalid email or password.";
  const { pw: _, ...u } = found; saveSess(u); return u;
};
const upgradeUser = (id: string) => {
  const users = allUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return;
  users[idx].premium = true;
  localStorage.setItem(UK, JSON.stringify(users));
  const sess = loadSess();
  if (sess) saveSess({ ...sess, premium: true });
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DOMAINS = [
  { id: "all", label: "All" },
  { id: "dev", label: "Software Dev" },
  { id: "data", label: "Data & AI" },
  { id: "design", label: "Design & UX" },
  { id: "qa", label: "Testing & QA" },
  { id: "cloud", label: "Cloud & DevOps" },
  { id: "finance", label: "Finance" },
  { id: "marketing", label: "Marketing" },
  { id: "product", label: "Product" },
  { id: "content", label: "Content" },
  { id: "security", label: "Cybersecurity" },
];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "Recently Graduated"];
const CITIES = ["All Cities", "Bengaluru", "Mumbai", "Hyderabad", "Chennai", "Pune", "Delhi", "Mysuru"];
const AB = ["bg-violet-600","bg-indigo-600","bg-blue-600","bg-teal-600","bg-emerald-600","bg-rose-600","bg-amber-600","bg-cyan-600"];
const clr = (s: string) => AB[s.charCodeAt(0) % AB.length];
const fmt = (n: number) => n >= 100000 ? `${(n/100000).toFixed(1)}L` : `${(n/1000).toFixed(0)}k`;
const sal = (a: number, b: number) => a < 1000 ? `₹${a}–${b}/day` : `₹${fmt(a)}–${fmt(b)}/mo`;
const TYPE_BADGE: Record<string, string> = {
  internship: "bg-blue-100 text-blue-700",
  placement:  "bg-violet-100 text-violet-700",
  job:        "bg-teal-100 text-teal-700",
  freelance:  "bg-amber-100 text-amber-700",
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_OPPS: Opportunity[] = [
  { id:"o1", title:"Frontend Intern — React/Next.js", company:"NexusOS", city:"Bengaluru", type:"internship", domain:"dev", stipend_min:15000, stipend_max:25000, duration:"6 months", skills:["React","TypeScript","Tailwind"], desc:"Build real features on a live SaaS product. Work alongside senior engineers, ship to production every sprint.", apply_by:"2026-07-30", spots:3, is_premium_only:false, is_verified:true, logo_color:"bg-violet-600", email:"careers@nexusos.in", wa_number:"919880001234" },
  { id:"o2", title:"Data Science Intern — Python/ML", company:"Sigmoid Analytics", city:"Hyderabad", type:"internship", domain:"data", stipend_min:20000, stipend_max:35000, duration:"4 months", skills:["Python","Pandas","ML","SQL"], desc:"Work on real client datasets. Build ML pipelines for retail demand forecasting and churn prediction.", apply_by:"2026-07-25", spots:2, is_premium_only:false, is_verified:true, logo_color:"bg-teal-600", email:"intern@sigmoid.in", wa_number:"919700112233" },
  { id:"o3", title:"Campus Placement — Software Engineer", company:"Infosys Digital", city:"Bengaluru", type:"placement", domain:"dev", stipend_min:600000, stipend_max:1000000, duration:"Full-time", skills:["Java","DSA","SQL","System Design"], desc:"Mass campus recruitment for 2025-26 batch. Eligible: CS/IT/ECE graduates. CTC 6-10 LPA based on performance.", apply_by:"2026-08-15", spots:50, is_premium_only:false, is_verified:true, logo_color:"bg-blue-600", email:"campus@infosys.com", wa_number:"919000000000" },
  { id:"o4", title:"UI/UX Design Intern", company:"AppCraft Studio", city:"Remote", type:"internship", domain:"design", stipend_min:12000, stipend_max:20000, duration:"3 months", skills:["Figma","User Research","Prototyping"], desc:"Design mobile and web interfaces. Work directly with the product team on a FinTech app.", apply_by:"2026-07-20", spots:2, is_premium_only:true, is_verified:true, logo_color:"bg-rose-600", email:"design@appcraft.io", wa_number:"919821334455" },
  { id:"o5", title:"QA / Automation Tester Intern", company:"TestGrid India", city:"Pune", type:"internship", domain:"qa", stipend_min:18000, stipend_max:28000, duration:"6 months", skills:["Selenium","Python","Postman","REST APIs"], desc:"Real test automation work on an enterprise product. Learn framework design, CI/CD integration.", apply_by:"2026-07-31", spots:4, is_premium_only:false, is_verified:true, logo_color:"bg-amber-600", email:"hr@testgrid.in", wa_number:"919800556677" },
  { id:"o6", title:"Product Manager Intern", company:"StartupLens VC", city:"Mumbai", type:"internship", domain:"product", stipend_min:25000, stipend_max:40000, duration:"3 months", skills:["Roadmapping","Figma","Analytics","SQL"], desc:"Work with portfolio startups to define features and ship MVPs. Great for MBA/engineering students.", apply_by:"2026-08-05", spots:2, is_premium_only:true, is_verified:false, logo_color:"bg-emerald-600", email:"pm@startuplens.vc", wa_number:"919890223344" },
  { id:"o7", title:"Cybersecurity Analyst Intern", company:"SecureEdge Labs", city:"Chennai", type:"internship", domain:"security", stipend_min:22000, stipend_max:32000, duration:"6 months", skills:["Network Security","Kali Linux","SIEM","Wireshark"], desc:"Hands-on penetration testing and vulnerability analysis on real client networks (supervised).", apply_by:"2026-07-28", spots:3, is_premium_only:true, is_verified:true, logo_color:"bg-indigo-600", email:"recruit@secureedge.in", wa_number:"919841009900" },
  { id:"o8", title:"Freelance Content Writer", company:"ContentHive", city:"Remote", type:"freelance", domain:"content", stipend_min:800, stipend_max:2000, duration:"Ongoing", skills:["Technical Writing","SEO","Research"], desc:"Write blog posts, case studies, and product docs for SaaS companies. ₹800-2000 per article.", apply_by:"2026-07-31", spots:10, is_premium_only:false, is_verified:false, logo_color:"bg-cyan-600", email:"write@contenthive.co", wa_number:"919700889900" },
];

const MOCK_MENTORS: Mentor[] = [
  { id:"m1", name:"Aryan Kapoor", role:"Senior SDE", company:"Google", domain:"dev", exp:8, rating:4.9, sessions:120, bio:"Google SDE working on Search infra. Passionate about helping college students crack top tech companies. Alumni IIT Bombay.", skills:["DSA","System Design","React","Python"], wa_number:"919880001111", is_premium:true, avatar_color:"bg-violet-600" },
  { id:"m2", name:"Sneha Reddy", role:"Data Scientist", company:"Flipkart", domain:"data", exp:6, rating:4.8, sessions:85, bio:"Flipkart DS building recommendation systems. Helps students transition into data science from any branch.", skills:["Python","ML","SQL","Statistics"], wa_number:"919700112244", is_premium:true, avatar_color:"bg-teal-600" },
  { id:"m3", name:"Rohan Mehta", role:"SDET Lead", company:"Microsoft", domain:"qa", exp:7, rating:4.7, sessions:60, bio:"Testing lead at Microsoft Teams. Advocate for quality engineering as a first-class career path.", skills:["Selenium","Azure DevOps","API Testing","Java"], wa_number:"919900334455", is_premium:true, avatar_color:"bg-blue-600" },
  { id:"m4", name:"Kavitha Iyer", role:"UX Lead", company:"Razorpay", domain:"design", exp:9, rating:4.9, sessions:95, bio:"Design leader at Razorpay. Mentors students from non-design backgrounds. Portfolio reviews every weekend.", skills:["Figma","User Research","Design Systems","Accessibility"], wa_number:"919845667788", is_premium:false, avatar_color:"bg-rose-600" },
  { id:"m5", name:"Vikram Singh", role:"Cloud Architect", company:"AWS India", domain:"cloud", exp:11, rating:4.8, sessions:45, bio:"AWS Solutions Architect. Helps students get cloud certified and land DevOps/Cloud roles.", skills:["AWS","Kubernetes","Terraform","Python"], wa_number:"919810223344", is_premium:true, avatar_color:"bg-amber-600" },
];

const MOCK_STUDENTS: Array<{ id:string; name:string; headline:string; college:string; year:string; cgpa:string; skills:string[]; seeking:string[]; city:string; available:boolean; color:string }> = [
  { id:"st1", name:"Nisha Kumari", headline:"B.Tech CSE · IIT Hyderabad · CGPA 8.9", college:"IIT Hyderabad", year:"4th Year", cgpa:"8.9", skills:["React","Node.js","Python","PostgreSQL"], seeking:["Full Stack Intern","SDE Role"], city:"Hyderabad", available:true, color:"bg-violet-600" },
  { id:"st2", name:"Rohan Desai", headline:"B.E. Computer Sci · BITS Pilani · 9.1 CGPA", college:"BITS Pilani", year:"3rd Year", cgpa:"9.1", skills:["Python","ML","TensorFlow","SQL"], seeking:["Data Science Intern","AI/ML Role"], city:"Bangalore", available:true, color:"bg-teal-600" },
  { id:"st3", name:"Aisha Shaikh", headline:"MCA · Symbiosis Pune · 7.8 CGPA", college:"Symbiosis Institute", year:"Postgraduate", cgpa:"7.8", skills:["Java","Selenium","API Testing","Agile"], seeking:["QA Intern","SDET Role"], city:"Pune", available:true, color:"bg-blue-600" },
  { id:"st4", name:"Dev Narayanan", headline:"B.Des · NID Ahmedabad", college:"NID Ahmedabad", year:"Recently Graduated", cgpa:"8.4", skills:["Figma","Adobe XD","UX Research","Framer"], seeking:["UI/UX Designer","Product Designer"], city:"Ahmedabad", available:false, color:"bg-rose-600" },
];

const LEARN_TRACKS: LearningTrack[] = [
  { id:"lt1", title:"Full Stack Web Dev", domain:"dev", icon:<Code2 size={22}/>, modules:12, hours:48, level:"Beginner → Pro", desc:"HTML, CSS, React, Node.js, PostgreSQL, Deploy. Build 3 real projects.", color:"text-violet-400", bg:"bg-violet-500/10", is_premium:false },
  { id:"lt2", title:"Python for Data Science", domain:"data", icon:<Database size={22}/>, modules:10, hours:40, level:"Beginner → Intermediate", desc:"NumPy, Pandas, Matplotlib, Scikit-learn, ML fundamentals with real datasets.", color:"text-teal-400", bg:"bg-teal-500/10", is_premium:false },
  { id:"lt3", title:"QA & Test Automation", domain:"qa", icon:<TestTube2 size={22}/>, modules:8, hours:32, level:"Beginner → Intermediate", desc:"Manual testing, Selenium WebDriver, Pytest, Postman, CI/CD integration.", color:"text-amber-400", bg:"bg-amber-500/10", is_premium:true },
  { id:"lt4", title:"UI/UX Design Foundations", domain:"design", icon:<Palette size={22}/>, modules:8, hours:30, level:"Beginner", desc:"Design thinking, Figma, wireframing, prototyping, usability testing.", color:"text-rose-400", bg:"bg-rose-500/10", is_premium:true },
  { id:"lt5", title:"Cloud & DevOps Essentials", domain:"cloud", icon:<Cloud size={22}/>, modules:10, hours:38, level:"Intermediate", desc:"Linux, Docker, Kubernetes, AWS basics, CI/CD pipelines, Infrastructure as Code.", color:"text-cyan-400", bg:"bg-cyan-500/10", is_premium:true },
  { id:"lt6", title:"DSA & Competitive Coding", domain:"dev", icon:<Zap size={22}/>, modules:15, hours:60, level:"Intermediate → Advanced", desc:"Arrays to Graphs. 200+ LeetCode-style problems. Interview-ready in 8 weeks.", color:"text-indigo-400", bg:"bg-indigo-500/10", is_premium:true },
];

// ── AI Profile Extractor ───────────────────────────────────────────────────────
async function extractProfile(input: { text?: string; base64?: string; mime?: string }): Promise<StudentProfile | null> {
  const prompt = `Extract a student academic/professional profile from this content and return ONLY valid JSON (no markdown):
{
  "name":"","headline":"","college":"","year":"","cgpa":"",
  "contact":{"phone":"","email":"","city":""},
  "summary":"",
  "skills":[],"domains":[],"languages":[],
  "projects":[{"name":"","tech":"","desc":""}],
  "education":[{"degree":"","institution":"","year":"","score":""}],
  "certifications":[],
  "seeking":[],"preferred_cities":[],
  "achievements":[]
}`;
  try {
    const body: Record<string, unknown> = { model:"claude-opus-4-8", max_tokens:1200,
      messages:[{ role:"user", content: input.base64
        ? [{ type:"document", source:{ type:"base64", media_type: input.mime||"application/pdf", data: input.base64 }}, { type:"text", text: prompt }]
        : [{ type:"text", text: prompt + "\n\n" + input.text }]
      }]
    };
    const r = await fetch("/api/extract-transcript", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("claude");
    const d = await r.json();
    const raw = d.content?.[0]?.text || d.text || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as StudentProfile;
  } catch {
    // Gemini fallback
    try {
      const GEMINI_KEY = Buffer.from("QUl6YVN5Qi1JdUNLelJPSXpkSDNxdnBqeUtjWjVZMTdMRm9xVjQ=","base64").toString("utf-8");
      const model = "gemini-2.5-flash";
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ contents:[{ parts:[{ text: prompt + "\n\n" + (input.text||"") }] }] })
        });
      const gd = await resp.json();
      const raw2 = gd.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const m2 = raw2.match(/\{[\s\S]*\}/);
      if (m2) return JSON.parse(m2[0]) as StudentProfile;
    } catch {}
  }
  return null;
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }: { onClose: ()=>void; onSuccess: (u: C360User)=>void }) {
  const [tab, setTab] = useState<"login"|"register">("register");
  const [role, setRole] = useState<"student"|"recruiter">("student");
  const [form, setForm] = useState({ name:"", email:"", phone:"", pw:"", college:"", year:"1st Year" });
  const [err, setErr] = useState("");

  const submit = () => {
    if (tab === "register") {
      if (!form.name || !form.email || !form.phone || !form.pw) { setErr("All fields required."); return; }
      const r = doRegister({ ...form, role, college: role==="student"?form.college:undefined, year: role==="student"?form.year:undefined });
      if (typeof r === "string") { setErr(r); return; }
      onSuccess(r);
    } else {
      if (!form.email || !form.pw) { setErr("Enter email and password."); return; }
      const r = doLogin(form.email, form.pw);
      if (typeof r === "string") { setErr(r); return; }
      onSuccess(r);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white">Join College360</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="flex bg-white/5 rounded-lg p-1 mb-5">
          {(["register","login"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition ${tab===t?"bg-violet-600 text-white":"text-gray-400"}`}>{t==="register"?"Create Account":"Sign In"}</button>
          ))}
        </div>
        {tab === "register" && (
          <div className="flex bg-white/5 rounded-lg p-1 mb-4">
            {(["student","recruiter"] as const).map(r => (
              <button key={r} onClick={()=>setRole(r)} className={`flex-1 py-1.5 rounded-md text-sm font-semibold capitalize transition ${role===r?"bg-indigo-600 text-white":"text-gray-400"}`}>{r}</button>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {tab === "register" && <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" placeholder="Full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>}
          <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
          {tab === "register" && <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" placeholder="Phone number" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>}
          {tab === "register" && role === "student" && (
            <>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" placeholder="College / University name" value={form.college} onChange={e=>setForm(f=>({...f,college:e.target.value}))}/>
              <select className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))}>
                {YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </>
          )}
          <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" placeholder="Password" type="password" value={form.pw} onChange={e=>setForm(f=>({...f,pw:e.target.value}))}/>
        </div>
        {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
        <button onClick={submit} className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition text-sm">
          {tab==="register"?"Create Free Account":"Sign In"}
        </button>
        <p className="text-xs text-gray-500 text-center mt-3">
          {tab==="register"?"Already have an account? ":"New here? "}
          <button onClick={()=>setTab(tab==="register"?"login":"register")} className="text-violet-400 hover:underline">{tab==="register"?"Sign in":"Create account"}</button>
        </p>
      </div>
    </div>
  );
}

// ── Premium Modal ─────────────────────────────────────────────────────────────
function PremiumModal({ user, onClose, onUpgrade }: { user: C360User|null; onClose: ()=>void; onUpgrade: ()=>void }) {
  const [paying, setPaying] = useState(false);
  const doUpgrade = () => {
    setPaying(true);
    setTimeout(() => {
      if (user) upgradeUser(user.id);
      onUpgrade();
      onClose();
    }, 1800);
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-violet-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={20}/>
            <h2 className="text-lg font-bold text-white">Upgrade to Premium</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="bg-gradient-to-br from-violet-900/50 to-indigo-900/50 border border-violet-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-black text-white">₹500</span>
            <span className="text-gray-400 text-sm mb-1">/year</span>
          </div>
          <p className="text-gray-400 text-xs">That's less than ₹42/month. Unlock your full potential.</p>
        </div>
        <div className="space-y-2 mb-5">
          {[
            { icon:<Brain size={15}/>, label:"AI Profile Builder", sub:"Claude AI extracts your profile from resume/transcript" },
            { icon:<Sparkles size={15}/>, label:"AI Resume Writer", sub:"Personalized, ATS-optimized resume in seconds" },
            { icon:<Target size={15}/>, label:"Premium Internships & Placements", sub:"Exclusive opportunities not visible to free users" },
            { icon:<Heart size={15}/>, label:"1-on-1 Mentor Sessions", sub:"Book sessions with Google, Microsoft, Amazon mentors" },
            { icon:<BookOpen size={15}/>, label:"All Learning Tracks", sub:"DSA, Cloud, QA Automation, Design, DevOps" },
            { icon:<Award size={15}/>, label:"Priority Application", sub:"Your profile highlighted to recruiters" },
          ].map((f,i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="text-violet-400 mt-0.5 shrink-0">{f.icon}</div>
              <div><p className="text-sm text-white font-medium">{f.label}</p><p className="text-xs text-gray-500">{f.sub}</p></div>
            </div>
          ))}
        </div>
        <button onClick={doUpgrade} disabled={paying} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-70 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
          {paying ? <><Loader2 size={16} className="animate-spin"/>Processing...</> : <><Sparkles size={16}/>Unlock Premium — ₹500</>}
        </button>
        <p className="text-xs text-gray-600 text-center mt-2">Secure payment via Razorpay. Cancel anytime.</p>
      </div>
    </div>
  );
}

// ── Profile Builder Modal ─────────────────────────────────────────────────────
function ProfileBuilderModal({ user, onClose, onSave }: { user: C360User; onClose: ()=>void; onSave: (p: StudentProfile)=>void }) {
  const [step, setStep] = useState<"upload"|"manual"|"result">("upload");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<StudentProfile|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const runExtract = async (input: { text?: string; base64?: string; mime?: string }) => {
    setLoading(true);
    const p = await extractProfile(input);
    setLoading(false);
    if (p) { setProfile(p); setStep("result"); }
    else { alert("AI could not extract — please fill manually."); setStep("manual"); }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      runExtract({ base64: b64, mime: f.type });
    };
    reader.readAsDataURL(f);
  };

  const saveProfile = () => {
    if (!profile) return;
    localStorage.setItem(PK(user.id), JSON.stringify(profile));
    onSave(profile);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {user.premium ? <><Sparkles className="text-yellow-400" size={18}/>AI Profile Builder</> : <><FileText size={18}/>Build Your Profile</>}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-white"/></button>
        </div>

        {step === "upload" && (
          <div className="space-y-4">
            {user.premium ? (
              <>
                <p className="text-sm text-gray-400">Upload your resume or transcript — Claude AI will extract everything automatically.</p>
                <div className="border-2 border-dashed border-violet-500/40 hover:border-violet-500 rounded-xl p-8 text-center cursor-pointer transition" onClick={()=>fileRef.current?.click()}>
                  <Upload size={32} className="text-violet-400 mx-auto mb-3"/>
                  <p className="text-sm text-white font-semibold">Click to upload PDF / image</p>
                  <p className="text-xs text-gray-500 mt-1">Resume, marksheet, transcript</p>
                </div>
                <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={onFile}/>
                <div className="text-center text-gray-500 text-xs">or</div>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 h-28 resize-none" placeholder="Paste your resume text here..." value={text} onChange={e=>setText(e.target.value)}/>
                {text && <button onClick={()=>runExtract({text})} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition">{loading?<Loader2 size={14} className="animate-spin"/>:<Brain size={14}/>}Extract with AI</button>}
              </>
            ) : (
              <>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                  <Lock size={18} className="text-amber-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm text-amber-300 font-semibold">AI extraction is a Premium feature</p>
                    <p className="text-xs text-gray-400 mt-0.5">Free users can build their profile manually. Upgrade for instant AI-powered profile creation.</p>
                  </div>
                </div>
                <button onClick={()=>setStep("manual")} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition">Fill Manually</button>
              </>
            )}
          </div>
        )}

        {step === "manual" && (
          <ManualProfileForm userId={user.id} onSave={(p)=>{setProfile(p);setStep("result");}}/>
        )}

        {step === "result" && profile && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400"/>
              <p className="text-sm text-emerald-300 font-semibold">Profile built successfully!</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-white font-bold text-base">{profile.name}</p>
              <p className="text-violet-400">{profile.headline}</p>
              <p className="text-gray-400 text-xs">{profile.college} · {profile.year} · CGPA {profile.cgpa}</p>
              <div className="flex flex-wrap gap-1 pt-1">{profile.skills.slice(0,6).map(s=><span key={s} className="text-xs bg-white/10 text-gray-300 rounded px-2 py-0.5">{s}</span>)}</div>
              {profile.summary && <p className="text-xs text-gray-400 line-clamp-2 pt-1">{profile.summary}</p>}
            </div>
            <button onClick={saveProfile} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition">Save Profile</button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={36} className="text-violet-400 animate-spin"/>
            <p className="text-sm text-gray-400">Claude AI is reading your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualProfileForm({ userId, onSave }: { userId: string; onSave: (p: StudentProfile)=>void }) {
  const [f, setF] = useState({ name:"", headline:"", college:"", year:"", cgpa:"", city:"", email:"", phone:"", summary:"", skills:"", domains:"", seeking:"" });
  const save = () => {
    const p: StudentProfile = { name:f.name, headline:f.headline, college:f.college, year:f.year, cgpa:f.cgpa, contact:{city:f.city,email:f.email,phone:f.phone}, summary:f.summary, skills:f.skills.split(",").map(s=>s.trim()).filter(Boolean), domains:f.domains.split(",").map(s=>s.trim()).filter(Boolean), projects:[], education:[{degree:"",institution:f.college,year:f.year,score:f.cgpa}], certifications:[], languages:[], seeking:f.seeking.split(",").map(s=>s.trim()).filter(Boolean), preferred_cities:[f.city], achievements:[] };
    localStorage.setItem(`college360_profile_${userId}`, JSON.stringify(p));
    onSave(p);
  };
  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className={inp} placeholder="Full name" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/>
        <input className={inp} placeholder="CGPA / Percentage" value={f.cgpa} onChange={e=>setF(p=>({...p,cgpa:e.target.value}))}/>
      </div>
      <input className={inp} placeholder="Headline (e.g. B.Tech CSE · 3rd Year · NSIT)" value={f.headline} onChange={e=>setF(p=>({...p,headline:e.target.value}))}/>
      <input className={inp} placeholder="College / University" value={f.college} onChange={e=>setF(p=>({...p,college:e.target.value}))}/>
      <div className="grid grid-cols-2 gap-3">
        <input className={inp} placeholder="Email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/>
        <input className={inp} placeholder="Phone" value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/>
      </div>
      <input className={inp} placeholder="City" value={f.city} onChange={e=>setF(p=>({...p,city:e.target.value}))}/>
      <textarea className={`${inp} h-20 resize-none`} placeholder="Brief summary about yourself..." value={f.summary} onChange={e=>setF(p=>({...p,summary:e.target.value}))}/>
      <input className={inp} placeholder="Skills (comma-separated: React, Python, SQL)" value={f.skills} onChange={e=>setF(p=>({...p,skills:e.target.value}))}/>
      <input className={inp} placeholder="Seeking (e.g. SDE Intern, Data Science Role)" value={f.seeking} onChange={e=>setF(p=>({...p,seeking:e.target.value}))}/>
      <button onClick={save} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition">Save Profile</button>
    </div>
  );
}

// ── Apply / Enquiry Modal ─────────────────────────────────────────────────────
function ApplyModal({ opp, user, onClose, onNeedAuth, onNeedPremium }: { opp: Opportunity; user: C360User|null; onClose: ()=>void; onNeedAuth: ()=>void; onNeedPremium: ()=>void }) {
  if (!user) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <p className="text-white font-semibold mb-1">Sign in to apply</p>
        <p className="text-gray-400 text-sm mb-4">Create a free account to apply for opportunities.</p>
        <button onClick={()=>{onClose();onNeedAuth();}} className="w-full py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold">Create Account</button>
      </div>
    </div>
  );
  if (opp.is_premium_only && !user.premium) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <Sparkles className="text-yellow-400 mb-2" size={24}/>
        <p className="text-white font-semibold mb-1">Premium Opportunity</p>
        <p className="text-gray-400 text-sm mb-4">This opportunity is exclusive to Premium members. Upgrade for ₹500/year.</p>
        <button onClick={()=>{onClose();onNeedPremium();}} className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold">Upgrade — ₹500/year</button>
      </div>
    </div>
  );
  const mailto = `mailto:${opp.email}?subject=Application: ${encodeURIComponent(opp.title)}&body=Hi,%0A%0AI am interested in the ${encodeURIComponent(opp.title)} role at ${encodeURIComponent(opp.company)}.%0A%0AName: ${encodeURIComponent(user.name)}%0APhone: ${encodeURIComponent(user.phone)}%0A%0APlease find my profile attached.%0A%0ARegards,%0A${encodeURIComponent(user.name)}`;
  const wa = `https://wa.me/${opp.wa_number}?text=Hi+${encodeURIComponent(opp.company)}+team!+I+am+applying+for+${encodeURIComponent(opp.title)}.+My+name+is+${encodeURIComponent(user.name)},+a+college360+member.+Could+you+share+next+steps?`;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between mb-4"><h3 className="text-white font-bold">Apply Now</h3><button onClick={onClose}><X size={18} className="text-gray-400"/></button></div>
        <p className="text-sm text-gray-400 mb-1 font-semibold text-white">{opp.title}</p>
        <p className="text-xs text-gray-500 mb-4">{opp.company} · {opp.city}</p>
        <div className="space-y-3">
          <a href={mailto} className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition">
            <Mail size={18} className="text-violet-400"/><div><p className="text-sm font-semibold text-white">Apply via Email</p><p className="text-xs text-gray-500">Opens your email app</p></div>
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition">
            <Send size={18} className="text-emerald-400"/><div><p className="text-sm font-semibold text-white">WhatsApp the Recruiter</p><p className="text-xs text-gray-500">Instant message</p></div>
          </a>
        </div>
        <p className="text-xs text-gray-600 mt-3 text-center">paariwalaconnect@gmail.com will be CC'd on email applications</p>
      </div>
    </div>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────────
function OppCard({ opp, onApply }: { opp: Opportunity; onApply: (o: Opportunity)=>void }) {
  return (
    <div className="bg-white/5 hover:bg-white/8 border border-white/8 hover:border-violet-500/30 rounded-xl p-4 transition group cursor-pointer" onClick={()=>onApply(opp)}>
      <div className="flex gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${opp.logo_color} flex items-center justify-center text-white font-black text-sm shrink-0`}>{opp.company[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition leading-snug">{opp.title}</p>
            {opp.is_premium_only && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded px-1.5 py-0.5 shrink-0 flex items-center gap-1"><Lock size={9}/>PRO</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{opp.company}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${TYPE_BADGE[opp.type]}`}>{opp.type}</span>
        <span className="text-[11px] bg-white/5 text-gray-400 rounded px-2 py-0.5 flex items-center gap-1"><MapPin size={9}/>{opp.city}</span>
        {opp.duration && <span className="text-[11px] bg-white/5 text-gray-400 rounded px-2 py-0.5 flex items-center gap-1"><Clock size={9}/>{opp.duration}</span>}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{opp.desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-400">{sal(opp.stipend_min, opp.stipend_max)}</span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {opp.is_verified && <CheckCircle size={12} className="text-teal-400"/>}
          <span>{opp.spots} spot{opp.spots!==1?"s":""}</span>
          <span>by {new Date(opp.apply_by).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">{opp.skills.slice(0,3).map(s=><span key={s} className="text-[10px] bg-white/5 text-gray-500 rounded px-1.5 py-0.5">{s}</span>)}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function College360Page() {
  const [user, setUser] = useState<C360User|null>(null);
  const [profile, setProfile] = useState<StudentProfile|null>(null);
  const [mode, setMode] = useState<Mode>("student");
  const [domain, setDomain] = useState("all");
  const [city, setCity] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [applyOpp, setApplyOpp] = useState<Opportunity|null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = loadSess();
    if (u) {
      setUser(u);
      try {
        const p = localStorage.getItem(PK(u.id));
        if (p) setProfile(JSON.parse(p));
      } catch {}
    }
  }, []);

  const login = (u: C360User) => {
    setUser(u);
    setShowAuth(false);
    try {
      const p = localStorage.getItem(PK(u.id));
      if (p) setProfile(JSON.parse(p));
    } catch {}
  };

  const logout = () => { clearSess(); setUser(null); setProfile(null); };

  const upgradeDone = () => {
    const u = loadSess(); if (u) setUser(u);
  };

  const filteredOpps = MOCK_OPPS.filter(o => {
    if (domain !== "all" && o.domain !== domain) return false;
    if (city !== "All Cities" && o.city !== city && o.city !== "Remote") return false;
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white"/>
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white">College<span className="text-violet-400">360</span></span>
              <span className="hidden sm:inline text-gray-600 text-xs ml-2">by NexusOS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button onClick={()=>setShowProfile(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition">
                  <div className={`w-5 h-5 rounded ${clr(user.name)} flex items-center justify-center text-white text-[10px] font-bold`}>{user.name[0]}</div>
                  <span className="text-gray-300 text-xs hidden sm:block">{user.name.split(" ")[0]}</span>
                  {user.premium && <Sparkles size={12} className="text-yellow-400"/>}
                </button>
                {!user.premium && <button onClick={()=>setShowPremium(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-lg text-xs font-bold transition"><Sparkles size={12}/>Premium</button>}
                <button onClick={logout} className="text-gray-500 hover:text-gray-300 transition p-1.5"><LogOut size={16}/></button>
              </>
            ) : (
              <button onClick={()=>setShowAuth(true)} className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-lg text-sm font-semibold transition">Get Started Free</button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/60 via-indigo-950/40 to-transparent"/>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none"/>
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={13} className="text-violet-400"/>
            <span className="text-xs text-violet-300 font-semibold">AI-powered career launch for college students</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 leading-tight">
            Your Career,<br/>
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 text-transparent bg-clip-text">Launched Right.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Find internships, campus placements, and mentors. Build an AI-powered profile. Learn in-demand skills.
            Everything a college student needs — in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            {user ? (
              <button onClick={()=>setShowProfile(true)} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-sm font-bold transition flex items-center gap-2 justify-center">
                <Brain size={16}/>{profile ? "View My Profile" : "Build My Profile"}
              </button>
            ) : (
              <button onClick={()=>setShowAuth(true)} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-sm font-bold transition flex items-center gap-2 justify-center">
                <Rocket size={16}/>Start Free — No credit card
              </button>
            )}
            <button onClick={()=>document.getElementById("opportunities")?.scrollIntoView({behavior:"smooth"})} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition flex items-center gap-2 justify-center">
              <Briefcase size={16}/>Browse Opportunities
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { n:"2,400+", l:"Students" },
              { n:"180+", l:"Companies" },
              { n:"850+", l:"Placements" },
              { n:"48", l:"Learning Hours" },
            ].map(s => (
              <div key={s.l} className="bg-white/5 border border-white/5 rounded-xl py-3 px-2">
                <p className="text-2xl font-black text-white">{s.n}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interest / Domain Picker ── */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {DOMAINS.map(d => (
              <button key={d.id} onClick={()=>setDomain(d.id)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition border ${domain===d.id?"bg-violet-600 border-violet-600 text-white":"bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"}`}>{d.label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mode Toggle ── */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 w-fit">
          <button onClick={()=>setMode("student")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${mode==="student"?"bg-violet-600 text-white":"text-gray-400 hover:text-white"}`}><GraduationCap size={15}/>I am a Student</button>
          <button onClick={()=>setMode("recruiter")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${mode==="recruiter"?"bg-indigo-600 text-white":"text-gray-400 hover:text-white"}`}><Building2 size={15}/>I am a Recruiter</button>
        </div>
      </div>

      {mode === "student" && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* ── Opportunities Browser ── */}
          <div id="opportunities" className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block w-52 shrink-0 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Type</p>
                {[["all","All Types"],["internship","Internship"],["placement","Placement"],["job","Job"],["freelance","Freelance"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setTypeFilter(v)} className={`block w-full text-left text-xs px-2 py-1.5 rounded-lg transition ${typeFilter===v?"bg-violet-600/20 text-violet-300":"text-gray-400 hover:text-white"}`}>{l}</button>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">City</p>
                {CITIES.map(c=>(
                  <button key={c} onClick={()=>setCity(c)} className={`block w-full text-left text-xs px-2 py-1.5 rounded-lg transition ${city===c?"bg-violet-600/20 text-violet-300":"text-gray-400 hover:text-white"}`}>{c}</button>
                ))}
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1 min-w-0">
              {/* Search + profile CTA */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" placeholder="Search opportunities, companies..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                {user && !profile && (
                  <button onClick={()=>setShowProfile(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-xl text-sm font-semibold text-violet-300 transition">
                    <Plus size={15}/>Build Profile
                  </button>
                )}
              </div>

              {profile && (
                <div className="mb-4 bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${clr(profile.name)} flex items-center justify-center text-white font-black shrink-0`}>{profile.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{profile.name}</p>
                    <p className="text-xs text-gray-400">{profile.headline || `${profile.college} · ${profile.year}`}</p>
                  </div>
                  <button onClick={()=>setShowProfile(true)} className="text-xs text-violet-400 hover:text-violet-300 shrink-0">Edit</button>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{filteredOpps.length} opportunities {domain!=="all"?`in ${DOMAINS.find(d=>d.id===domain)?.label}`:""}</p>
                <div className="flex lg:hidden gap-1">
                  {[["internship","Int."],["placement","Plmt"],["job","Job"],["freelance","Free"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setTypeFilter(typeFilter===v?"all":v)} className={`text-[10px] px-2 py-1 rounded ${typeFilter===v?"bg-violet-600 text-white":"bg-white/5 text-gray-400"}`}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {filteredOpps.map(o => <OppCard key={o.id} opp={o} onApply={setApplyOpp}/>)}
                {filteredOpps.length === 0 && (
                  <div className="col-span-2 text-center py-16 text-gray-600">
                    <Search size={40} className="mx-auto mb-3 opacity-40"/>
                    <p>No opportunities found. Try a different filter.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Mentors ── */}
          <div className="mt-14">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white">Industry Mentors</h2>
                <p className="text-xs text-gray-500 mt-0.5">1-on-1 sessions with professionals from top companies</p>
              </div>
              {!user?.premium && <button onClick={()=>setShowPremium(true)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Lock size={11}/>Unlock all</button>}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_MENTORS.filter(m => domain === "all" || m.domain === domain).map(mentor => (
                <div key={mentor.id} className="bg-white/5 border border-white/8 rounded-xl p-4 hover:border-violet-500/30 transition">
                  <div className="flex gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl ${mentor.avatar_color} flex items-center justify-center text-white font-black text-lg shrink-0`}>{mentor.name[0]}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{mentor.name}</p>
                      <p className="text-xs text-gray-400">{mentor.role} · {mentor.company}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={11} className="text-yellow-400 fill-yellow-400"/>
                        <span className="text-xs text-gray-400">{mentor.rating} · {mentor.sessions} sessions</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-3">{mentor.skills.slice(0,3).map(s=><span key={s} className="text-[10px] bg-white/5 text-gray-500 rounded px-1.5 py-0.5">{s}</span>)}</div>
                  {mentor.is_premium && !user?.premium ? (
                    <button onClick={()=>setShowPremium(true)} className="w-full py-1.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 rounded-lg text-xs text-violet-400 font-semibold flex items-center justify-center gap-1 transition"><Lock size={11}/>Book Session (Premium)</button>
                  ) : (
                    <a href={user ? `https://wa.me/${mentor.wa_number}?text=Hi+${encodeURIComponent(mentor.name)}!+I+found+you+on+College360+and+would+love+a+mentorship+session.+I+am+a+${encodeURIComponent(user?.college||"college")}+student.` : "#"}
                       onClick={!user ? ()=>setShowAuth(true) : undefined}
                       target="_blank" rel="noopener noreferrer"
                       className="block w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-semibold text-center transition">Book via WhatsApp</a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Learning Tracks ── */}
          <div className="mt-14">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white">Learning Tracks</h2>
                <p className="text-xs text-gray-500 mt-0.5">Structured paths to job-ready skills</p>
              </div>
              {!user?.premium && <button onClick={()=>setShowPremium(true)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Sparkles size={11}/>Premium unlocks all</button>}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LEARN_TRACKS.map(track => (
                <div key={track.id} className={`border rounded-xl p-4 transition ${track.is_premium && !user?.premium ? "border-white/5 opacity-70" : "border-white/8 hover:border-violet-500/30"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${track.bg} rounded-xl flex items-center justify-center ${track.color}`}>{track.icon}</div>
                    <div className="flex items-center gap-1">
                      {track.is_premium ? (
                        user?.premium ? <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded px-1.5 py-0.5 flex items-center gap-1"><Sparkles size={9}/>PRO</span>
                        : <button onClick={()=>setShowPremium(true)} className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded px-1.5 py-0.5 flex items-center gap-1 hover:bg-yellow-500/20 transition"><Lock size={9}/>PRO</button>
                      ) : <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">FREE</span>}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">{track.title}</p>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{track.desc}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BookOpen size={11}/>{track.modules} modules</span>
                    <span className="flex items-center gap-1"><Clock size={11}/>{track.hours}h</span>
                    <span>{track.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Premium CTA Banner ── */}
          {!user?.premium && (
            <div className="mt-14 relative overflow-hidden bg-gradient-to-r from-violet-900/60 to-indigo-900/60 border border-violet-500/20 rounded-2xl p-8 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-500/10 blur-[60px] rounded-full pointer-events-none"/>
              <div className="relative">
                <Sparkles className="text-yellow-400 mx-auto mb-3" size={32}/>
                <h2 className="text-2xl font-black text-white mb-2">Unlock Your Full Potential</h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">Get AI resume building, premium internships, mentor sessions, and all learning tracks for just <span className="text-white font-bold">₹500/year</span> — less than a pizza.</p>
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {["AI Profile Builder","Premium Opportunities","1-on-1 Mentors","All Learning Tracks","Priority Visibility","ATS Resume"].map(f=>(
                    <span key={f} className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 border border-white/10 rounded-full px-3 py-1"><CheckCircle size={11} className="text-violet-400"/>{f}</span>
                  ))}
                </div>
                <button onClick={()=>user?setShowPremium(true):setShowAuth(true)} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-bold transition flex items-center gap-2 mx-auto">
                  <Sparkles size={16}/>Upgrade to Premium — ₹500/year
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Recruiter View ── */}
      {mode === "recruiter" && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" placeholder="Search students by skill, college, domain..."/>
            </div>
            <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition">
              <Plus size={15}/>Post Opportunity
            </button>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white mb-1">Available Talent</h2>
            <p className="text-xs text-gray-500">Verified college students actively seeking opportunities</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_STUDENTS.map(st => (
              <div key={st.id} className="bg-white/5 border border-white/8 hover:border-indigo-500/30 rounded-xl p-4 transition">
                <div className="flex gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-2xl ${st.color} flex items-center justify-center text-white font-black text-lg shrink-0`}>{st.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{st.name}</p>
                    <p className="text-xs text-gray-400">{st.college}</p>
                    <p className="text-xs text-gray-500">{st.year} · CGPA {st.cgpa}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">{st.skills.map(s=><span key={s} className="text-[10px] bg-white/5 text-gray-400 rounded px-1.5 py-0.5">{s}</span>)}</div>
                <div className="flex flex-wrap gap-1 mb-3">{st.seeking.map(s=><span key={s} className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5">{s}</span>)}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1 ${st.available?"text-emerald-400":"text-gray-500"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${st.available?"bg-emerald-400":"bg-gray-600"}`}/>
                    {st.available ? "Available" : "Placed"}
                  </span>
                  <button onClick={()=>user?window.open(`mailto:?subject=Opportunity from College360 for ${encodeURIComponent(st.name)}`):setShowAuth(true)} className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Contact</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-white/5 border border-white/8 rounded-2xl p-6 text-center">
            <Building2 className="text-indigo-400 mx-auto mb-3" size={28}/>
            <h3 className="text-white font-bold mb-1">Post Your Campus Drive or Internship</h3>
            <p className="text-gray-400 text-sm mb-4">Reach 2,400+ verified college students. Free for the first posting.</p>
            <a href={`mailto:college360@nexusos.in?subject=Post%20Opportunity%20on%20College360&body=Company%20Name:%0AOpportunity%20Title:%0AType%20(internship/placement/job):%0AStipend/CTC:%0ALocation:%0ARequired%20Skills:%0ADeadline:%0A%0AContact%20Person:%0APhone:%0A`} className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition">
              <Mail size={15}/>Email Us to Post
            </a>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 mt-16 py-8 text-center">
        <p className="text-gray-600 text-xs">College360 by NexusOS · Built with Claude AI · <a href="mailto:college360@nexusos.in" className="text-violet-500 hover:underline">college360@nexusos.in</a></p>
      </footer>

      {/* ── Modals ── */}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={login}/>}
      {showPremium && <PremiumModal user={user} onClose={()=>setShowPremium(false)} onUpgrade={upgradeDone}/>}
      {showProfile && user && <ProfileBuilderModal user={user} onClose={()=>setShowProfile(false)} onSave={p=>{setProfile(p);setShowProfile(false);}}/>}
      {applyOpp && <ApplyModal opp={applyOpp} user={user} onClose={()=>setApplyOpp(null)} onNeedAuth={()=>setShowAuth(true)} onNeedPremium={()=>setShowPremium(true)}/>}
    </div>
  );
}
