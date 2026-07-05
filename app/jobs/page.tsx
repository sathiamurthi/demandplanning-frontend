"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, MapPin, Briefcase, Users, Building2, ChevronDown,
  X, Send, Phone, Mail, Bookmark, ExternalLink, Sparkles,
  Clock, IndianRupee, Globe, Wifi, Star, CheckCircle,
  Plus, ArrowRight, Menu, Bell, Filter, Loader2,
  GraduationCap, Code2, Heart, Zap, BookOpen,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Mode = "jobs" | "talent";
type JobType = "all" | "permanent" | "contract" | "remote" | "parttime";

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

// ── Mock data (replaced by real API when backend has job_type listings) ──────
const MOCK_JOBS: Job[] = [
  { id:"j1", title:"Mathematics Teacher (Grade 8-12)", org:"Greenwood International School", city:"Bengaluru", state:"Karnataka", type:"permanent", category:"Education", salary_min:40000, salary_max:65000, requirements:"B.Ed + M.Sc Mathematics, 3+ years CBSE/ICSE", description:"We are looking for an experienced Maths teacher to join our secondary section. Strong conceptual teaching and result-oriented approach required.", tags:["CBSE","Mathematics","ICSE"], phone:"9880001234", email:"hr@greenwood.edu.in", posted:"2026-07-05", enhanced:true, experience_years:3, is_verified:true },
  { id:"j2", title:"React / Node.js Developer", org:"TechNova Solutions Pvt Ltd", city:"Bengaluru", state:"Karnataka", type:"remote", category:"IT", salary_min:80000, salary_max:140000, requirements:"3+ years React + Node.js, REST APIs, PostgreSQL", description:"Join our product team building SaaS applications. Remote-first culture, flexible hours, great team.", tags:["React","Node.js","Remote","SaaS"], phone:"9900112233", email:"careers@technova.io", posted:"2026-07-04", enhanced:true, experience_years:3, is_verified:true },
  { id:"j3", title:"College Lecturer — Commerce & Accounting", org:"Sri Vidya Degree College", city:"Mysuru", state:"Karnataka", type:"permanent", category:"Education", salary_min:30000, salary_max:50000, requirements:"M.Com + NET/SLET preferred, 2+ years teaching experience", description:"Applications invited for Commerce lecturer position. Strong fundamentals in Accountancy and Business Studies required.", tags:["Commerce","Accountancy","NET"], phone:"9845556789", email:"principal@srividya.ac.in", posted:"2026-07-03", experience_years:2 },
  { id:"j4", title:"Python / Data Science Trainer", org:"Upskill Academy", city:"Hyderabad", state:"Telangana", type:"contract", category:"EdTech", salary_min:50000, salary_max:90000, requirements:"Strong Python, ML/AI fundamentals, prior training experience preferred", description:"Deliver Python and Data Science bootcamps (online + offline). Contract role with performance bonus.", tags:["Python","Data Science","Training","Hybrid"], phone:"9700445566", email:"hr@upskill.in", posted:"2026-07-02", enhanced:true, experience_years:2 },
  { id:"j5", title:"Chartered Accountant — Finance Manager", org:"Meridian Retail Pvt Ltd", city:"Chennai", state:"Tamil Nadu", type:"permanent", category:"Finance", salary_min:90000, salary_max:130000, requirements:"CA qualified, 5+ years post-qualification, GST/TDS expertise", description:"Full ownership of accounts, audit, compliance, and MIS reporting. Growth-oriented role in expanding retail company.", tags:["CA","Finance","GST","TDS"], phone:"9841122334", email:"hr@meridianretail.com", posted:"2026-07-01", experience_years:5, is_verified:true },
  { id:"j6", title:"Science Teacher (Physics & Chemistry)", org:"DPS Modern School", city:"Pune", state:"Maharashtra", type:"permanent", category:"Education", salary_min:45000, salary_max:70000, requirements:"B.Sc + B.Ed, CBSE curriculum experience preferred", description:"Well-reputed CBSE school seeking enthusiastic Science teacher for Classes 9-12. Lab handling experience is a plus.", tags:["Physics","Chemistry","CBSE","Labs"], phone:"9823456789", email:"recruitment@dpsmodern.in", posted:"2026-06-30", experience_years:2 },
  { id:"j7", title:"UI/UX Designer — Mobile Apps", org:"AppCraft Studio", city:"Mumbai", state:"Maharashtra", type:"remote", category:"IT", salary_min:60000, salary_max:100000, requirements:"3+ years Figma, mobile UX patterns, design systems", description:"Design beautiful, user-centric mobile experiences. Work with product and engineering teams closely.", tags:["Figma","UI/UX","Remote","Mobile"], phone:"9821334455", email:"design@appcraft.io", posted:"2026-06-29", enhanced:true, experience_years:3 },
  { id:"j8", title:"English Language Trainer", org:"GlobalSpeak Institute", city:"Delhi", state:"Delhi", type:"parttime", category:"EdTech", salary_min:20000, salary_max:35000, requirements:"Excellent spoken English, IELTS/TOEFL coaching experience preferred", description:"Part-time evening batches for working professionals. Online + in-center. Flexible hours.", tags:["English","IELTS","Part-time","Online"], phone:"9810998877", email:"jobs@globalspeak.in", posted:"2026-06-28", experience_years:1 },
];

const MOCK_SEEKERS: Seeker[] = [
  { id:"s1", name:"Priya Sharma", headline:"CBSE Maths & Physics Teacher · 8 years · Bengaluru", city:"Bengaluru", state:"Karnataka", qualifications:["B.Ed","M.Sc Mathematics"], subjects:["Mathematics","Physics","Science"], experience_years:8, salary_min:45000, salary_max:65000, job_mode_pref:"fulltime", summary:"Highly experienced CBSE teacher with 8 years at reputed schools. Result-oriented, creative lesson planning, excellent track record in board results.", skills:["CBSE","Lesson Planning","Online Teaching","Result Analytics"], phone:"9845001122", email:"priya.sharma@gmail.com", posted:"2026-07-05", available:true },
  { id:"s2", name:"Rahul Verma", headline:"Full-Stack Developer · 5 years · React + Node · Open to Remote", city:"Pune", state:"Maharashtra", qualifications:["B.Tech (CS)","AWS Certified"], subjects:["React","Node.js","PostgreSQL","DevOps"], experience_years:5, salary_min:100000, salary_max:150000, job_mode_pref:"remote", summary:"5 years building scalable SaaS products. Strong in full-stack JS, cloud infrastructure. Led a team of 4 at previous startup.", skills:["React","Next.js","Node.js","PostgreSQL","AWS","Docker"], phone:"9823445566", email:"rahul.verma@outlook.com", posted:"2026-07-04", available:true },
  { id:"s3", name:"Deepa Menon", headline:"Commerce Lecturer · NET Qualified · 6 years · Seeking Degree College", city:"Mysuru", state:"Karnataka", qualifications:["M.Com","UGC-NET","SET"], subjects:["Accountancy","Business Studies","Economics"], experience_years:6, salary_min:35000, salary_max:55000, job_mode_pref:"fulltime", summary:"NET-qualified Commerce lecturer with 6 years at degree colleges. Published 3 research papers. Excellent academic record.", skills:["Accountancy","Cost Accounting","GST","Research","Tally"], phone:"9845778899", email:"deepa.menon@gmail.com", posted:"2026-07-03", available:true },
  { id:"s4", name:"Arjun Nair", headline:"Data Scientist · Python / ML · 4 years · Hybrid", city:"Hyderabad", state:"Telangana", qualifications:["M.Tech (Data Science)","Google ML Certified"], subjects:["Python","Machine Learning","NLP","Power BI"], experience_years:4, salary_min:90000, salary_max:130000, job_mode_pref:"hybrid", summary:"Data scientist with 4 years experience at fintech startup. Built fraud detection system, customer churn models. Strong storytelling with data.", skills:["Python","TensorFlow","Scikit-learn","SQL","Power BI","LLMs"], phone:"9700223344", email:"arjun.nair@gmail.com", posted:"2026-07-02", available:false },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 100000 ? `${(n/100000).toFixed(1)}L` : `${(n/1000).toFixed(0)}k`;
const salary = (min: number, max: number) => `₹${fmt(min)}–${fmt(max)}/mo`;
const avatarBg = ["bg-teal-600","bg-emerald-600","bg-blue-600","bg-violet-600","bg-rose-600","bg-amber-600","bg-cyan-600","bg-indigo-600"];
const colorFor = (s: string) => avatarBg[s.charCodeAt(0) % avatarBg.length];

const JOB_TYPE_COLORS: Record<string, string> = {
  permanent: "bg-teal-100 text-teal-700",
  contract:  "bg-amber-100 text-amber-700",
  remote:    "bg-blue-100 text-blue-700",
  parttime:  "bg-purple-100 text-purple-700",
};

const CATEGORIES = ["All","Education","IT","EdTech","Finance","Healthcare","Marketing","Engineering"];
const CITIES = ["All Cities","Bengaluru","Mumbai","Delhi","Hyderabad","Chennai","Pune","Mysuru","Kolkata"];

// ── Sub-components ───────────────────────────────────────────────────────────
function JobCard({ job, onApply }: { job: Job; onApply: (j: Job) => void }) {
  const initials = job.org.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl ${colorFor(job.org)} flex items-center justify-center text-white font-black text-sm shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px] group-hover:text-teal-700 transition-colors leading-tight">{job.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <Building2 size={12}/> {job.org}
                {job.is_verified && <CheckCircle size={11} className="text-teal-500 ml-1"/>}
              </p>
            </div>
            <button className="text-gray-300 hover:text-teal-500 shrink-0 transition-colors"><Bookmark size={16}/></button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${JOB_TYPE_COLORS[job.type]}`}>
              {job.type}
            </span>
            {job.enhanced && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-orange-100 text-orange-700">Featured</span>}
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><MapPin size={10}/>{job.city}</span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><IndianRupee size={10}/>{salary(job.salary_min, job.salary_max)}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {job.tags.slice(0,4).map(t=>(
              <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">{job.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={10}/> {job.posted}</span>
        <button onClick={() => onApply(job)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2 rounded-lg transition-all active:scale-95">
          Apply Now
        </button>
      </div>
    </div>
  );
}

function SeekerCard({ s, onContact }: { s: Seeker; onContact: (s: Seeker) => void }) {
  const initials = s.name.split(" ").map(w=>w[0]).join("").toUpperCase();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all group">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${colorFor(s.name)} flex items-center justify-center text-white font-black text-sm shrink-0 relative`}>
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
              {s.available?"Available":"Busy"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {s.subjects.slice(0,4).map(t=>(
              <span key={t} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">{t}</span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-2.5 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><IndianRupee size={10}/>{salary(s.salary_min, s.salary_max)}</span>
            <span className="flex items-center gap-1"><MapPin size={10}/>{s.city}</span>
            <span className="flex items-center gap-1"><Briefcase size={10}/>{s.experience_years}yr exp</span>
            <span className="flex items-center gap-1"><Wifi size={10}/>{s.job_mode_pref}</span>
          </div>

          <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">{s.summary}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={10}/> {s.posted}</span>
        <button onClick={() => onContact(s)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2 rounded-lg transition-all active:scale-95">
          Contact Now
        </button>
      </div>
    </div>
  );
}

// ── Post Job Modal ────────────────────────────────────────────────────────────
function PostJobModal({ onClose, onSuccess }: { onClose:()=>void; onSuccess:(j:Job)=>void }) {
  const [form, setForm] = useState({
    title:"", org:"", city:"", type:"permanent", category:"Education",
    salary_min:"", salary_max:"", description:"", requirements:"",
    phone:"", email:"", experience_years:"1",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p=>({...p,[k]:v}));

  const submit = async () => {
    if (!form.title || !form.org || !form.city || !form.phone) return;
    setSaving(true);
    try {
      await fetch("/v1/public/listings", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          type: `job_${form.category.toLowerCase()}`,
          name: form.title,
          mode: "provider",
          phone: form.phone,
          email: form.email,
          city: form.city,
          description: form.description,
          rate_info: `₹${form.salary_min}–${form.salary_max}/month`,
          services: {
            org: form.org, job_type: form.type, category: form.category,
            salary_min: parseInt(form.salary_min)||0, salary_max: parseInt(form.salary_max)||0,
            requirements: form.requirements, experience_years: parseInt(form.experience_years)||1,
            tags: [form.category, form.type],
          },
          available_now: true,
          source: "app",
        }),
      });
    } catch {}
    // Optimistically show the new job
    const newJob: Job = {
      id: `new-${Date.now()}`, title: form.title, org: form.org,
      city: form.city, state: "", type: form.type as any,
      category: form.category, salary_min: parseInt(form.salary_min)||0,
      salary_max: parseInt(form.salary_max)||0, requirements: form.requirements,
      description: form.description, tags: [form.category, form.type],
      phone: form.phone, email: form.email, posted: "Just now",
      experience_years: parseInt(form.experience_years)||1, enhanced: false,
    };
    setSaving(false);
    onSuccess(newJob);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-black text-gray-900 text-lg">Post a Job</h2>
            <p className="text-xs text-gray-500">Free for MVP · Reach thousands of professionals</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Job Title *</label>
              <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Senior Maths Teacher, React Developer"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Organisation *</label>
              <input value={form.org} onChange={e=>set("org",e.target.value)} placeholder="School / Company name"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">City *</label>
              <input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Bengaluru, Mumbai…"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Job Type</label>
              <select value={form.type} onChange={e=>set("type",e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="parttime">Part-time</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={e=>set("category",e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Min Salary (₹/month)</label>
              <input type="number" value={form.salary_min} onChange={e=>set("salary_min",e.target.value)} placeholder="35000"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Max Salary (₹/month)</label>
              <input type="number" value={form.salary_max} onChange={e=>set("salary_max",e.target.value)} placeholder="65000"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Min Experience (years)</label>
              <input type="number" value={form.experience_years} onChange={e=>set("experience_years",e.target.value)} placeholder="2"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Contact Phone *</label>
              <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="9XXXXXXXXX"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Contact Email</label>
              <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="hr@company.com"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Requirements</label>
              <input value={form.requirements} onChange={e=>set("requirements",e.target.value)} placeholder="B.Ed + 3yr experience, CBSE curriculum…"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Job Description</label>
              <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3} placeholder="Describe the role, culture, responsibilities…"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"/>
            </div>
          </div>
          <button onClick={submit} disabled={saving || !form.title || !form.org || !form.phone}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
            {saving ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
            {saving ? "Posting…" : "Post Job · Free"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Profile Modal ──────────────────────────────────────────────────────
function CreateProfileModal({ onClose, onSuccess }: { onClose:()=>void; onSuccess:(s:Seeker)=>void }) {
  const [step, setStep] = useState<"form"|"ai"|"preview">("form");
  const [resumeText, setResumeText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:"", headline:"", city:"", phone:"", email:"",
    experience_years:"1", salary_min:"", salary_max:"",
    qualifications:"", subjects:"", skills:"", summary:"",
    job_mode_pref:"fulltime",
  });
  const set = (k:string, v:string) => setForm(p=>({...p,[k]:v}));

  const extractWithAI = async () => {
    if (!resumeText.trim()) return;
    setExtracting(true);
    try {
      const r = await fetch("/api/extract-resume", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text: resumeText }),
      });
      const d = await r.json();
      if (d.success && d.data) {
        const x = d.data;
        setForm(p=>({...p,
          name: x.name || p.name,
          headline: x.headline || p.headline,
          qualifications: (x.qualifications||[]).join(", "),
          subjects: (x.subjects||[]).join(", "),
          skills: (x.skills||[]).join(", "),
          experience_years: String(x.experience_years || p.experience_years),
          summary: x.experience_summary || p.summary,
          salary_min: String(x.salary_min || p.salary_min),
          salary_max: String(x.salary_max || p.salary_max),
        }));
        setStep("preview");
      }
    } catch {}
    setExtracting(false);
    if (step === "ai") setStep("preview");
  };

  const save = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await fetch("/v1/public/listings", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          type: "job_seeker",
          name: form.name,
          mode: "seeker",
          phone: form.phone, email: form.email,
          city: form.city,
          description: form.summary,
          rate_info: `₹${form.salary_min}–${form.salary_max}/month`,
          services: {
            headline: form.headline,
            qualifications: form.qualifications.split(",").map(s=>s.trim()),
            subjects: form.subjects.split(",").map(s=>s.trim()),
            skills: form.skills.split(",").map(s=>s.trim()),
            experience_years: parseInt(form.experience_years)||1,
            salary_min: parseInt(form.salary_min)||0,
            salary_max: parseInt(form.salary_max)||0,
            job_mode_pref: form.job_mode_pref,
          },
          available_now: true,
          source: "app",
        }),
      });
    } catch {}
    const newSeeker: Seeker = {
      id: `ns-${Date.now()}`, name: form.name, headline: form.headline,
      city: form.city, state:"",
      qualifications: form.qualifications.split(",").map(s=>s.trim()).filter(Boolean),
      subjects: form.subjects.split(",").map(s=>s.trim()).filter(Boolean),
      experience_years: parseInt(form.experience_years)||1,
      salary_min: parseInt(form.salary_min)||0, salary_max: parseInt(form.salary_max)||0,
      job_mode_pref: form.job_mode_pref, summary: form.summary,
      skills: form.skills.split(",").map(s=>s.trim()).filter(Boolean),
      phone: form.phone, email: form.email, posted:"Just now", available:true,
    };
    setSaving(false);
    onSuccess(newSeeker);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2"><Sparkles size={18} className="text-teal-500"/>Create Talent Profile</h2>
            <p className="text-xs text-gray-500">Paste your resume for AI extraction or fill manually</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16}/></button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-gray-100">
          {(["form","ai","preview"] as const).map((s,i)=>(
            <button key={s} onClick={()=>setStep(s)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition ${step===s?"text-teal-600 border-b-2 border-teal-600":"text-gray-400 hover:text-gray-600"}`}>
              {i+1}. {s==="form"?"Manual":s==="ai"?"AI Extract":"Preview"}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {step === "ai" && (
            <div className="space-y-3">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                <p className="text-xs text-teal-700 font-medium">📋 Paste your resume text below — Claude AI will extract qualifications, subjects, skills, salary expectation automatically.</p>
              </div>
              <textarea value={resumeText} onChange={e=>setResumeText(e.target.value)} rows={12}
                placeholder="Paste your full resume text here (from Word/PDF copy-paste)…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none font-mono text-xs leading-relaxed"/>
              <button onClick={extractWithAI} disabled={!resumeText.trim()||extracting}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                {extracting ? <><Loader2 size={16} className="animate-spin"/>Extracting with AI…</> : <><Sparkles size={16}/>Extract with AI · Auto-fill</>}
              </button>
            </div>
          )}

          {(step === "form" || step === "preview") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name *</label>
                <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Priya Sharma"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">City</label>
                <input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Bengaluru"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Professional Headline</label>
                <input value={form.headline} onChange={e=>set("headline",e.target.value)} placeholder="CBSE Maths Teacher · 8 years · Bengaluru"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Phone *</label>
                <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="9XXXXXXXXX"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email</label>
                <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@email.com"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Experience (years)</label>
                <input type="number" value={form.experience_years} onChange={e=>set("experience_years",e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Preferred Mode</label>
                <select value={form.job_mode_pref} onChange={e=>set("job_mode_pref",e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                  <option value="fulltime">Full-time</option>
                  <option value="parttime">Part-time</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Min Expected (₹/mo)</label>
                <input type="number" value={form.salary_min} onChange={e=>set("salary_min",e.target.value)} placeholder="40000"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Max Expected (₹/mo)</label>
                <input type="number" value={form.salary_max} onChange={e=>set("salary_max",e.target.value)} placeholder="65000"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Qualifications (comma-separated)</label>
                <input value={form.qualifications} onChange={e=>set("qualifications",e.target.value)} placeholder="B.Ed, M.Sc Mathematics, UGC-NET"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Subjects / Skills (comma-separated)</label>
                <input value={form.subjects} onChange={e=>set("subjects",e.target.value)} placeholder="Mathematics, Physics, Online Teaching"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Professional Summary</label>
                <textarea value={form.summary} onChange={e=>set("summary",e.target.value)} rows={3}
                  placeholder="Brief summary of your experience and strengths…"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"/>
              </div>
            </div>
          )}

          {(step === "form" || step === "preview") && (
            <button onClick={save} disabled={saving || !form.name || !form.phone}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
              {saving ? "Publishing…" : "Publish Talent Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Apply / Contact Modal ─────────────────────────────────────────────────────
function ApplyModal({ target, type, onClose }: { target: Job|Seeker; type:"job"|"talent"; onClose:()=>void }) {
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const isJob = type === "job";
  const job   = isJob ? target as Job   : null;
  const seeker = !isJob ? target as Seeker : null;

  const title  = isJob ? job!.title : seeker!.name;
  const org    = isJob ? job!.org   : seeker!.headline;
  const tPhone = target.phone;

  const waMsg  = isJob
    ? `Hi, I saw your job posting for *${title}* at *${org}* on Nexus Talent.\n\nMy name is ${name||"[Name]"} and I am interested in applying.\n\n${msg}`
    : `Hi ${title}, I found your profile on Nexus Talent and would like to connect regarding a job opportunity.\n\n${msg}`;

  const waLink = `https://wa.me/91${tPhone}?text=${encodeURIComponent(waMsg)}`;

  const sendEmail = async () => {
    if (!name.trim()) return;
    setSending(true);
    try {
      await fetch("/api/send-email", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          to: target.email,
          toName: isJob ? org : title,
          subject: isJob ? `Job Application: ${title}` : `Talent Inquiry: ${name}`,
          text: waMsg,
        }),
      });
    } catch {}
    setSent(true); setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900">{isJob?"Apply for Job":"Contact Talent"}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16}/></button>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
            <p className="font-bold text-gray-900 text-sm">{title}</p>
            <p className="text-xs text-gray-500">{org}</p>
          </div>

          {!sent ? (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Your Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Your Phone</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9XXXXXXXXX"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Message</label>
                <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3}
                  placeholder={isJob ? "Briefly introduce yourself and your experience…" : "Describe the opportunity or role you want to discuss…"}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                {target.email && (
                  <button onClick={sendEmail} disabled={sending}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition">
                    {sending ? <Loader2 size={14} className="animate-spin"/> : <Mail size={14}/>}
                    Email
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-2">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-500"/>
              </div>
              <p className="font-bold text-gray-900">Message Sent!</p>
              <p className="text-xs text-gray-500">The {isJob?"employer":"candidate"} will receive your message via email.</p>
              <button onClick={onClose} className="mt-3 text-sm text-teal-600 font-bold hover:underline">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [mode, setMode]               = useState<Mode>("jobs");
  const [jobs, setJobs]               = useState<Job[]>(MOCK_JOBS);
  const [seekers, setSeekers]         = useState<Seeker[]>(MOCK_SEEKERS);
  const [keyword, setKeyword]         = useState("");
  const [cityFilter, setCityFilter]   = useState("All Cities");
  const [catFilter, setCatFilter]     = useState("All");
  const [typeFilter, setTypeFilter]   = useState<JobType>("all");
  const [showPostJob, setShowPostJob] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [applyTarget, setApplyTarget] = useState<{target:Job|Seeker; type:"job"|"talent"}|null>(null);

  // Stats
  const stats = { jobs: jobs.length, seekers: seekers.length, cities: [...new Set(jobs.map(j=>j.city))].length };

  // Filtered
  const filteredJobs = jobs.filter(j => {
    const kw = keyword.toLowerCase();
    const matchKw = !kw || j.title.toLowerCase().includes(kw) || j.org.toLowerCase().includes(kw) || j.tags.some(t=>t.toLowerCase().includes(kw));
    const matchCity = cityFilter === "All Cities" || j.city === cityFilter;
    const matchCat  = catFilter === "All" || j.category === catFilter;
    const matchType = typeFilter === "all" || j.type === typeFilter;
    return matchKw && matchCity && matchCat && matchType;
  });

  const filteredSeekers = seekers.filter(s => {
    const kw = keyword.toLowerCase();
    const matchKw = !kw || s.name.toLowerCase().includes(kw) || s.subjects.some(x=>x.toLowerCase().includes(kw)) || s.skills.some(x=>x.toLowerCase().includes(kw));
    const matchCity = cityFilter === "All Cities" || s.city === cityFilter;
    return matchKw && matchCity;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-white"/>
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">Nexus Talent</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none">Careers · India</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button onClick={()=>setMode("jobs")} className={`hover:text-teal-600 transition ${mode==="jobs"?"text-teal-600 font-bold":""}`}>Find Jobs</button>
            <button onClick={()=>setMode("talent")} className={`hover:text-teal-600 transition ${mode==="talent"?"text-teal-600 font-bold":""}`}>Find Talent</button>
            <a href="#" className="hover:text-teal-600 transition">Resources</a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={()=>setShowProfile(true)}
              className="hidden sm:flex items-center gap-1.5 border border-teal-600 text-teal-600 hover:bg-teal-50 font-bold text-sm px-4 py-2 rounded-lg transition">
              <Users size={14}/> Post Resume
            </button>
            <button onClick={()=>setShowPostJob(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition">
              <Plus size={14}/> Post Job
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold mb-4 border border-white/20">
              <Star size={12} className="text-yellow-300"/> India&apos;s fastest-growing talent platform
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-3">
              {mode==="jobs" ? (<>Find Your <span className="text-yellow-300">Next Career</span><br/>Start Here.</>) : (<>Find Top <span className="text-yellow-300">Talent</span><br/>Hire Faster.</>)}
            </h1>
            <p className="text-teal-100 text-sm sm:text-base max-w-lg mx-auto">
              {mode==="jobs" ? "Browse jobs in Education, IT, Finance and more. WhatsApp-first, zero-friction apply." : "Browse verified professionals — teachers, developers, accountants, consultants."}
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search size={16} className="text-gray-400 shrink-0"/>
              <input value={keyword} onChange={e=>setKeyword(e.target.value)}
                placeholder={mode==="jobs"?"e.g. Maths Teacher, React Developer, CA…":"e.g. Physics Teacher, Python Developer…"}
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none py-2.5"/>
            </div>
            <div className="w-px bg-gray-100 hidden sm:block"/>
            <div className="flex items-center gap-2 px-3">
              <MapPin size={16} className="text-gray-400 shrink-0"/>
              <select value={cityFilter} onChange={e=>setCityFilter(e.target.value)}
                className="text-sm text-gray-700 focus:outline-none bg-transparent py-2.5 cursor-pointer">
                {CITIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition shrink-0">
              <Search size={16}/> Search
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={()=>setMode("jobs")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${mode==="jobs"?"bg-white text-teal-700":"bg-white/15 text-white hover:bg-white/25"}`}>
              <Briefcase size={14}/> Find Jobs ({stats.jobs})
            </button>
            <button onClick={()=>setMode("talent")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${mode==="talent"?"bg-white text-teal-700":"bg-white/15 text-white hover:bg-white/25"}`}>
              <Users size={14}/> Find Talent ({stats.seekers})
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
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

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar filters */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            {mode === "jobs" && (
              <>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Job Type</p>
                  {([["all","All Types"],["permanent","Permanent"],["contract","Contract"],["remote","Remote"],["parttime","Part-time"]] as [JobType,string][]).map(([v,l])=>(
                    <label key={v} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" checked={typeFilter===v} onChange={()=>setTypeFilter(v)}
                        className="w-3.5 h-3.5 accent-teal-600"/>
                      <span className="text-sm text-gray-700">{l}</span>
                    </label>
                  ))}
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">Category</p>
                  {CATEGORIES.map(c=>(
                    <button key={c} onClick={()=>setCatFilter(c)}
                      className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition ${catFilter===c?"bg-teal-50 text-teal-700 font-bold":"text-gray-600 hover:bg-gray-50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* CTA cards */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl p-5 text-white">
              <Sparkles size={20} className="mb-2"/>
              <p className="font-black text-sm mb-1">AI Resume Builder</p>
              <p className="text-teal-100 text-xs mb-3">Paste your CV — Claude extracts and formats your profile automatically.</p>
              <button onClick={()=>setShowProfile(true)}
                className="w-full bg-white text-teal-700 font-bold text-xs py-2 rounded-lg hover:bg-teal-50 transition">
                Create Profile Free →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <Building2 size={20} className="text-teal-500 mx-auto mb-2"/>
              <p className="font-bold text-gray-900 text-sm mb-1">Hiring?</p>
              <p className="text-gray-500 text-xs mb-3">Post a job and reach thousands of professionals instantly.</p>
              <button onClick={()=>setShowPostJob(true)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 rounded-lg transition">
                Post a Job Free
              </button>
            </div>
          </aside>

          {/* Cards grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-700">
                {mode==="jobs" ? `${filteredJobs.length} jobs found` : `${filteredSeekers.length} talent profiles`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Sort by:</span>
                <select className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                  <option>Recently posted</option>
                  <option>Salary: High to Low</option>
                  <option>Experience</option>
                </select>
              </div>
            </div>

            {mode === "jobs" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredJobs.length > 0
                  ? filteredJobs.map(j => <JobCard key={j.id} job={j} onApply={j=>setApplyTarget({target:j,type:"job"})}/>)
                  : <div className="col-span-2 text-center py-20 text-gray-400"><Briefcase size={40} className="mx-auto mb-3 opacity-30"/><p className="font-medium">No jobs match your search</p></div>
                }
              </div>
            )}

            {mode === "talent" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredSeekers.length > 0
                  ? filteredSeekers.map(s => <SeekerCard key={s.id} s={s} onContact={s=>setApplyTarget({target:s,type:"talent"})}/>)
                  : <div className="col-span-2 text-center py-20 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-30"/><p className="font-medium">No profiles match your search</p></div>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Briefcase size={16} className="text-white"/></div>
              <div>
                <p className="font-black text-sm">Nexus Talent</p>
                <p className="text-gray-400 text-xs">Jobs · Education · IT · Finance · India</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-white transition">About</a>
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Contact</a>
              <Link href="/explore" className="hover:text-white transition text-teal-400">← Back to Explore</Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">© 2026 Nexus Talent · Powered by Paariwala Platform</p>
        </div>
      </footer>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showPostJob  && <PostJobModal   onClose={()=>setShowPostJob(false)} onSuccess={j=>{setJobs(p=>[j,...p]);setShowPostJob(false);}}/>}
      {showProfile  && <CreateProfileModal onClose={()=>setShowProfile(false)} onSuccess={s=>{setSeekers(p=>[s,...p]);setShowProfile(false);}}/>}
      {applyTarget  && <ApplyModal target={applyTarget.target} type={applyTarget.type} onClose={()=>setApplyTarget(null)}/>}
    </div>
  );
}
