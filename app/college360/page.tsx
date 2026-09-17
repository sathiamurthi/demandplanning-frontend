"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, Briefcase, Building2, X, Send, Mail, Sparkles, Star,
  Plus, Loader2, Upload, FileText, LogOut, Lock,
  Code2, TestTube2, Database, Palette, Cloud,
  BookOpen, Zap, Award, MapPin, CheckCircle, AlertCircle,
  GraduationCap, Rocket, Brain, Clock, Target, Heart,
  Check, Pencil, ExternalLink, Phone, Globe, CreditCard,
  Bell, BellDot, MessageSquare, ChevronDown,
  Key, Users, Share2, Calendar, Trophy, Copy, MessageCircle,
  Bookmark, Layers, ChevronRight, FolderOpen, Link2, Megaphone,
  Hash, Newspaper, ArrowRight, RefreshCw, Mic, MicOff, ArrowUpDown,
} from "lucide-react";
import { AdBanner } from "@/components/AdBanner";

// ── Types ──────────────────────────────────────────────────────────────────────
type C360Role = "student" | "recruiter" | "mentor" | "expert" | "alumni" | "training_center" | "college";
interface C360User {
  id: string; name: string; email: string; phone: string;
  role: C360Role; college?: string; year?: string;
  premium: boolean; createdAt: string;
}
interface C360MarketBook {
  id: string; seller_id: string; seller_name: string; seller_college?: string;
  title: string; author?: string; subject?: string; condition: string;
  price: number; type: "sell"|"gift"; description?: string; status: string; created_at: string;
  pending_requests?: number;
}
interface C360Friend {
  id: string; from_id: string; to_id: string; from_name: string; to_name: string;
  peer_id: string; peer_name: string; status: "pending"|"accepted"|"rejected"; created_at: string;
}
interface C360AlumniProfile {
  id: string; user_id: string; user_name: string; college?: string; batch_year?: string;
  current_company?: string; job_role?: string; linkedin?: string; bio?: string;
  is_verified: boolean; created_at: string;
}
interface C360AlumniInvite {
  id: string; from_id: string; to_id: string; from_name: string; to_name: string;
  message?: string; status: string; created_at: string;
}
interface C360Ad {
  id: string; title: string; description?: string; badge?: string;
  cta_text?: string; cta_url?: string; bg_gradient: string; placement: string;
}
interface C360WorkProject {
  id: string; poster_id: string; poster_name: string; poster_type: string;
  title: string; company?: string; description?: string; skills: string[];
  duration?: string; stipend?: string; spots: number; status: string;
  applicant_count?: number; created_at: string;
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
  email: string; wa_number: string; is_i360?: boolean;
}
interface Mentor {
  id: string; name: string; role: string; company: string; domain: string;
  exp: number; rating: number; sessions: number; bio: string;
  skills: string[]; wa_number: string; is_premium: boolean; avatar_color: string; is_i360?: boolean;
  linkedin?: string; email?: string; is_community?: boolean;
}
interface LearningTrack {
  id: string; title: string; domain: string; icon: React.ReactNode;
  modules: number; hours: number; level: string; desc: string;
  color: string; bg: string; is_premium: boolean;
}
type Mode = "student" | "recruiter";
type StudentTab = "dashboard" | "discover" | "studyplan" | "projects" | "work" | "community" | "books" | "jobsearch" | "mentors" | "learning" | "inbox" | "jobs" | "ideas" | "directory";
interface RecruiterProfile {
  company: string; designation: string; industry: string;
  hiring_for: "intern" | "fulltime" | "both";
  skills_needed: string[]; open_positions: string[];
  stipend_min: number; stipend_max: number;
  city: string; email: string; phone: string; website: string; bio: string;
}
interface C360Thread {
  id: string; type: "enquiry" | "outreach"; subject: string;
  to: string; body: string; status: "sent" | "replied" | "closed";
  createdAt: string; replies: { from: string; body: string; at: string }[];
}
interface C360Project {
  id: string; title: string; tech: string; desc: string;
  status: "idea" | "building" | "done"; github?: string;
  public: boolean; createdAt: string;
}
interface C360StudyPlan {
  id: string; goal: string; tech: string; generatedAt: string;
  weeks: Array<{ week: number; focus: string; days: Array<{ day: string; topic: string; tasks: string[]; resource: string }> }>;
}
interface C360Book {
  id: string; title: string; author: string; domain: string;
  desc: string; color: string; tags: string[]; url: string;
}

// ── Sourcing Controller types ──────────────────────────────────────────────────
interface SourcingJob {
  id?: string; title: string; company?: string; location?: string;
  description?: string;
  url?: string; link?: string;           // API returns "link"
  portal?: string; source_portal?: string;
  category?: string; type?: string;
  date_sourced?: string; sourced_at?: string; // API returns "sourced_at"
  salary?: string; is_i360?: boolean;
}
interface SourcingCandidate {
  id?: string; name: string;
  title?: string; job_role?: string;
  location?: string; company?: string;
  experience?: string; experience_years?: string; // API returns "experience_years"
  linkedin?: string; profile_url?: string;
  portal?: string; source_portal?: string; // API returns "source_portal"
  skills?: string[]; availability?: string;
}
type SourcingMode = "jobs" | "candidates" | "all";

// ── Configurable API base URL ──────────────────────────────────────────────────
const DEFAULT_SOURCING_URL = "https://job-sourcing-agent.vercel.app";

// ── C360 API helpers ───────────────────────────────────────────────────────────
const C360_API = "/v1/c360";
const C360_TOKEN_KEY = "c360_token";
const SK = "college360_session";
const PK = (id: string) => `college360_profile_${id}`;
const RP = (id: string) => `college360_recruiter_${id}`;
const MK = "college360_mentors";

const c360Token = () => (typeof window !== "undefined" ? localStorage.getItem(C360_TOKEN_KEY) || "" : "");

const c360Fetch = async (path: string, options: RequestInit = {}): Promise<any> => {
  const token = c360Token();
  const res = await fetch(`${C360_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  return res.json();
};

const loadRP = (id: string): RecruiterProfile => {
  try { const s = localStorage.getItem(RP(id)); if (s) return JSON.parse(s); } catch {}
  return { company:"", designation:"", industry:"", hiring_for:"intern", skills_needed:[], open_positions:[], stipend_min:0, stipend_max:0, city:"", email:"", phone:"", website:"", bio:"" };
};
const loadMentors = (): Mentor[] => {
  try { return JSON.parse(localStorage.getItem(MK) || "[]"); } catch { return []; }
};
const saveMentor = (m: Mentor) => {
  const all = loadMentors();
  localStorage.setItem(MK, JSON.stringify([...all.filter(x => x.id !== m.id), m]));
};

const loadSess = (): C360User | null => {
  try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : null; } catch { return null; }
};
const saveSess = (u: C360User) => localStorage.setItem(SK, JSON.stringify(u));
const clearSess = () => {
  localStorage.removeItem(SK);
  localStorage.removeItem(C360_TOKEN_KEY);
};

const doRegister = async (d: { name: string; email: string; phone: string; pw: string; role: C360Role; college?: string; year?: string }): Promise<C360User | string> => {
  try {
    const res = await c360Fetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: d.name, email: d.email, phone: d.phone, password: d.pw, role: d.role, college: d.college, year: d.year }),
    });
    if (!res.success) return res.error || "Registration failed.";
    localStorage.setItem(C360_TOKEN_KEY, res.data.token);
    const u: C360User = { ...res.data.user, createdAt: res.data.user.created_at };
    saveSess(u); return u;
  } catch { return "Network error. Please try again."; }
};

const doLogin = async (email: string, pw: string): Promise<C360User | string> => {
  try {
    const res = await c360Fetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password: pw }) });
    if (!res.success) return res.error || "Invalid email or password.";
    localStorage.setItem(C360_TOKEN_KEY, res.data.token);
    const u: C360User = { ...res.data.user, createdAt: res.data.user.created_at };
    saveSess(u); return u;
  } catch { return "Network error. Please try again."; }
};

const upgradeUser = async (id: string) => {
  const sess = loadSess();
  if (sess) saveSess({ ...sess, premium: true });
};

// ── i360 Badge ────────────────────────────────────────────────────────────────
const I360Badge = () => (
  <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full px-2 py-[2px] shrink-0 tracking-wide">
    ✦ i360
  </span>
);

// ── Resume Builder payment ─────────────────────────────────────────────────────
interface ResumeOrder {
  id: string; userId: string; userName: string; userEmail: string;
  txnId: string; submittedAt: string; status: "pending"|"approved"|"rejected";
}
async function saveResumeOrder(o: ResumeOrder): Promise<void> {
  await c360Fetch("/payments", { method: "POST", body: JSON.stringify({ txnId: o.txnId, amount: 500, type: "resume" }) });
}
async function getUserResumeOrder(userId: string): Promise<ResumeOrder | null> {
  const res = await c360Fetch("/payments?type=resume");
  if (!res.success || !res.data?.length) return null;
  const p = res.data[0];
  return { id: p.id, userId, userName: p.user_name, userEmail: p.user_email, txnId: p.txn_id, submittedAt: p.created_at, status: p.status };
}

// ── Messaging ─────────────────────────────────────────────────────────────────
interface C360Message {
  id: string; fromId: string; fromName: string;
  toId: string; toName: string;
  content: string; ts: string; read: boolean;
}
function dbMsgToC360(m: any): C360Message {
  return { id: m.id, fromId: m.from_id, fromName: m.from_name, toId: m.to_id, toName: m.to_name, content: m.content, ts: m.created_at, read: m.read };
}
async function loadMessages(): Promise<C360Message[]> {
  const res = await c360Fetch("/messages");
  if (!res.success) return [];
  return (res.data || []).map(dbMsgToC360);
}
async function pushMessage(m: { toId: string; toName: string; content: string }): Promise<void> {
  await c360Fetch("/messages", { method: "POST", body: JSON.stringify(m) });
}
async function markThreadRead(userId: string, partnerId: string): Promise<void> {
  await c360Fetch("/messages/read", { method: "PUT", body: JSON.stringify({ partnerId }) });
}
function countUnread(msgs: C360Message[], userId: string): number {
  return msgs.filter(m => m.toId === userId && !m.read).length;
}

// ── Activity tracking (localStorage, low-priority) ────────────────────────────
const ACT_KEY = (id: string) => `c360_act_${id}`;
interface UserActivity { applications: number; mentorsContacted: number; }
function loadActivity(id: string): UserActivity {
  try { return { applications: 0, mentorsContacted: 0, ...JSON.parse(localStorage.getItem(ACT_KEY(id)) || "{}") }; }
  catch { return { applications: 0, mentorsContacted: 0 }; }
}
function bumpActivity(id: string, key: keyof UserActivity): void {
  const a = loadActivity(id);
  localStorage.setItem(ACT_KEY(id), JSON.stringify({ ...a, [key]: (a[key] || 0) + 1 }));
}

// ── Payment helpers ────────────────────────────────────────────────────────────
interface PaymentRequest { id:string; userId:string; userName:string; userEmail:string; txnId:string; note?:string; amount:number; submittedAt:string; status:"pending"|"approved"|"rejected"; }
async function savePayment(req: PaymentRequest): Promise<void> {
  await c360Fetch("/payments", { method: "POST", body: JSON.stringify({ txnId: req.txnId, amount: req.amount, type: "premium", note: req.note }) });
}
async function userPaymentStatus(userId: string): Promise<"pending"|"approved"|"none"> {
  const res = await c360Fetch("/payments?type=premium");
  if (!res.success || !res.data?.length) return "none";
  const latest = res.data[0];
  if (latest.status === "approved") return "approved";
  if (latest.status === "pending") return "pending";
  return "none";
}

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
  { id:"o1", title:"Frontend Intern — React/Next.js", company:"NexusOS", city:"Bengaluru", type:"internship", domain:"dev", stipend_min:15000, stipend_max:25000, duration:"6 months", skills:["React","TypeScript","Tailwind"], desc:"Build real features on a live SaaS product. Work alongside senior engineers, ship to production every sprint.", apply_by:"2026-07-30", spots:3, is_premium_only:false, is_verified:true, logo_color:"bg-violet-600", email:"careers@nexusos.in", wa_number:"919880001234", is_i360:true },
  { id:"o2", title:"Data Science Intern — Python/ML", company:"Sigmoid Analytics", city:"Hyderabad", type:"internship", domain:"data", stipend_min:20000, stipend_max:35000, duration:"4 months", skills:["Python","Pandas","ML","SQL"], desc:"Work on real client datasets. Build ML pipelines for retail demand forecasting and churn prediction.", apply_by:"2026-07-25", spots:2, is_premium_only:false, is_verified:true, logo_color:"bg-teal-600", email:"intern@sigmoid.in", wa_number:"919700112233", is_i360:true },
  { id:"o3", title:"Campus Placement — Software Engineer", company:"Infosys Digital", city:"Bengaluru", type:"placement", domain:"dev", stipend_min:600000, stipend_max:1000000, duration:"Full-time", skills:["Java","DSA","SQL","System Design"], desc:"Mass campus recruitment for 2025-26 batch. Eligible: CS/IT/ECE graduates. CTC 6-10 LPA based on performance.", apply_by:"2026-08-15", spots:50, is_premium_only:false, is_verified:true, logo_color:"bg-blue-600", email:"campus@infosys.com", wa_number:"919000000000", is_i360:true },
  { id:"o4", title:"UI/UX Design Intern", company:"AppCraft Studio", city:"Remote", type:"internship", domain:"design", stipend_min:12000, stipend_max:20000, duration:"3 months", skills:["Figma","User Research","Prototyping"], desc:"Design mobile and web interfaces. Work directly with the product team on a FinTech app.", apply_by:"2026-07-20", spots:2, is_premium_only:true, is_verified:true, logo_color:"bg-rose-600", email:"design@appcraft.io", wa_number:"919821334455", is_i360:true },
  { id:"o5", title:"QA / Automation Tester Intern", company:"TestGrid India", city:"Pune", type:"internship", domain:"qa", stipend_min:18000, stipend_max:28000, duration:"6 months", skills:["Selenium","Python","Postman","REST APIs"], desc:"Real test automation work on an enterprise product. Learn framework design, CI/CD integration.", apply_by:"2026-07-31", spots:4, is_premium_only:false, is_verified:true, logo_color:"bg-amber-600", email:"hr@testgrid.in", wa_number:"919800556677", is_i360:true },
  { id:"o6", title:"Product Manager Intern", company:"StartupLens VC", city:"Mumbai", type:"internship", domain:"product", stipend_min:25000, stipend_max:40000, duration:"3 months", skills:["Roadmapping","Figma","Analytics","SQL"], desc:"Work with portfolio startups to define features and ship MVPs. Great for MBA/engineering students.", apply_by:"2026-08-05", spots:2, is_premium_only:true, is_verified:false, logo_color:"bg-emerald-600", email:"pm@startuplens.vc", wa_number:"919890223344" },
  { id:"o7", title:"Cybersecurity Analyst Intern", company:"SecureEdge Labs", city:"Chennai", type:"internship", domain:"security", stipend_min:22000, stipend_max:32000, duration:"6 months", skills:["Network Security","Kali Linux","SIEM","Wireshark"], desc:"Hands-on penetration testing and vulnerability analysis on real client networks (supervised).", apply_by:"2026-07-28", spots:3, is_premium_only:true, is_verified:true, logo_color:"bg-indigo-600", email:"recruit@secureedge.in", wa_number:"919841009900", is_i360:true },
  { id:"o8", title:"Freelance Content Writer", company:"ContentHive", city:"Remote", type:"freelance", domain:"content", stipend_min:800, stipend_max:2000, duration:"Ongoing", skills:["Technical Writing","SEO","Research"], desc:"Write blog posts, case studies, and product docs for SaaS companies. ₹800-2000 per article.", apply_by:"2026-07-31", spots:10, is_premium_only:false, is_verified:false, logo_color:"bg-cyan-600", email:"write@contenthive.co", wa_number:"919700889900" },
];

const MOCK_MENTORS: Mentor[] = [
  { id:"m1", name:"Aryan Kapoor", role:"Senior SDE", company:"Google", domain:"dev", exp:8, rating:4.9, sessions:120, bio:"Google SDE working on Search infra. Passionate about helping college students crack top tech companies. Alumni IIT Bombay.", skills:["DSA","System Design","React","Python"], wa_number:"919880001111", is_premium:true, avatar_color:"bg-violet-600", is_i360:true },
  { id:"m2", name:"Sneha Reddy", role:"Data Scientist", company:"Flipkart", domain:"data", exp:6, rating:4.8, sessions:85, bio:"Flipkart DS building recommendation systems. Helps students transition into data science from any branch.", skills:["Python","ML","SQL","Statistics"], wa_number:"919700112244", is_premium:true, avatar_color:"bg-teal-600", is_i360:true },
  { id:"m3", name:"Rohan Mehta", role:"SDET Lead", company:"Microsoft", domain:"qa", exp:7, rating:4.7, sessions:60, bio:"Testing lead at Microsoft Teams. Advocate for quality engineering as a first-class career path.", skills:["Selenium","Azure DevOps","API Testing","Java"], wa_number:"919900334455", is_premium:true, avatar_color:"bg-blue-600", is_i360:true },
  { id:"m4", name:"Kavitha Iyer", role:"UX Lead", company:"Razorpay", domain:"design", exp:9, rating:4.9, sessions:95, bio:"Design leader at Razorpay. Mentors students from non-design backgrounds. Portfolio reviews every weekend.", skills:["Figma","User Research","Design Systems","Accessibility"], wa_number:"919845667788", is_premium:false, avatar_color:"bg-rose-600", is_i360:true },
  { id:"m5", name:"Vikram Singh", role:"Cloud Architect", company:"AWS India", domain:"cloud", exp:11, rating:4.8, sessions:45, bio:"AWS Solutions Architect. Helps students get cloud certified and land DevOps/Cloud roles.", skills:["AWS","Kubernetes","Terraform","Python"], wa_number:"919810223344", is_premium:true, avatar_color:"bg-amber-600", is_i360:true },
];

const MOCK_STUDENTS: Array<{ id:string; name:string; headline:string; college:string; year:string; cgpa:string; skills:string[]; seeking:string[]; city:string; available:boolean; color:string }> = [
  { id:"st1", name:"Nisha Kumari", headline:"B.Tech CSE · IIT Hyderabad · CGPA 8.9", college:"IIT Hyderabad", year:"4th Year", cgpa:"8.9", skills:["React","Node.js","Python","PostgreSQL"], seeking:["Full Stack Intern","SDE Role"], city:"Hyderabad", available:true, color:"bg-violet-600" },
  { id:"st2", name:"Rohan Desai", headline:"B.E. Computer Sci · BITS Pilani · 9.1 CGPA", college:"BITS Pilani", year:"3rd Year", cgpa:"9.1", skills:["Python","ML","TensorFlow","SQL"], seeking:["Data Science Intern","AI/ML Role"], city:"Bangalore", available:true, color:"bg-teal-600" },
  { id:"st3", name:"Aisha Shaikh", headline:"MCA · Symbiosis Pune · 7.8 CGPA", college:"Symbiosis Institute", year:"Postgraduate", cgpa:"7.8", skills:["Java","Selenium","API Testing","Agile"], seeking:["QA Intern","SDET Role"], city:"Pune", available:true, color:"bg-blue-600" },
  { id:"st4", name:"Dev Narayanan", headline:"B.Des · NID Ahmedabad", college:"NID Ahmedabad", year:"Recently Graduated", cgpa:"8.4", skills:["Figma","Adobe XD","UX Research","Framer"], seeking:["UI/UX Designer","Product Designer"], city:"Ahmedabad", available:false, color:"bg-rose-600" },
];

const LEARN_TRACKS: LearningTrack[] = [
  { id:"lt1", title:"Full Stack Web Dev", domain:"dev", icon:<Code2 size={22}/>, modules:12, hours:48, level:"Beginner → Pro", desc:"HTML, CSS, React, Node.js, PostgreSQL, Deploy. Build 3 real projects.", color:"text-violet-600", bg:"bg-violet-100", is_premium:false },
  { id:"lt2", title:"Python for Data Science", domain:"data", icon:<Database size={22}/>, modules:10, hours:40, level:"Beginner → Intermediate", desc:"NumPy, Pandas, Matplotlib, Scikit-learn, ML fundamentals with real datasets.", color:"text-teal-600", bg:"bg-teal-100", is_premium:false },
  { id:"lt3", title:"QA & Test Automation", domain:"qa", icon:<TestTube2 size={22}/>, modules:8, hours:32, level:"Beginner → Intermediate", desc:"Manual testing, Selenium WebDriver, Pytest, Postman, CI/CD integration.", color:"text-amber-600", bg:"bg-amber-50", is_premium:true },
  { id:"lt4", title:"UI/UX Design Foundations", domain:"design", icon:<Palette size={22}/>, modules:8, hours:30, level:"Beginner", desc:"Design thinking, Figma, wireframing, prototyping, usability testing.", color:"text-rose-500", bg:"bg-rose-500/10", is_premium:true },
  { id:"lt5", title:"Cloud & DevOps Essentials", domain:"cloud", icon:<Cloud size={22}/>, modules:10, hours:38, level:"Intermediate", desc:"Linux, Docker, Kubernetes, AWS basics, CI/CD pipelines, Infrastructure as Code.", color:"text-cyan-600", bg:"bg-cyan-500/10", is_premium:true },
  { id:"lt6", title:"DSA & Competitive Coding", domain:"dev", icon:<Zap size={22}/>, modules:15, hours:60, level:"Intermediate → Advanced", desc:"Arrays to Graphs. 200+ LeetCode-style problems. Interview-ready in 8 weeks.", color:"text-indigo-600", bg:"bg-indigo-500/10", is_premium:true },
];

const COURSE_OPTIONS = [
  "B.Tech / B.E. - Computer Science",
  "B.Tech / B.E. - Information Technology",
  "B.Tech / B.E. - Electronics & Communication",
  "B.Tech / B.E. - Electrical Engineering",
  "B.Tech / B.E. - Mechanical Engineering",
  "B.Tech / B.E. - Civil Engineering",
  "B.Sc - Computer Science",
  "BCA", "MCA", "M.Tech", "MBA", "BBA", "B.Com",
  "B.Sc - Mathematics / Statistics",
  "Law (LLB)", "B.Des / BFA",
];

const TECH_GROUPS = [
  { group: "Frontend",       items: ["React","Next.js","Vue.js","Angular","HTML/CSS","TypeScript","JavaScript"] },
  { group: "Backend",        items: ["Node.js","Python","Java","Spring Boot","Django","Express","FastAPI","PHP","Ruby on Rails"] },
  { group: "Database",       items: ["PostgreSQL","MySQL","MongoDB","Redis","Firebase","SQLite","Supabase"] },
  { group: "Mobile",         items: ["React Native","Flutter","Android (Kotlin)","iOS (Swift)"] },
  { group: "ML / AI",        items: ["TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy","LangChain","Hugging Face"] },
  { group: "Cloud & DevOps", items: ["AWS","Azure","GCP","Docker","Kubernetes","Linux","CI/CD","Terraform"] },
  { group: "Testing",        items: ["Selenium","Pytest","Jest","Postman","Playwright","JUnit","Cypress"] },
  { group: "Design",         items: ["Figma","Adobe XD","Canva","Framer","Blender"] },
];

const ROLE_OPTIONS = [
  "SDE Intern","Full Stack Developer","Frontend Developer","Backend Developer",
  "Data Science Intern","ML Engineer","Data Analyst","AI Research",
  "DevOps Engineer","Cloud Engineer","QA / Test Engineer","SDET",
  "UI/UX Designer","Product Designer","Product Manager","Business Analyst",
  "Cybersecurity Analyst","Embedded Engineer","Game Developer",
  "Content Writer","Digital Marketing","Finance Analyst","HR Intern",
];

// Flat list used by MultiSelectDropdown
const ALL_SKILLS = TECH_GROUPS.flatMap(g => g.items);

// ── Books Feed data ────────────────────────────────────────────────────────────
const C360_BOOKS: C360Book[] = [
  { id:"b1", title:"Clean Code", author:"Robert C. Martin", domain:"programming", desc:"A handbook of agile software craftsmanship — essential reading for every developer.", color:"bg-blue-500", tags:["Best Practices","Engineering"], url:"https://www.goodreads.com/book/show/3735293" },
  { id:"b2", title:"The Pragmatic Programmer", author:"Hunt & Thomas", domain:"programming", desc:"Timeless advice from veteran programmers for your journey to mastery.", color:"bg-purple-500", tags:["Career","Software Craft"], url:"https://www.goodreads.com/book/show/4099" },
  { id:"b3", title:"Cracking the Coding Interview", author:"Gayle McDowell", domain:"programming", desc:"189 programming questions with solutions — the definitive interview prep book.", color:"bg-emerald-500", tags:["Interview Prep","Algorithms"], url:"https://www.goodreads.com/book/show/12544648" },
  { id:"b4", title:"Hands-On Machine Learning", author:"Aurélien Géron", domain:"ai", desc:"Practical ML with Scikit-Learn, Keras & TensorFlow — learn by building real projects.", color:"bg-orange-500", tags:["Machine Learning","Python"], url:"https://www.goodreads.com/book/show/32899495" },
  { id:"b5", title:"Python Data Science Handbook", author:"Jake VanderPlas", domain:"ai", desc:"Essential tools for working with data: NumPy, Pandas, Matplotlib, Scikit-Learn.", color:"bg-yellow-500", tags:["Python","Data Analysis"], url:"https://jakevdp.github.io/PythonDataScienceHandbook/" },
  { id:"b6", title:"Designing Data-Intensive Applications", author:"Martin Kleppmann", domain:"data", desc:"The definitive guide to reliable, scalable, and maintainable systems at scale.", color:"bg-red-500", tags:["Databases","System Design"], url:"https://www.goodreads.com/book/show/23463279" },
  { id:"b7", title:"The Design of Everyday Things", author:"Don Norman", domain:"design", desc:"Understand why designs succeed or fail — a must-read for every UX practitioner.", color:"bg-pink-500", tags:["UX Design","Design Thinking"], url:"https://www.goodreads.com/book/show/840" },
  { id:"b8", title:"Kubernetes in Action", author:"Marko Luksa", domain:"cloud", desc:"Step-by-step guide to deploying and managing containerised applications at scale.", color:"bg-sky-500", tags:["Kubernetes","DevOps"], url:"https://www.goodreads.com/book/show/34013922" },
  { id:"b9", title:"Thinking in Systems", author:"Donella Meadows", domain:"all", desc:"A primer on systems thinking — see the world in feedback loops and leverage points.", color:"bg-teal-500", tags:["Problem Solving","Systems"], url:"https://www.goodreads.com/book/show/3828902" },
  { id:"b10", title:"Zero to One", author:"Peter Thiel", domain:"all", desc:"Notes on startups and building the future — for students who want to create, not compete.", color:"bg-indigo-500", tags:["Startup","Innovation"], url:"https://www.goodreads.com/book/show/18050143" },
  { id:"b11", title:"Agile Testing", author:"Lisa Crispin", domain:"testing", desc:"A practical guide for whole-team approaches to quality in agile environments.", color:"bg-lime-500", tags:["QA","Testing"], url:"https://www.goodreads.com/book/show/5341009" },
  { id:"b12", title:"The Linux Command Line", author:"William Shotts", domain:"programming", desc:"Complete introduction to the Linux command line — freely available online.", color:"bg-gray-600", tags:["Linux","CLI"], url:"https://linuxcommand.org/tlcl.php" },
];

// ── localStorage key helpers (new features) ────────────────────────────────────
const TK  = (id: string) => `c360_threads_${id}`;
const PJK = (id: string) => `c360_projects_${id}`;
const SPK = (id: string) => `c360_study_plan_${id}`;
const SPC = (id: string) => `c360_sp_count_${id}`;
const BSK = (id: string) => `c360_books_saved_${id}`;
const ICK = (id: string) => `c360_invite_count_${id}`;
const INK = (id: string) => `c360_invites_${id}`;

interface InviteEvent { ts: string; method: "copy"|"whatsapp"|"email"; to?: string; }
interface InviteLog   { total: number; events: InviteEvent[]; }

// ── Payment constants ──────────────────────────────────────────────────────────
const UPI_ID    = "8884166603@axisbank";
const PAY_AMOUNT = 500;

function loadInvites(id: string): InviteLog {
  try { return JSON.parse(localStorage.getItem(INK(id)) || "null") || { total: 0, events: [] }; }
  catch { return { total: 0, events: [] }; }
}
function pushInvite(id: string, method: "copy"|"whatsapp"|"email", to?: string) {
  const log = loadInvites(id);
  log.events.unshift({ ts: new Date().toISOString(), method, ...(to ? { to } : {}) });
  log.total = log.events.length;
  try { localStorage.setItem(INK(id), JSON.stringify(log)); } catch {}
  // keep legacy count key in sync
  try { localStorage.setItem(ICK(id), String(log.total)); } catch {}
}
const loadThreads  = (id: string): C360Thread[]  => { try { return JSON.parse(localStorage.getItem(TK(id))  || "[]"); } catch { return []; } };
const saveThreads  = (id: string, t: C360Thread[])  => localStorage.setItem(TK(id),  JSON.stringify(t));
const loadProjects = (id: string): C360Project[] => { try { return JSON.parse(localStorage.getItem(PJK(id)) || "[]"); } catch { return []; } };
const saveProjects = (id: string, p: C360Project[]) => localStorage.setItem(PJK(id), JSON.stringify(p));
const loadSavedBooks = (id: string): string[] => { try { return JSON.parse(localStorage.getItem(BSK(id)) || "[]"); } catch { return []; } };

// ── Client-side resume text parser (AI-free fallback) ─────────────────────────
function parseResumeTextLocally(text: string): StudentProfile {
  const strip = (s: string) => s.replace(/[#*_`~[\]]/g, '').replace(/\(https?:\/\/[^)]+\)/g, '').trim();
  const lines = text.split('\n').map(strip).filter(l => l.length > 0);

  // Name: first line that looks like a person's name
  let name = '';
  for (const l of lines.slice(0, 8)) {
    if (l.length >= 3 && l.length <= 50 && /^[A-Za-z][\w\s.'-]*$/.test(l) && l.split(/\s+/).length >= 2) {
      name = l; break;
    }
  }

  // Contact
  const emailM    = text.match(/[\w.+%-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const phoneM    = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  const cityM     = text.match(/📍\s*([^,\n\r]+)/);
  const linkedinM = text.match(/linkedin\.com\/in\/([\w-]+)/i);
  const githubM   = text.match(/github\.com\/([\w-]+)/i);

  // CGPA
  const cgpaM = text.match(/(?:CGPA|GPA)[:\s]*([0-9.]+)\s*\/\s*10/i) || text.match(/([0-9]+\.[0-9]+)\s*\/\s*10/);
  const cgpa  = cgpaM?.[1] || '';

  // College name
  let college = '';
  const collegeM = text.match(/([A-Z][a-zA-Z\s&'.-]+(?:Institute|University|College|School of Technology|IIT|NIT|BITS|Academy)[a-zA-Z\s,&.-]*)/);
  if (collegeM) college = strip(collegeM[1]).slice(0, 70);

  // Year of study
  let year = 'Final Year';
  const semM   = text.match(/(\d+)(?:st|nd|rd|th)\s+(?:Semester|Year)/i);
  const batchM = text.match(/(?:20\d{2})\s*[-–]\s*(20\d{2})/);
  if (semM) {
    const n = parseInt(semM[1]);
    year = n <= 2 ? '1st Year' : n <= 4 ? '2nd Year' : n <= 6 ? '3rd Year' : '4th Year';
  } else if (batchM) {
    const endYr = parseInt(batchM[1]);
    const rem = endYr - new Date().getFullYear();
    year = rem > 2 ? '1st Year' : rem === 2 ? '2nd Year' : rem === 1 ? '3rd Year' : rem === 0 ? '4th Year' : 'Recently Graduated';
  }

  // Skills — match against known list (whole-word) + extract from skill sections
  const knownSkills = ALL_SKILLS.filter(s =>
    new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  );
  const extraSkills: string[] = [];
  const skillSecM = text.match(/(?:Programming Languages?|Technical Skills?|Frameworks?|Technologies?|Tools?)[:\s]*([\s\S]*?)(?:\n#{1,3} |\n\n[A-Z]|$)/i);
  if (skillSecM) {
    skillSecM[1].split('\n').map(strip).filter(l => l.length > 1 && l.length < 25 && /^[A-Za-z]/.test(l)).forEach(l => extraSkills.push(l));
  }
  const skills = [...new Set([...knownSkills, ...extraSkills])].slice(0, 20);

  // Domains from skills
  const sl = skills.map(s => s.toLowerCase()).join(' ');
  const domains: string[] = [];
  if (/react|vue|angular|html|css|javascript|typescript|next\.js/i.test(sl + ' ' + text)) domains.push('dev');
  if (/python|tensorflow|pytorch|pandas|numpy|machine.?learn/i.test(sl + ' ' + text)) domains.push('data');
  if (/aws|azure|gcp|cloud|docker|kubernetes/i.test(sl + ' ' + text)) domains.push('cloud');
  if (/selenium|playwright|cypress|jest|pytest|junit/i.test(sl + ' ' + text)) domains.push('qa');
  if (!domains.length) domains.push('dev');

  // Projects
  const projects: Array<{ name: string; tech: string; desc: string }> = [];
  for (const m of text.matchAll(/(?:#{2,3})\s+([^\n#]+)\n(?:[\s\S]*?)\*\*Tech(?:nology)?[:\*]*\*\*\s*([^\n]+)/gi)) {
    const pName = strip(m[1]).slice(0, 60);
    if (pName && projects.length < 4) projects.push({ name: pName, tech: strip(m[2]).slice(0, 80), desc: '' });
  }

  // Education
  const education: Array<{ degree: string; institution: string; year: string; score: string }> = [];
  const degreeM = text.match(/(?:Bachelor|B\.Tech|B\.E\.?|B\.Sc\.?|M\.Tech|MCA|BCA|B\.Com|MBA|M\.Sc)[^\n]*/i);
  if (degreeM) education.push({ degree: strip(degreeM[0]).slice(0, 80), institution: college, year: batchM?.[1] || '', score: cgpa });

  // Certifications
  const certs: string[] = [];
  const certSecM = text.match(/Certifications?[\s\S]*?(?=\n#{1,3} |\n#[^#]|$)/i);
  if (certSecM) certSecM[0].split('\n').map(strip).filter(l => l.length > 3 && l.length < 80 && !/certif/i.test(l)).slice(0, 6).forEach(c => certs.push(c));

  // Achievements
  const achievements: string[] = [];
  const achSecM = text.match(/Achievements?[\s\S]*?(?=\n#{1,3} |\n#[^#]|$)/i);
  if (achSecM) achSecM[0].split('\n').map(strip).filter(l => l.length > 3 && l.length < 100 && !/achievement/i.test(l)).slice(0, 5).forEach(a => achievements.push(a));

  // Seeking roles
  const seeking: string[] = [];
  if (/intern/i.test(text)) seeking.push('SDE Intern');
  if (/full.?stack/i.test(text)) seeking.push('Full Stack Developer');
  if (/front.?end/i.test(text)) seeking.push('Frontend Developer');
  if (/back.?end/i.test(text)) seeking.push('Backend Developer');
  if (/data\s*sci|machine\s*learn/i.test(text)) seeking.push('Data Science Intern');
  if (!seeking.length) seeking.push('SDE Intern');

  const deg      = education[0]?.degree.split('–')[0]?.trim() || 'B.Tech CS';
  const headline = [deg, year, cgpa ? `CGPA ${cgpa}` : '', college.split(',')[0]].filter(Boolean).join(' · ');
  const summary  = `${name} is a ${year} ${deg} student${college ? ' at ' + college.split(',')[0] : ''}. Skilled in ${skills.slice(0, 4).join(', ')}. Seeking ${seeking.slice(0, 2).join(', ')} roles.`;

  return {
    name, headline, college, year, cgpa,
    contact: { phone: phoneM?.[0] || '', email: emailM?.[0] || '', city: cityM?.[1]?.trim() || '' },
    summary, skills, domains, projects, education,
    certifications: certs, languages: ['English'],
    github:   githubM   ? `https://github.com/${githubM[1]}` : '',
    linkedin: linkedinM ? `https://linkedin.com/in/${linkedinM[1]}` : '',
    seeking, preferred_cities: [], achievements,
  };
}

// ── AI Profile Extractor ───────────────────────────────────────────────────────
async function extractProfile(input: { text?: string; base64?: string; mime?: string }): Promise<{ data: StudentProfile | null; error?: string }> {
  try {
    const body = input.base64
      ? { fileBase64: input.base64, mimeType: input.mime || "application/pdf", mode: "student" }
      : { text: input.text, mode: "student" };
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 55000);
    const r = await fetch("/api/extract-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(tid);
    const d = await r.json();
    if (d.success && d.data) return { data: d.data as StudentProfile };
    return { data: null, error: d.error || "AI returned empty result — try pasting your resume text below." };
  } catch (e: any) {
    const msg = e?.name === "AbortError"
      ? "Request timed out. Try pasting your resume text instead."
      : (e?.message || "Network error — check connection and retry.");
    return { data: null, error: msg };
  }
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }: { onClose: ()=>void; onSuccess: (u: C360User)=>void }) {
  const [tab, setTab] = useState<"login"|"register"|"reset">("register");
  const [role, setRole] = useState<C360Role>("student");
  const [form, setForm] = useState({ name:"", email:"", phone:"", pw:"", college:"", year:"1st Year" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const doReset = async () => {
    if (!resetEmail.trim()) { setErr("Enter your registered email."); return; }
    if (!resetNewPw || resetNewPw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (resetNewPw !== resetConfirm) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await c360Fetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ email: resetEmail.trim(), newPassword: resetNewPw }) });
      if (!res.success) { setErr(res.error || "No account found with that email."); return; }
      setErr(""); setResetDone(true);
    } catch { setErr("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (tab === "register") {
        if (!form.name || !form.email || !form.phone || !form.pw) { setErr("All fields required."); return; }
        const r = await doRegister({ ...form, role, college: form.college || undefined, year: role==="student"?form.year:undefined });
        if (typeof r === "string") { setErr(r); return; }
        onSuccess(r);
      } else {
        if (!form.email || !form.pw) { setErr("Enter email and password."); return; }
        const r = await doLogin(form.email, form.pw);
        if (typeof r === "string") { setErr(r); return; }
        onSuccess(r);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {tab==="reset" ? "Reset Password" : "Join College360"}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900"><X size={20}/></button>
        </div>

        {tab !== "reset" && (
          <div className="flex bg-gray-50 rounded-lg p-1 mb-5">
            {(["register","login"] as const).map(t => (
              <button key={t} onClick={()=>{ setTab(t); setErr(""); }} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition ${tab===t?"bg-violet-600 text-white":"text-gray-600"}`}>{t==="register"?"Create Account":"Sign In"}</button>
            ))}
          </div>
        )}

        {/* RESET PASSWORD VIEW */}
        {tab === "reset" && (
          resetDone ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={26} className="text-green-600"/>
              </div>
              <h3 className="text-base font-black text-gray-900 mb-1">Password Reset!</h3>
              <p className="text-sm text-gray-500 mb-4">Your password has been updated. You can now sign in.</p>
              <button onClick={()=>{ setTab("login"); setResetDone(false); setResetEmail(""); setResetNewPw(""); setResetConfirm(""); }}
                className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl text-sm hover:bg-violet-700 transition">
                Go to Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-1">Enter your registered email and choose a new password.</p>
              <input value={resetEmail} onChange={e=>{ setResetEmail(e.target.value); setErr(""); }}
                placeholder="Registered email" type="email"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"/>
              <input value={resetNewPw} onChange={e=>{ setResetNewPw(e.target.value); setErr(""); }}
                placeholder="New password (min 6 chars)" type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"/>
              <input value={resetConfirm} onChange={e=>{ setResetConfirm(e.target.value); setErr(""); }}
                placeholder="Confirm new password" type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"/>
              {err && <p className="text-red-600 text-xs">{err}</p>}
              <button onClick={doReset} disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-lg text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin"/>}Reset Password
              </button>
              <p className="text-xs text-gray-500 text-center">
                <button onClick={()=>{ setTab("login"); setErr(""); }} className="text-violet-600 hover:underline">← Back to Sign In</button>
              </p>
            </div>
          )
        )}

        {/* LOGIN / REGISTER VIEW */}
        {tab !== "reset" && (<>
          {tab === "register" && (
            <div className="grid grid-cols-2 gap-1 bg-gray-50 rounded-lg p-1 mb-4">
              {([["student","🎓 Student"],["recruiter","🏢 Recruiter"],["mentor","💡 Expert/Mentor"],["training_center","🏫 Training Center"],["college","🏛️ College"]] as [C360Role,string][]).map(([r,l]) => (
                <button key={r} onClick={()=>setRole(r)} className={`py-1.5 rounded-md text-xs font-semibold transition ${role===r?"bg-indigo-600 text-white":"text-gray-600 hover:bg-gray-100"}`}>{l}</button>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {tab === "register" && <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder={role==="training_center"?"Training Center / Institute name":role==="college"?"College / University name":"Full name"} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>}
            <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            {tab === "register" && <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="Phone number" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>}
            {tab === "register" && role === "student" && (
              <>
                <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="College / University name" value={form.college} onChange={e=>setForm(f=>({...f,college:e.target.value}))}/>
                <select className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-violet-500" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))}>
                  {YEARS.map(y=><option key={y}>{y}</option>)}
                </select>
              </>
            )}
            {tab === "register" && role === "training_center" && (
              <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="City / Location" value={form.college} onChange={e=>setForm(f=>({...f,college:e.target.value}))}/>
            )}
            <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="Password" type="password" value={form.pw} onChange={e=>setForm(f=>({...f,pw:e.target.value}))}/>
          </div>
          {tab === "login" && (
            <div className="text-right mt-1.5">
              <button onClick={()=>{ setTab("reset"); setErr(""); setResetEmail(form.email); }}
                className="text-xs text-violet-600 hover:underline">Forgot password?</button>
            </div>
          )}
          {err && <p className="text-red-600 text-xs mt-2">{err}</p>}
          <button onClick={submit} disabled={loading} className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin"/>}
            {tab==="register"?"Create Free Account":"Sign In"}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            {tab==="register"?"Already have an account? ":"New here? "}
            <button onClick={()=>{ setTab(tab==="register"?"login":"register"); setErr(""); }} className="text-violet-600 hover:underline">{tab==="register"?"Sign in":"Create account"}</button>
          </p>
        </>)}
      </div>
    </div>
  );
}

// ── Premium Modal ─────────────────────────────────────────────────────────────
const PREMIUM_FEATURES = [
  { icon:<Brain size={14}/>,     label:"AI Profile Builder",           sub:"Claude AI extracts profile from resume" },
  { icon:<Sparkles size={14}/>,  label:"AI Resume Writer",             sub:"ATS-optimized, personalized resume" },
  { icon:<Target size={14}/>,    label:"Premium Internships",          sub:"Exclusive opportunities not visible to free users" },
  { icon:<Heart size={14}/>,     label:"1-on-1 Mentor Sessions",       sub:"Google, Microsoft, Amazon mentors" },
  { icon:<BookOpen size={14}/>,  label:"All Learning Tracks",          sub:"DSA, Cloud, QA, Design, DevOps" },
  { icon:<Award size={14}/>,     label:"Priority Application",         sub:"Your profile highlighted to recruiters" },
];

function PremiumModal({ user, onClose }: { user: C360User|null; onClose: ()=>void }) {
  type Step = "info"|"submit"|"done";
  const [step, setStep] = useState<Step>("info");
  const [txnId, setTxnId] = useState("");
  const [note, setNote]   = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      userPaymentStatus(user.id).then(s => { if (s === "pending" || s === "approved") setStep("done"); });
    }
  }, [user]);

  function copyUpi() {
    navigator.clipboard.writeText(UPI_ID).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }

  async function submitPayment() {
    if (!txnId.trim() || !user) return;
    setSubmitting(true);
    try {
      const req: PaymentRequest = { id: `pay_${Date.now()}`, userId: user.id, userName: user.name, userEmail: user.email, txnId: txnId.trim(), note: note.trim() || undefined, amount: PAY_AMOUNT, submittedAt: new Date().toISOString(), status: "pending" };
      await savePayment(req);
      setStep("done");
    } finally { setSubmitting(false); }
  }

  const STEPS = ["info","submit","done"] as const;
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-violet-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={18}/>
            <h2 className="text-base font-bold text-gray-900">Upgrade to Premium</h2>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-2">
          {["Choose plan","Pay","Confirm"].map((l,i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition ${i <= stepIdx ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"}`}>{i+1}</div>
              {i < 2 && <div className={`w-8 h-0.5 ${i < stepIdx ? "bg-violet-600" : "bg-gray-200"}`}/>}
            </div>
          ))}
        </div>

        <div className="px-6 py-4">
          {/* ── STEP 1: Info + UPI ── */}
          {step === "info" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4">
                <div className="flex items-end gap-2 mb-0.5">
                  <span className="text-3xl font-black text-gray-900">₹{PAY_AMOUNT}</span>
                  <span className="text-gray-500 text-sm mb-1">/year</span>
                </div>
                <p className="text-xs text-gray-500">Less than ₹42/month. Unlock your full potential.</p>
              </div>
              <div className="space-y-1.5">
                {PREMIUM_FEATURES.map((f,i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="text-violet-600 mt-0.5 shrink-0">{f.icon}</div>
                    <div><p className="text-xs text-gray-900 font-medium">{f.label}</p><p className="text-[11px] text-gray-500">{f.sub}</p></div>
                  </div>
                ))}
              </div>

              {/* UPI box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5"><CreditCard size={12}/>Pay via UPI</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-mono font-bold text-gray-900 bg-white border border-amber-200 rounded-lg px-3 py-2">{UPI_ID}</span>
                  <button onClick={copyUpi} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition border ${copied?"bg-emerald-100 border-emerald-200 text-emerald-600":"bg-white border-amber-200 text-amber-700 hover:bg-amber-100"}`}>
                    {copied ? <><CheckCircle size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
                  </button>
                </div>
                <p className="text-[10px] text-amber-700 mt-2">Open any UPI app → Pay → Enter this UPI ID → Amount ₹{PAY_AMOUNT}</p>
              </div>

              <button onClick={() => setStep("submit")} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
                <CheckCircle size={15}/>I've Paid — Submit Transaction ID
              </button>
            </div>
          )}

          {/* ── STEP 2: Submit Txn ── */}
          {step === "submit" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Enter your UPI transaction / reference ID so we can verify your payment.</p>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Transaction / Reference ID *</label>
                <input value={txnId} onChange={e=>setTxnId(e.target.value)}
                  placeholder="e.g. 4156789012345678"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20"/>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Note (optional)</label>
                <input value={note} onChange={e=>setNote(e.target.value)}
                  placeholder="Any note for us"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20"/>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep("info")} className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 font-semibold transition">← Back</button>
                <button onClick={submitPayment} disabled={!txnId.trim()||submitting} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">{submitting&&<Loader2 size={13} className="animate-spin"/>}
                  Submit →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500"/>
              </div>
              <p className="text-base font-bold text-gray-900 mb-2">Payment Submitted!</p>
              <p className="text-sm text-gray-500 mb-4">Our team will verify your UPI transaction and activate Premium within <span className="font-semibold text-gray-700">2–4 hours</span>.</p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left mb-4">
                <p className="text-[11px] text-gray-500">What's next:</p>
                <ul className="text-xs text-gray-700 mt-1.5 space-y-1">
                  <li>✓ Check your email for confirmation</li>
                  <li>✓ Premium unlocks automatically after approval</li>
                  <li>✓ Questions? Email college360@nexusos.in</li>
                </ul>
              </div>
              <button onClick={onClose} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile Builder Modal ─────────────────────────────────────────────────────
function ProfileBuilderModal({ user, freeAI, onClose, onSave }: { user: C360User; freeAI?: boolean; onClose: ()=>void; onSave: (p: StudentProfile)=>void }) {
  const [step, setStep] = useState<"upload"|"manual"|"result">("upload");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // Seed from localStorage so the manual form is pre-filled on open
  const [profile, setProfile] = useState<StudentProfile|null>(() => {
    try { const s = localStorage.getItem(PK(user.id)); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  const runExtract = async (input: { text?: string; base64?: string; mime?: string }) => {
    setLoading(true);
    setAiErr("");
    const result = await extractProfile(input);
    setLoading(false);
    if (result.data) {
      setProfile(result.data);
      setStep("result");
    } else if (input.text) {
      // AI is down — parse the text locally as an instant fallback
      const local = parseResumeTextLocally(input.text);
      setProfile(local);
      setAiErr("AI is currently unavailable. Profile extracted locally — please review and edit before saving.");
      setStep("result");
    } else {
      setAiErr(result.error || "AI could not extract. Paste your resume text below.");
    }
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
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {(user.premium || freeAI) ? <><Sparkles className="text-yellow-400" size={18}/>AI Profile Builder</> : <><FileText size={18}/>Build Your Profile</>}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-600 hover:text-gray-900"/></button>
        </div>

        {step === "upload" && (
          <div className="space-y-4">
            {(user.premium || freeAI) ? (
              <>
                <p className="text-sm text-gray-600">{freeAI && !user.premium ? "AI features are unlocked for everyone during our MVP launch! " : ""}Upload your resume — AI will extract everything automatically.</p>
                {!loading && !aiErr && (
                  <>
                    <div className="border-2 border-dashed border-violet-300 hover:border-violet-500 rounded-xl p-8 text-center cursor-pointer transition" onClick={()=>fileRef.current?.click()}>
                      <Upload size={32} className="text-violet-600 mx-auto mb-3"/>
                      <p className="text-sm text-gray-900 font-semibold">Click to upload PDF / image</p>
                      <p className="text-xs text-gray-500 mt-1">Resume, marksheet, transcript</p>
                    </div>
                    <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={onFile}/>
                    <div className="text-center text-gray-500 text-xs">or paste text below</div>
                  </>
                )}
                {loading && (
                  <div className="border-2 border-dashed border-violet-200 rounded-xl p-8 text-center">
                    <Loader2 size={28} className="text-violet-600 mx-auto mb-3 animate-spin"/>
                    <p className="text-sm text-gray-600">Extracting with AI — this may take 15–30 seconds for multi-page PDFs…</p>
                  </div>
                )}
                {aiErr && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5"><X size={12}/>AI extraction failed</p>
                    <p className="text-xs text-gray-600">{aiErr}</p>
                    <p className="text-xs text-gray-500 pt-1">Paste your resume text in the box below and click <span className="text-violet-600">Extract with AI</span>, or <button className="text-violet-600 hover:underline" onClick={()=>fileRef.current?.click()}>try uploading again</button>.</p>
                  </div>
                )}
                {aiErr && <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={onFile}/>}
                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 h-28 resize-none" placeholder="Paste your resume text here (copy all text from your PDF)..." value={text} onChange={e=>setText(e.target.value)}/>
                {text && <button onClick={()=>runExtract({text})} disabled={loading} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition">{loading?<Loader2 size={14} className="animate-spin"/>:<Brain size={14}/>}Extract with AI</button>}
                <button onClick={()=>setStep("manual")} className="w-full py-1.5 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-xs transition">Fill manually instead</button>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <Lock size={18} className="text-amber-600 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm text-amber-300 font-semibold">AI extraction is a Premium feature</p>
                    <p className="text-xs text-gray-600 mt-0.5">Build your profile manually for free. Upgrade to ₹500/year for instant AI-powered extraction.</p>
                  </div>
                </div>
                <button onClick={()=>setStep("manual")} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition">Fill Manually</button>
              </>
            )}
          </div>
        )}

        {step === "manual" && (
          <ManualProfileForm userId={user.id} initialData={profile} onSave={(p)=>{setProfile(p);setAiErr("");setStep("result");}}/>
        )}

        {step === "result" && profile && (
          <div className="space-y-4">
            {aiErr ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5"/>
                <p className="text-xs text-amber-300">{aiErr}</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600"/>
                <p className="text-sm text-emerald-700 font-semibold">Profile extracted successfully!</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-gray-900 font-bold text-base">{profile.name}</p>
              <p className="text-violet-600">{profile.headline}</p>
              <p className="text-gray-600 text-xs">{profile.college} · {profile.year} · CGPA {profile.cgpa}</p>
              <div className="flex flex-wrap gap-1 pt-1">{profile.skills.slice(0,6).map(s=><span key={s} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">{s}</span>)}</div>
              {profile.summary && <p className="text-xs text-gray-600 line-clamp-2 pt-1">{profile.summary}</p>}
            </div>
            <button onClick={saveProfile} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition">Save Profile</button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={36} className="text-violet-600 animate-spin"/>
            <p className="text-sm text-gray-600">Claude AI is reading your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Multi-Select Dropdown ─────────────────────────────────────────────────────
function MultiSelectDropdown({
  options, selected, onChange, placeholder, accent = "violet",
}: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  placeholder: string; accent?: "violet" | "indigo";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const openPanel = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const panelH = 280;
      const top = spaceBelow > panelH ? r.bottom + 4 : r.top - panelH - 4;
      setPanelStyle({ position: "fixed", top, left: r.left, width: r.width, zIndex: 9999 });
    }
    setOpen(o => !o);
    if (open) setSearch("");
  };

  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]);
  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const chipCls = accent === "indigo"
    ? "bg-indigo-100 text-indigo-700 border-indigo-200"
    : "bg-violet-100 text-violet-600 border-violet-200";
  const chkCls  = accent === "indigo" ? "accent-indigo-500" : "accent-violet-500";
  const bdrOpen = accent === "indigo" ? "border-indigo-400" : "border-violet-400";

  return (
    <div>
      <button
        ref={btnRef} type="button" onClick={openPanel}
        className={`w-full bg-gray-50 border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition ${open ? bdrOpen : "border-gray-200 hover:border-gray-300"}`}
      >
        <span className={selected.length ? "text-gray-900" : "text-gray-500"}>
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-600 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(s => (
            <span key={s} className={`flex items-center gap-1 text-xs border rounded-full px-2.5 py-1 ${chipCls}`}>
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-gray-900 ml-0.5 text-sm leading-none">×</button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div ref={panelRef} style={panelStyle} className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              autoFocus
              className="w-full bg-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0
              ? <p className="text-xs text-gray-500 text-center py-4">No results for "{search}"</p>
              : filtered.map(o => (
                <label key={o} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer select-none">
                  <input type="checkbox" className={chkCls} checked={selected.includes(o)} onChange={() => toggle(o)}/>
                  <span className="text-sm text-gray-900">{o}</span>
                </label>
              ))
            }
          </div>
          <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">{selected.length} of {options.length} selected</span>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-violet-600 hover:text-violet-600 font-semibold">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualProfileForm({ userId, initialData, onSave }: { userId: string; initialData?: StudentProfile|null; onSave: (p: StudentProfile)=>void }) {
  // Lazy-init: prefer passed-in data (AI extract), then localStorage, then empty
  const [basic, setBasic] = useState(() => {
    const d = initialData || (() => {
      try { const s = localStorage.getItem(`college360_profile_${userId}`); return s ? JSON.parse(s) as StudentProfile : null; } catch { return null; }
    })();
    return {
      name: d?.name || "", cgpa: d?.cgpa || "", college: d?.college || "",
      year: d?.year || "", city: d?.contact?.city || "", email: d?.contact?.email || "",
      phone: d?.contact?.phone || "", summary: d?.summary || "",
      github: d?.github || "", linkedin: d?.linkedin || "",
    };
  });
  const [course, setCourse] = useState(() => {
    const d = initialData || (() => {
      try { const s = localStorage.getItem(`college360_profile_${userId}`); return s ? JSON.parse(s) as StudentProfile : null; } catch { return null; }
    })();
    const deg = d?.education?.[0]?.degree || d?.headline?.split('·')[0]?.trim() || "";
    return COURSE_OPTIONS.find(c => deg.toLowerCase().includes(c.split(' ')[0].toLowerCase())) || (deg ? "Other" : "");
  });
  const [courseOther, setCourseOther] = useState(() => {
    const d = initialData || (() => {
      try { const s = localStorage.getItem(`college360_profile_${userId}`); return s ? JSON.parse(s) as StudentProfile : null; } catch { return null; }
    })();
    const deg = d?.education?.[0]?.degree || d?.headline?.split('·')[0]?.trim() || "";
    return COURSE_OPTIONS.find(c => deg.toLowerCase().includes(c.split(' ')[0].toLowerCase())) ? "" : deg;
  });
  const [selSkills, setSelSkills] = useState<string[]>(() => {
    const d = initialData || (() => {
      try { const s = localStorage.getItem(`college360_profile_${userId}`); return s ? JSON.parse(s) as StudentProfile : null; } catch { return null; }
    })();
    return (d?.skills || []).filter(s => ALL_SKILLS.includes(s));
  });
  const [skillOther, setSkillOther] = useState(() => {
    const d = initialData || (() => {
      try { const s = localStorage.getItem(`college360_profile_${userId}`); return s ? JSON.parse(s) as StudentProfile : null; } catch { return null; }
    })();
    return (d?.skills || []).filter(s => !ALL_SKILLS.includes(s)).join(", ");
  });
  const [selSeeking, setSelSeeking] = useState<string[]>(() => {
    const d = initialData || (() => {
      try { const s = localStorage.getItem(`college360_profile_${userId}`); return s ? JSON.parse(s) as StudentProfile : null; } catch { return null; }
    })();
    return (d?.seeking || []).filter(s => ROLE_OPTIONS.includes(s));
  });
  const [seekingOther, setSeekingOther] = useState(() => {
    const d = initialData || (() => {
      try { const s = localStorage.getItem(`college360_profile_${userId}`); return s ? JSON.parse(s) as StudentProfile : null; } catch { return null; }
    })();
    return (d?.seeking || []).filter(s => !ROLE_OPTIONS.includes(s)).join(", ");
  });

  const save = () => {
    if (!basic.name || !basic.college) { alert("Name and college are required."); return; }
    const finalCourse = course === "Other" ? courseOther : course;
    const finalSkills = [...selSkills, ...skillOther.split(",").map(s=>s.trim()).filter(Boolean)];
    const finalSeeking = [...selSeeking, ...seekingOther.split(",").map(s=>s.trim()).filter(Boolean)];
    const p: StudentProfile = {
      name: basic.name, headline: `${finalCourse||basic.year} · ${basic.college}`,
      college: basic.college, year: basic.year, cgpa: basic.cgpa,
      contact: { city: basic.city, email: basic.email, phone: basic.phone },
      summary: basic.summary, skills: finalSkills, domains: [],
      projects: [], education: [{ degree: finalCourse, institution: basic.college, year: basic.year, score: basic.cgpa }],
      certifications: [], languages: [], github: basic.github, linkedin: basic.linkedin,
      seeking: finalSeeking, preferred_cities: [basic.city], achievements: [],
    };
    localStorage.setItem(`college360_profile_${userId}`, JSON.stringify(p));
    onSave(p);
  };

  const inp = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500";
  const sel = "w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-violet-500";

  return (
    <div className="space-y-5">
      {/* Basic Info */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Basic Info</p>
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} placeholder="Full name *" value={basic.name} onChange={e=>setBasic(b=>({...b,name:e.target.value}))}/>
          <input className={inp} placeholder="CGPA / Percentage" value={basic.cgpa} onChange={e=>setBasic(b=>({...b,cgpa:e.target.value}))}/>
        </div>
        <input className={inp} placeholder="College / University *" value={basic.college} onChange={e=>setBasic(b=>({...b,college:e.target.value}))}/>
        <div className="grid grid-cols-2 gap-3">
          <select className={sel} value={basic.year} onChange={e=>setBasic(b=>({...b,year:e.target.value}))}>
            <option value="">Year of study</option>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
          <input className={inp} placeholder="City" value={basic.city} onChange={e=>setBasic(b=>({...b,city:e.target.value}))}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} placeholder="Email" type="email" value={basic.email} onChange={e=>setBasic(b=>({...b,email:e.target.value}))}/>
          <input className={inp} placeholder="Phone" value={basic.phone} onChange={e=>setBasic(b=>({...b,phone:e.target.value}))}/>
        </div>
      </div>

      {/* Course */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Course / Degree</p>
        <select className={sel} value={course} onChange={e=>setCourse(e.target.value)}>
          <option value="">Select your course</option>
          {COURSE_OPTIONS.map(c=><option key={c}>{c}</option>)}
          <option value="Other">Other</option>
        </select>
        {course === "Other" && <input className={inp} placeholder="Enter your course / degree" value={courseOther} onChange={e=>setCourseOther(e.target.value)}/>}
      </div>

      {/* Technologies */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Technologies & Skills</p>
        <MultiSelectDropdown
          options={ALL_SKILLS}
          selected={selSkills}
          onChange={setSelSkills}
          placeholder="Select technologies & skills..."
          accent="violet"
        />
        <input className={inp} placeholder="Other skills not listed (comma-separated: Rust, GraphQL...)" value={skillOther} onChange={e=>setSkillOther(e.target.value)}/>
      </div>

      {/* Seeking */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Seeking — select all that apply</p>
        <MultiSelectDropdown
          options={ROLE_OPTIONS}
          selected={selSeeking}
          onChange={setSelSeeking}
          placeholder="Select roles you're looking for..."
          accent="indigo"
        />
        <input className={inp} placeholder="Other roles not listed (comma-separated)" value={seekingOther} onChange={e=>setSeekingOther(e.target.value)}/>
      </div>

      {/* Summary + Links */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">About & Links</p>
        <textarea className={`${inp} h-20 resize-none`} placeholder="Brief summary about yourself..." value={basic.summary} onChange={e=>setBasic(b=>({...b,summary:e.target.value}))}/>
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} placeholder="GitHub URL (optional)" value={basic.github} onChange={e=>setBasic(b=>({...b,github:e.target.value}))}/>
          <input className={inp} placeholder="LinkedIn URL (optional)" value={basic.linkedin} onChange={e=>setBasic(b=>({...b,linkedin:e.target.value}))}/>
        </div>
      </div>

      <button onClick={save} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition sticky bottom-0">Save Profile</button>
    </div>
  );
}

// ── Inline-edit primitives ────────────────────────────────────────────────────
function InlineText({ value, onSave, placeholder, className, size = "sm" }: {
  value: string; onSave: (v: string) => void;
  placeholder?: string; className?: string; size?: "sm"|"base"|"lg"|"xl";
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const confirm = () => { if (draft.trim()) onSave(draft.trim()); setEditing(false); };
  const cancel  = () => { setDraft(value); setEditing(false); };
  const sz = { sm:"text-sm", base:"text-base", lg:"text-lg font-semibold", xl:"text-xl font-bold" }[size];
  if (editing) return (
    <div className="flex items-center gap-1.5">
      <input ref={ref} value={draft} onChange={e=>setDraft(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter") confirm(); if(e.key==="Escape") cancel(); }}
        className={`flex-1 bg-gray-100 border border-violet-400 rounded px-2 py-1 text-gray-900 focus:outline-none ${sz} ${className||""}`}/>
      <button onClick={confirm} className="w-6 h-6 bg-emerald-600 hover:bg-emerald-500 rounded flex items-center justify-center shrink-0"><Check size={12} className="text-gray-900"/></button>
      <button onClick={cancel}  className="w-6 h-6 bg-gray-100 hover:bg-gray-500 rounded flex items-center justify-center shrink-0"><X size={12} className="text-gray-600"/></button>
    </div>
  );
  return (
    <div className={`group cursor-pointer flex items-center gap-1 ${className||""}`} onClick={()=>{ setDraft(value); setEditing(true); }}>
      <span className={`${sz} ${value?"":"text-gray-600 italic"}`}>{value||placeholder||"Click to edit…"}</span>
      <Pencil size={10} className="opacity-0 group-hover:opacity-40 text-violet-600 transition shrink-0"/>
    </div>
  );
}

function InlineArea({ value, onSave, placeholder, rows=4 }: {
  value: string; onSave: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const confirm = () => { onSave(draft.trim()); setEditing(false); };
  const cancel  = () => { setDraft(value); setEditing(false); };
  if (editing) return (
    <div className="space-y-2">
      <textarea value={draft} onChange={e=>setDraft(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Escape") cancel(); }}
        rows={rows} className="w-full bg-gray-100 border border-violet-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none resize-none" autoFocus/>
      <div className="flex gap-2">
        <button onClick={confirm} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-gray-900 font-semibold flex items-center gap-1"><Check size={11}/>Save</button>
        <button onClick={cancel}  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-500 rounded-lg text-xs text-gray-600">Cancel</button>
      </div>
    </div>
  );
  return (
    <div className="group relative cursor-pointer" onClick={()=>{ setDraft(value); setEditing(true); }}>
      <p className={`text-sm leading-relaxed ${value?"text-gray-700":"text-gray-600 italic"}`}>{value||placeholder||"Click to add…"}</p>
      <Pencil size={10} className="absolute top-0 right-0 opacity-0 group-hover:opacity-40 text-violet-600 transition"/>
    </div>
  );
}

function ChipEditor({ values, onSave, accent="violet" }: {
  values: string[]; onSave: (vs: string[]) => void; accent?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const cls: Record<string,string> = {
    violet: "bg-violet-100 text-violet-600 border-violet-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    emerald:"bg-emerald-100 text-emerald-700 border-emerald-200",
    amber:  "bg-amber-100  text-amber-700  border-amber-200",
    blue:   "bg-blue-100   text-blue-700   border-blue-200",
  };
  const chipCls = `border ${cls[accent]||cls.violet}`;
  const add = () => {
    const v = newVal.trim();
    if (v && !values.includes(v)) onSave([...values, v]);
    setNewVal(""); setAdding(false);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {values.map(v => (
        <span key={v} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${chipCls}`}>
          {v}<button onClick={()=>onSave(values.filter(x=>x!==v))} className="hover:text-red-600 transition ml-0.5"><X size={10}/></button>
        </span>
      ))}
      {adding ? (
        <div className="flex items-center gap-1">
          <input value={newVal} onChange={e=>setNewVal(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") add(); if(e.key==="Escape") setAdding(false); }}
            className="bg-gray-100 border border-violet-400 rounded-full px-3 py-1 text-xs text-gray-900 focus:outline-none w-32" placeholder="Type + Enter" autoFocus/>
          <button onClick={add}              className="text-emerald-600 hover:text-emerald-700"><Check size={12}/></button>
          <button onClick={()=>setAdding(false)} className="text-gray-500 hover:text-gray-600"><X size={12}/></button>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} className="px-2.5 py-1 rounded-full text-xs border border-dashed border-gray-600 text-gray-500 hover:border-violet-500 hover:text-violet-600 flex items-center gap-1 transition">
          <Plus size={10}/>Add
        </button>
      )}
    </div>
  );
}

// ── Become a Mentor Modal ────────────────────────────────────────────────────
function BecomeMentorModal({ user, onClose, onSaved }: { user: C360User|null; onClose: ()=>void; onSaved: (m: Mentor)=>void }) {
  const MENTOR_DOMAINS = DOMAINS.filter(d => d.id !== "all");
  const [form, setForm] = useState({
    name: user?.name || "", company: "", role: "", domain: "dev",
    exp: "", bio: "", skills: "", wa: user?.phone || "",
    email: user?.email || "", linkedin: "",
  });
  const [saved, setSaved] = useState(false);
  const inp = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500";

  const submit = () => {
    if (!form.name || !form.company || !form.role || !form.bio || !form.skills) {
      alert("Please fill name, company, role, bio, and skills."); return;
    }
    const mentor: Mentor = {
      id: `cm${Date.now()}`, name: form.name, role: form.role, company: form.company,
      domain: form.domain, exp: parseInt(form.exp) || 0, rating: 0, sessions: 0,
      bio: form.bio, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      wa_number: form.wa.replace(/\D/g, "").replace(/^0/, "91"),
      linkedin: form.linkedin, email: form.email,
      is_premium: false, avatar_color: clr(form.name), is_community: true,
    };
    saveMentor(mentor);
    setSaved(true);
    onSaved(mentor);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award size={18} className="text-violet-600"/>Become a Mentor
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-600 hover:text-gray-900"/></button>
        </div>
        {saved ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-emerald-600 mx-auto mb-4"/>
            <h3 className="text-gray-900 font-bold text-lg mb-2">You're listed as a mentor!</h3>
            <p className="text-gray-600 text-sm mb-1">Students can now find you in the Industry Mentors section.</p>
            <p className="text-gray-500 text-xs mb-5">Our team will reach out to verify your profile and credentials.</p>
            <button onClick={onClose} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition">Done</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-2">Share your expertise with college students. Your profile appears in the Mentors section right away.</p>
            <div className="grid grid-cols-2 gap-3">
              <input className={inp} placeholder="Full name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              <input className={inp} placeholder="Current company *" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className={inp} placeholder="Your role/title *" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}/>
              <input className={inp} placeholder="Years of experience" type="number" min="0" value={form.exp} onChange={e=>setForm(f=>({...f,exp:e.target.value}))}/>
            </div>
            <select className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-violet-500" value={form.domain} onChange={e=>setForm(f=>({...f,domain:e.target.value}))}>
              {MENTOR_DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <textarea className={`${inp} h-24 resize-none`} placeholder="Bio — what you do, who you help, how you mentor *" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/>
            <input className={inp} placeholder="Skills (comma-separated: DSA, System Design, Python) *" value={form.skills} onChange={e=>setForm(f=>({...f,skills:e.target.value}))}/>
            <div className="grid grid-cols-2 gap-3">
              <input className={inp} placeholder="WhatsApp (91XXXXXXXXXX)" value={form.wa} onChange={e=>setForm(f=>({...f,wa:e.target.value}))}/>
              <input className={inp} placeholder="Email address" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            </div>
            <input className={inp} placeholder="LinkedIn URL (optional)" value={form.linkedin} onChange={e=>setForm(f=>({...f,linkedin:e.target.value}))}/>
            <button onClick={submit} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
              <Award size={15}/>Submit Mentor Profile
            </button>
            <p className="text-xs text-gray-600 text-center">Your profile is visible to students immediately. We may contact you to verify credentials.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Apply / Enquiry Modal ─────────────────────────────────────────────────────
function ApplyModal({ opp, user, onClose, onNeedAuth, onNeedPremium }: { opp: Opportunity; user: C360User|null; onClose: ()=>void; onNeedAuth: ()=>void; onNeedPremium: ()=>void }) {
  if (!user) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <p className="text-gray-900 font-semibold mb-1">Sign in to apply</p>
        <p className="text-gray-600 text-sm mb-4">Create a free account to apply for opportunities.</p>
        <button onClick={()=>{onClose();onNeedAuth();}} className="w-full py-2 bg-violet-600 text-gray-900 rounded-lg text-sm font-semibold">Create Account</button>
      </div>
    </div>
  );
  if (opp.is_premium_only && !user.premium) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-violet-200 rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <Sparkles className="text-yellow-400 mb-2" size={24}/>
        <p className="text-gray-900 font-semibold mb-1">Premium Opportunity</p>
        <p className="text-gray-600 text-sm mb-4">This opportunity is exclusive to Premium members. Upgrade for ₹500/year.</p>
        <button onClick={()=>{onClose();onNeedPremium();}} className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold">Upgrade — ₹500/year</button>
      </div>
    </div>
  );
  const trackApply = () => { try { bumpActivity(user.id, "applications"); } catch {} };
  const mailto = `mailto:${opp.email}?subject=Application: ${encodeURIComponent(opp.title)}&body=Hi,%0A%0AI am interested in the ${encodeURIComponent(opp.title)} role at ${encodeURIComponent(opp.company)}.%0A%0AName: ${encodeURIComponent(user.name)}%0APhone: ${encodeURIComponent(user.phone)}%0A%0APlease find my profile attached.%0A%0ARegards,%0A${encodeURIComponent(user.name)}`;
  const wa = `https://wa.me/${opp.wa_number}?text=Hi+${encodeURIComponent(opp.company)}+team!+I+am+applying+for+${encodeURIComponent(opp.title)}.+My+name+is+${encodeURIComponent(user.name)},+a+college360+member.+Could+you+share+next+steps?`;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between mb-4"><h3 className="text-gray-900 font-bold">Apply Now</h3><button onClick={onClose}><X size={18} className="text-gray-600"/></button></div>
        <p className="text-sm text-gray-600 mb-1 font-semibold text-gray-900">{opp.title}</p>
        <p className="text-xs text-gray-500 mb-4">{opp.company} · {opp.city}</p>
        <div className="space-y-3">
          <a href={mailto} onClick={trackApply} className="flex items-center gap-3 w-full p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition">
            <Mail size={18} className="text-violet-600"/><div><p className="text-sm font-semibold text-gray-900">Apply via Email</p><p className="text-xs text-gray-500">Opens your email app with pre-filled message</p></div>
          </a>
          <a href={wa} onClick={trackApply} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition">
            <Send size={18} className="text-emerald-600"/><div><p className="text-sm font-semibold text-gray-900">WhatsApp the Recruiter</p><p className="text-xs text-gray-500">Instant intro message, ready to send</p></div>
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">paariwalaconnect@gmail.com will be CC'd on email applications</p>
      </div>
    </div>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────────
function OppCard({ opp, onApply }: { opp: Opportunity; onApply: (o: Opportunity)=>void }) {
  const [copied, setCopied] = useState(false);
  const shareText = `🚀 *${opp.title}* at *${opp.company}*\n📍 ${opp.city} · ${opp.type}\n💰 ${opp.stipend_min>=100000?`₹${(opp.stipend_min/100000).toFixed(1)}–${(opp.stipend_max/100000).toFixed(1)} LPA`:`₹${opp.stipend_min/1000}k–${opp.stipend_max/1000}k/mo`}\n🗓 Apply by ${new Date(opp.apply_by).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}\n\nFound via College360 → https://dplan-ebon.vercel.app/college360`;
  const shareJob = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareText).then(() => { setCopied(true); setTimeout(()=>setCopied(false), 1800); });
  };
  const shareWA = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };
  return (
    <div className="bg-white border border-gray-200 hover:border-violet-200 rounded-2xl p-4 transition group shadow-sm hover:shadow-md cursor-pointer" onClick={()=>onApply(opp)}>
      <div className="flex gap-3 mb-3">
        <div className={`w-11 h-11 rounded-xl ${opp.logo_color} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>{opp.company[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-gray-900 group-hover:text-violet-600 transition leading-snug">{opp.title}</p>
            <div className="flex items-center gap-1 shrink-0">
              {opp.is_i360 && <I360Badge/>}
              {opp.is_premium_only && <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1"><Lock size={8}/>PRO</span>}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 size={9}/>{opp.company}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${TYPE_BADGE[opp.type]}`}>{opp.type}</span>
        <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 flex items-center gap-1"><MapPin size={9}/>{opp.city}</span>
        {opp.duration && <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 flex items-center gap-1"><Clock size={9}/>{opp.duration}</span>}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{opp.desc}</p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-black text-emerald-600">{sal(opp.stipend_min, opp.stipend_max)}</span>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          {opp.is_verified && <span className="flex items-center gap-0.5 text-teal-600"><CheckCircle size={10}/>Verified</span>}
          <span>{opp.spots} spots</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <div className="flex flex-wrap gap-1 flex-1">{opp.skills.slice(0,3).map(s=><span key={s} className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s}</span>)}</div>
        <button onClick={shareWA} title="Share on WhatsApp" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition shrink-0">
          <MessageCircle size={13}/>
        </button>
        <button onClick={shareJob} title="Copy to share" className={`p-1.5 rounded-lg transition shrink-0 ${copied?"text-violet-600 bg-violet-50":"text-gray-400 hover:bg-gray-100"}`}>
          {copied ? <Check size={13}/> : <Copy size={13}/>}
        </button>
      </div>
    </div>
  );
}

// ── Profile View Modal (student / recruiter / mentor) ─────────────────────────
function ProfileViewModal({ user, onClose, onBuild }: {
  user: C360User; onClose: ()=>void; onBuild: ()=>void;
}) {
  const [sp, setSp] = useState<StudentProfile|null>(() => {
    try { const s = localStorage.getItem(PK(user.id)); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [rp, setRp] = useState<RecruiterProfile>(() => loadRP(user.id));
  const [mp, setMp] = useState<Mentor|null>(() => {
    try { return loadMentors().find(m => m.email === user.email || m.id === user.id) || null; } catch { return null; }
  });

  const saveS = (p: StudentProfile)    => { localStorage.setItem(PK(user.id), JSON.stringify(p)); setSp(p); };
  const saveR = (p: RecruiterProfile)  => { localStorage.setItem(RP(user.id), JSON.stringify(p)); setRp(p); };
  const saveM = (m: Mentor)            => { saveMentor(m); setMp(m); };

  const role = user.role;
  const avatarBg = clr(user.name);
  const initials = user.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  const gradients = {
    student:          "from-violet-100 via-indigo-100 to-violet-50",
    recruiter:        "from-blue-100 via-cyan-100 to-blue-50",
    mentor:           "from-amber-100 via-orange-100 to-amber-50",
    expert:           "from-amber-100 via-orange-100 to-amber-50",
    alumni:           "from-green-100 via-emerald-100 to-green-50",
    training_center:  "from-teal-100 via-cyan-100 to-teal-50",
    college:          "from-indigo-100 via-purple-100 to-indigo-50",
  };
  const badges: Record<C360Role, string> = {
    student:          "bg-violet-100 text-violet-700 border-violet-200",
    recruiter:        "bg-blue-100 text-blue-700 border-blue-200",
    mentor:           "bg-amber-100 text-amber-700 border-amber-200",
    expert:           "bg-orange-100 text-orange-700 border-orange-200",
    alumni:           "bg-green-100 text-green-700 border-green-200",
    training_center:  "bg-teal-100 text-teal-700 border-teal-200",
    college:          "bg-indigo-100 text-indigo-700 border-indigo-200",
  };
  const badgeLabel: Record<C360Role, string> = { student:"Student", recruiter:"Recruiter", mentor:"Industry Mentor", expert:"Expert", alumni:"Alumni", training_center:"Training Center", college:"College" };
  const badgeLabelStr = badgeLabel[role] || role;

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
      {children}
    </div>
  );

  // ── Student layout ──
  const StudentView = () => {
    if (!sp) return (
      <div className="text-center py-10 space-y-4">
        <Brain size={40} className="text-violet-400 mx-auto"/>
        <div><p className="text-gray-900 font-semibold">No profile built yet</p><p className="text-gray-500 text-sm mt-1">Use the AI Profile Builder to extract your details instantly</p></div>
        <button onClick={()=>{ onClose(); onBuild(); }} className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-sm font-bold text-white flex items-center gap-2 mx-auto">
          <Sparkles size={14}/>Build with AI
        </button>
      </div>
    );
    return (
      <div className="grid md:grid-cols-[240px_1fr] gap-5 mt-5">
        {/* Sidebar */}
        <div className="space-y-4">
          <SectionCard title="Contact">
            <div className="space-y-2 text-sm">
              {[
                { icon:<Mail size={13}/>, label: sp.contact.email, field:"email" as const },
                { icon:<Phone size={13}/>, label: sp.contact.phone, field:"phone" as const },
                { icon:<MapPin size={13}/>, label: sp.contact.city, field:"city" as const },
              ].map(({ icon, label, field }) => (
                <div key={field} className="flex items-start gap-2">
                  <span className="text-gray-500 mt-0.5 shrink-0">{icon}</span>
                  <InlineText value={label} onSave={v=>saveS({...sp, contact:{...sp.contact,[field]:v}})} placeholder={`Add ${field}`} className="text-gray-700 min-w-0"/>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Academic">
            <div className="space-y-2 text-sm">
              <div><p className="text-gray-500 text-xs mb-0.5">College</p><InlineText value={sp.college} onSave={v=>saveS({...sp,college:v})} placeholder="Add college" className="text-gray-800"/></div>
              <div><p className="text-gray-500 text-xs mb-0.5">Year</p>
                <select value={sp.year} onChange={e=>saveS({...sp,year:e.target.value})} className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none w-full">
                  {YEARS.map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
              <div><p className="text-gray-500 text-xs mb-0.5">CGPA</p><InlineText value={sp.cgpa} onSave={v=>saveS({...sp,cgpa:v})} placeholder="e.g. 8.5" className="text-gray-800"/></div>
            </div>
          </SectionCard>
          <SectionCard title="Links">
            <div className="space-y-2">
              {sp.github && <a href={sp.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-600 transition"><ExternalLink size={11}/>GitHub</a>}
              {sp.linkedin && <a href={sp.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-300 transition"><ExternalLink size={11}/>LinkedIn</a>}
              <div><p className="text-gray-500 text-[10px] mb-1">GitHub URL</p><InlineText value={sp.github||""} onSave={v=>saveS({...sp,github:v})} placeholder="https://github.com/..." className="text-xs text-gray-600"/></div>
              <div><p className="text-gray-500 text-[10px] mb-1">LinkedIn URL</p><InlineText value={sp.linkedin||""} onSave={v=>saveS({...sp,linkedin:v})} placeholder="https://linkedin.com/in/..." className="text-xs text-gray-600"/></div>
            </div>
          </SectionCard>
        </div>
        {/* Main content */}
        <div className="space-y-4">
          <SectionCard title="Summary">
            <InlineArea value={sp.summary} onSave={v=>saveS({...sp,summary:v})} placeholder="Write a short professional summary about yourself…" rows={4}/>
          </SectionCard>
          <SectionCard title="Technologies & Skills">
            <ChipEditor values={sp.skills} onSave={vs=>saveS({...sp,skills:vs})} accent="violet"/>
          </SectionCard>
          <SectionCard title="Seeking Roles">
            <ChipEditor values={sp.seeking} onSave={vs=>saveS({...sp,seeking:vs})} accent="indigo"/>
          </SectionCard>
          {sp.projects.length > 0 && (
            <SectionCard title="Projects">
              <div className="space-y-3">
                {sp.projects.map((proj, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-1.5">
                    <InlineText value={proj.name} onSave={v=>saveS({...sp,projects:sp.projects.map((p,j)=>j===i?{...p,name:v}:p)})} size="base" className="text-gray-900"/>
                    <InlineText value={proj.tech} onSave={v=>saveS({...sp,projects:sp.projects.map((p,j)=>j===i?{...p,tech:v}:p)})} placeholder="Tech stack" className="text-violet-600 text-xs"/>
                    <InlineArea value={proj.desc} onSave={v=>saveS({...sp,projects:sp.projects.map((p,j)=>j===i?{...p,desc:v}:p)})} placeholder="Describe the project…" rows={2}/>
                    <button onClick={()=>saveS({...sp,projects:sp.projects.filter((_,j)=>j!==i)})} className="text-[10px] text-red-500 hover:text-red-600">Remove project</button>
                  </div>
                ))}
                <button onClick={()=>saveS({...sp,projects:[...sp.projects,{name:"New Project",tech:"",desc:""}]})} className="text-xs text-violet-600 hover:text-violet-600 flex items-center gap-1"><Plus size={11}/>Add project</button>
              </div>
            </SectionCard>
          )}
          {sp.education.length > 0 && (
            <SectionCard title="Education">
              <div className="space-y-2">
                {sp.education.map((edu, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 bg-violet-200 rounded-full shrink-0 mt-1"/>
                    <div className="space-y-0.5">
                      <InlineText value={edu.degree} onSave={v=>saveS({...sp,education:sp.education.map((e,j)=>j===i?{...e,degree:v}:e)})} className="text-gray-900 text-sm font-semibold"/>
                      <InlineText value={edu.institution} onSave={v=>saveS({...sp,education:sp.education.map((e,j)=>j===i?{...e,institution:v}:e)})} placeholder="Institution" className="text-gray-600 text-xs"/>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <InlineText value={edu.year} onSave={v=>saveS({...sp,education:sp.education.map((e,j)=>j===i?{...e,year:v}:e)})} placeholder="Year"/>
                        <InlineText value={edu.score} onSave={v=>saveS({...sp,education:sp.education.map((e,j)=>j===i?{...e,score:v}:e)})} placeholder="Score/CGPA"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {(sp.certifications.length > 0 || sp.achievements.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              <SectionCard title="Certifications">
                <ChipEditor values={sp.certifications} onSave={vs=>saveS({...sp,certifications:vs})} accent="emerald"/>
              </SectionCard>
              <SectionCard title="Achievements">
                <ChipEditor values={sp.achievements} onSave={vs=>saveS({...sp,achievements:vs})} accent="amber"/>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Recruiter layout ──
  const RecruiterView = () => (
    <div className="grid md:grid-cols-[240px_1fr] gap-5 mt-5">
      <div className="space-y-4">
        <SectionCard title="Company">
          <div className="space-y-2 text-sm">
            <div><p className="text-gray-500 text-xs mb-0.5">Company</p><InlineText value={rp.company} onSave={v=>saveR({...rp,company:v})} placeholder="Company name" className="text-gray-900 font-semibold"/></div>
            <div><p className="text-gray-500 text-xs mb-0.5">Industry</p><InlineText value={rp.industry} onSave={v=>saveR({...rp,industry:v})} placeholder="e.g. FinTech, EdTech" className="text-gray-700"/></div>
            <div><p className="text-gray-500 text-xs mb-0.5">City</p><InlineText value={rp.city} onSave={v=>saveR({...rp,city:v})} placeholder="Location" className="text-gray-700"/></div>
          </div>
        </SectionCard>
        <SectionCard title="Contact">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail size={12} className="text-gray-500"/><InlineText value={rp.email||user.email} onSave={v=>saveR({...rp,email:v})} className="text-gray-700"/></div>
            <div className="flex items-center gap-2"><Phone size={12} className="text-gray-500"/><InlineText value={rp.phone||user.phone} onSave={v=>saveR({...rp,phone:v})} placeholder="Phone" className="text-gray-700"/></div>
            {rp.website&&<a href={rp.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-300"><Globe size={11}/>Website</a>}
            <div><p className="text-gray-500 text-[10px] mb-0.5">Website</p><InlineText value={rp.website} onSave={v=>saveR({...rp,website:v})} placeholder="https://..." className="text-xs text-gray-600"/></div>
          </div>
        </SectionCard>
      </div>
      <div className="space-y-4">
        <SectionCard title="About the Company">
          <InlineArea value={rp.bio} onSave={v=>saveR({...rp,bio:v})} placeholder="Describe your company, culture, and mission…" rows={4}/>
        </SectionCard>
        <SectionCard title="Hiring Details">
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-xs mb-1.5">We are looking for</p>
              <div className="flex gap-2">
                {(["intern","fulltime","both"] as const).map(t=>(
                  <button key={t} onClick={()=>saveR({...rp,hiring_for:t})} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${rp.hiring_for===t?"bg-blue-600 text-gray-900":"bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                    {t==="intern"?"Interns":t==="fulltime"?"Full-time":"Both"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1.5">Stipend / Salary range (₹/month)</p>
              <div className="flex items-center gap-2 text-sm">
                <input type="number" value={rp.stipend_min||""} onChange={e=>saveR({...rp,stipend_min:+e.target.value})} placeholder="Min" className="w-24 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-900 text-xs focus:outline-none focus:border-blue-500"/>
                <span className="text-gray-600">–</span>
                <input type="number" value={rp.stipend_max||""} onChange={e=>saveR({...rp,stipend_max:+e.target.value})} placeholder="Max" className="w-24 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-900 text-xs focus:outline-none focus:border-blue-500"/>
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Skills / Technologies Required">
          <ChipEditor values={rp.skills_needed} onSave={vs=>saveR({...rp,skills_needed:vs})} accent="blue"/>
        </SectionCard>
        <SectionCard title="Open Positions">
          <ChipEditor values={rp.open_positions} onSave={vs=>saveR({...rp,open_positions:vs})} accent="indigo"/>
        </SectionCard>
      </div>
    </div>
  );

  // ── Mentor layout ──
  const MentorView = () => {
    const m = mp || {
      id:`m${user.id}`, name:user.name, role:"", company:"", domain:"dev",
      exp:0, rating:0, sessions:0, bio:"", skills:[], wa_number:"",
      is_premium:false, avatar_color:clr(user.name), email:user.email, linkedin:"", is_community:true,
    } as Mentor;
    return (
      <div className="grid md:grid-cols-[240px_1fr] gap-5 mt-5">
        <div className="space-y-4">
          <SectionCard title="Professional Info">
            <div className="space-y-2 text-sm">
              <div><p className="text-gray-500 text-xs mb-0.5">Company</p><InlineText value={m.company} onSave={v=>saveM({...m,company:v})} placeholder="Your company" className="text-gray-900 font-semibold"/></div>
              <div><p className="text-gray-500 text-xs mb-0.5">Title / Role</p><InlineText value={m.role} onSave={v=>saveM({...m,role:v})} placeholder="e.g. Senior Engineer" className="text-gray-700"/></div>
              <div><p className="text-gray-500 text-xs mb-0.5">Domain</p>
                <select value={m.domain} onChange={e=>saveM({...m,domain:e.target.value})} className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none w-full">
                  {DOMAINS.filter(d=>d.id!=="all").map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div><p className="text-gray-500 text-xs mb-0.5">Years of Experience</p>
                <input type="number" value={m.exp||""} onChange={e=>saveM({...m,exp:+e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-amber-500"/>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Contact">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Mail size={12} className="text-gray-500 shrink-0"/><InlineText value={m.email||""} onSave={v=>saveM({...m,email:v})} placeholder="Email" className="text-gray-700 text-xs min-w-0"/></div>
              <div className="flex items-center gap-2"><Phone size={12} className="text-gray-500 shrink-0"/><InlineText value={m.wa_number} onSave={v=>saveM({...m,wa_number:v.replace(/\D/g,"").replace(/^0/,"91")})} placeholder="WhatsApp number" className="text-gray-700 text-xs min-w-0"/></div>
              {m.linkedin&&<a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-amber-600 hover:text-amber-300 transition"><ExternalLink size={11}/>LinkedIn</a>}
              <div><p className="text-gray-500 text-[10px] mb-0.5">LinkedIn URL</p><InlineText value={m.linkedin||""} onSave={v=>saveM({...m,linkedin:v})} placeholder="https://linkedin.com/in/..." className="text-xs text-gray-600"/></div>
            </div>
          </SectionCard>
          <SectionCard title="Stats">
            <div className="flex gap-4">
              <div className="text-center"><p className="text-xl font-black text-amber-600">{m.rating>0?m.rating.toFixed(1):"–"}</p><p className="text-[10px] text-gray-500">Rating</p></div>
              <div className="text-center"><p className="text-xl font-black text-gray-900">{m.sessions}</p><p className="text-[10px] text-gray-500">Sessions</p></div>
              <div className="text-center"><p className="text-xl font-black text-emerald-600">{m.exp||0}</p><p className="text-[10px] text-gray-500">Yrs exp</p></div>
            </div>
          </SectionCard>
        </div>
        <div className="space-y-4">
          <SectionCard title="Bio / About">
            <InlineArea value={m.bio} onSave={v=>saveM({...m,bio:v})} placeholder="Write about your experience, what you can help students with, and your mentoring style…" rows={5}/>
          </SectionCard>
          <SectionCard title="Skills & Expertise">
            <ChipEditor values={m.skills} onSave={vs=>saveM({...m,skills:vs})} accent="amber"/>
          </SectionCard>
        </div>
      </div>
    );
  };

  const headline = role==="student" ? (sp?.headline||"") : role==="recruiter" ? (rp.designation||user.name) : (mp?.role||"");
  const subline  = role==="student" ? (sp?.college||"") : role==="recruiter" ? rp.company : (mp?.company||"");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl my-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
        {/* Banner */}
        <div className={`h-24 rounded-t-2xl bg-gradient-to-r ${gradients[role as keyof typeof gradients]||gradients.student} relative`}>
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 bg-black/30 rounded-full p-1.5 transition"><X size={16}/></button>
          {role==="student" && (
            <button onClick={()=>{ onClose(); onBuild(); }} className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-100 border border-violet-200 hover:bg-violet-200 rounded-full px-3 py-1.5 transition">
              <Sparkles size={11}/>AI Builder
            </button>
          )}
        </div>
        {/* Identity */}
        <div className="px-6 pb-2">
          <div className="flex items-end gap-4 -mt-10 mb-1">
            <div className={`w-20 h-20 rounded-2xl ${avatarBg} flex items-center justify-center text-white text-2xl font-black shadow-xl border-4 border-white shrink-0`}>{initials}</div>
            <div className="flex-1 pb-1 min-w-0">
              {role==="student"&&sp ? (
                <InlineText value={sp.name} onSave={v=>saveS({...sp,name:v})} size="xl" className="text-gray-900"/>
              ) : role==="recruiter" ? (
                <InlineText value={rp.designation||user.name} onSave={v=>saveR({...rp,designation:v})} placeholder="Your designation" size="xl" className="text-gray-900"/>
              ) : mp ? (
                <InlineText value={mp.name} onSave={v=>saveM({...mp,name:v})} size="xl" className="text-gray-900"/>
              ) : (
                <p className="text-xl font-bold text-gray-900">{user.name}</p>
              )}
              {role==="student"&&sp && <InlineText value={sp.headline} onSave={v=>saveS({...sp,headline:v})} placeholder="Add headline…" className="text-violet-600 text-sm mt-0.5"/>}
              {role==="recruiter" && <InlineText value={rp.company} onSave={v=>saveR({...rp,company:v})} placeholder="Company name…" className="text-blue-600 text-sm mt-0.5"/>}
              {role==="mentor"&&mp && <p className="text-amber-600 text-sm mt-0.5">{mp.role}{mp.company?` · ${mp.company}`:""}</p>}
              {subline && headline && <p className="text-gray-500 text-xs mt-0.5">{subline}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${badges[role]||badges.student}`}>{badgeLabelStr}</span>
          </div>
        </div>
        {/* Role content */}
        <div className="px-6 pb-6">
          {role==="student"   && <StudentView/>}
          {role==="recruiter" && <RecruiterView/>}
          {role==="mentor"    && <MentorView/>}
        </div>
      </div>
    </div>
  );
}

// ── Interview Question Agent ──────────────────────────────────────────────────
const IQ_QUOTA_KEY = (id: string) => `c360_iq_${id}_${new Date().toISOString().slice(0, 7)}`;
const FREE_IQ_QUOTA = 50;

interface IQSession { id: string; tech: string; role: string; diff: string; date: string; questions: Array<{q:string;a:string}>; }

function InterviewQModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const [tech, setTech] = useState("");
  const [role, setRole] = useState("");
  const [diff, setDiff] = useState<"Easy"|"Medium"|"Hard">("Medium");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Array<{q:string;a:string}>>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [err, setErr] = useState("");
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const v = parseInt(localStorage.getItem(IQ_QUOTA_KEY(user.id)) || "0");
    setQuotaUsed(v);
  }, [user.id]);

  const remaining = user.premium ? Infinity : Math.max(0, FREE_IQ_QUOTA - quotaUsed);

  async function generate() {
    if (!tech) { setErr("Select a technology first."); return; }
    if (!role) { setErr("Select a target role first."); return; }
    if (!user.premium && quotaUsed >= FREE_IQ_QUOTA) { setErr("Free quota of 50 questions reached this month. Upgrade to Premium for unlimited access."); return; }
    setLoading(true); setErr(""); setQuestions([]); setRevealed(new Set()); setSaved(false);
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 55000);
      const r = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technology: tech, role, difficulty: diff, count: 10 }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      const d = await r.json();
      if (d.success && d.questions?.length) {
        setQuestions(d.questions);
        const newUsed = quotaUsed + d.questions.length;
        localStorage.setItem(IQ_QUOTA_KEY(user.id), String(newUsed));
        setQuotaUsed(newUsed);
      } else {
        setErr(d.error || "AI failed to generate questions. Try again.");
      }
    } catch (e: any) {
      setErr(e?.name === "AbortError" ? "Request timed out — please try again." : (e?.message || "Network error."));
    }
    setLoading(false);
  }

  function saveSession() {
    const key = `c360_iq_sessions_${user.id}`;
    let sessions: IQSession[] = [];
    try { sessions = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    sessions.unshift({ id: `iq${Date.now()}`, tech, role, diff, date: new Date().toISOString(), questions });
    localStorage.setItem(key, JSON.stringify(sessions.slice(0, 10)));
    setSaved(true);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Brain size={16} className="text-teal-600"/>
            </div>
            <div>
              <span className="font-bold text-gray-900">Interview Question Agent</span>
              <span className="text-xs text-teal-700 ml-2 bg-teal-100 px-2 py-0.5 rounded-full">AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!user.premium && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${remaining > 10 ? "bg-teal-100 text-teal-700" : remaining > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                {remaining === Infinity ? "Unlimited" : `${remaining} left`}
              </span>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition p-1"><X size={18}/></button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 flex-shrink-0 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1.5 block font-medium">Technology / Stack</label>
              <select value={tech} onChange={e => setTech(e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-teal-400">
                <option value="">Select technology…</option>
                {TECH_GROUPS.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map(item => <option key={item} value={item}>{item}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1.5 block font-medium">Target Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-teal-400">
                <option value="">Select role…</option>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Difficulty</label>
            <div className="flex gap-2">
              {(["Easy","Medium","Hard"] as const).map(d => (
                <button key={d} onClick={() => setDiff(d)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${diff === d ? "bg-teal-100 border-teal-500 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700"}`}>{d}</button>
              ))}
            </div>
          </div>

          {err && <div className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

          <button onClick={generate} disabled={loading || !tech || !role} className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin"/>Generating 10 questions…</> : <><Brain size={15}/>Generate 10 Questions</>}
          </button>
        </div>

        {/* Q&A list */}
        {questions.length > 0 && (
          <div className="overflow-y-auto flex-1 p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{tech} · {role} · {diff} — {questions.length} questions</span>
              <button onClick={saveSession} disabled={saved} className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${saved ? "border-teal-200 text-teal-600 bg-teal-100 cursor-default" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"}`}>
                {saved ? <><Check size={11} className="inline mr-1"/>Saved</> : "Save Session"}
              </button>
            </div>
            {questions.map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                <p className="text-sm font-semibold text-gray-900 mb-2 leading-relaxed">Q{i + 1}. {item.q}</p>
                {revealed.has(i) ? (
                  <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-2 mt-2">{item.a}</p>
                ) : (
                  <button onClick={() => setRevealed(prev => new Set([...prev, i]))} className="text-xs text-teal-600 hover:text-teal-700 transition font-medium">
                    ▶ Reveal Answer
                  </button>
                )}
              </div>
            ))}

            {!user.premium && quotaUsed > 30 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mt-4">
                <p className="text-amber-600 text-sm font-semibold mb-1">Running low on free questions</p>
                <p className="text-gray-600 text-xs">Used {quotaUsed} of {FREE_IQ_QUOTA} this month. Upgrade for unlimited practice sessions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notifications Panel ────────────────────────────────────────────────────────
interface C360Notif { id: string; type: "system"|"action"|"info"; title: string; body: string; time: string; read: boolean; }
const NOTIF_KEY = (id: string) => `c360_notifs_${id}`;

function loadNotifs(uid: string): C360Notif[] {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY(uid)) || "[]"); } catch { return []; }
}
function saveNotifs(uid: string, notifs: C360Notif[]) {
  localStorage.setItem(NOTIF_KEY(uid), JSON.stringify(notifs.slice(0, 50)));
}
function pushNotif(uid: string, n: Omit<C360Notif,"id"|"time"|"read">) {
  const all = loadNotifs(uid);
  all.unshift({ ...n, id: `n${Date.now()}`, time: new Date().toISOString(), read: false });
  saveNotifs(uid, all);
}

function NotificationsPanel({ user }: { user: C360User }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<C360Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setNotifs(loadNotifs(user.id)); }, [user.id, open]);

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function markAllRead() {
    const updated = notifs.map(n => ({ ...n, read: true }));
    saveNotifs(user.id, updated);
    setNotifs(updated);
  }

  const unread = notifs.filter(n => !n.read).length;
  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative p-1.5 text-gray-600 hover:text-gray-900 transition">
        {unread > 0 ? <BellDot size={18} className="text-teal-600"/> : <Bell size={18}/>}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-500 rounded-full text-[9px] font-bold text-gray-900 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unread > 0 && <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-700 transition">Mark all read</button>}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="text-gray-600 mx-auto mb-2"/>
                <p className="text-xs text-gray-500">No notifications yet</p>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-100 last:border-0 ${n.read ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-gray-300" : n.type === "action" ? "bg-teal-500" : n.type === "info" ? "bg-blue-500" : "bg-amber-500"}`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-500 text-center">Notifications are stored on this device only</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Change Password Modal ──────────────────────────────────────────────────────
function ChangePasswordModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [conf, setConf] = useState("");
  const [err, setErr] = useState(""); const [ok, setOk] = useState(false); const [loading, setLoading] = useState(false);
  async function submit() {
    setErr("");
    if (!cur || !next || !conf) { setErr("All fields are required."); return; }
    if (next.length < 6) { setErr("New password must be at least 6 characters."); return; }
    if (next !== conf) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const loginRes = await c360Fetch("/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password: cur }) });
      if (!loginRes.success) { setErr("Current password is incorrect."); return; }
      const resetRes = await c360Fetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ email: user.email, newPassword: next }) });
      if (!resetRes.success) { setErr(resetRes.error || "Failed to update password."); return; }
      setOk(true); setTimeout(onClose, 1500);
    } catch { setErr("Network error. Please try again."); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Key size={15} className="text-teal-600"/>Change Password</span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-3">
          {ok ? <div className="text-center py-4"><CheckCircle size={32} className="text-emerald-500 mx-auto mb-2"/><p className="text-sm font-semibold text-gray-900">Password updated!</p></div> : <>
            {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{err}</div>}
            {[["Current Password", cur, setCur], ["New Password (min 6 chars)", next, setNext], ["Confirm New Password", conf, setConf]].map(([lbl, val, set]: any) => (
              <div key={lbl}><label className="text-xs font-semibold text-gray-600 mb-1 block">{lbl}</label>
                <input type="password" value={val} onChange={e=>set(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" placeholder="••••••••"/>
              </div>
            ))}
            <button onClick={submit} disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 flex items-center justify-center gap-2 mt-1">{loading && <Loader2 size={14} className="animate-spin"/>}Update Password</button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Account Settings Modal ─────────────────────────────────────────────────────
function AccountSettingsModal({ user, onClose, onUpdate }: { user: C360User; onClose: () => void; onUpdate: (u: C360User) => void }) {
  const [name, setName] = useState(user.name); const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || ""); const [college, setCollege] = useState(user.college || "");
  const [year, setYear] = useState(user.year || ""); const [err, setErr] = useState(""); const [ok, setOk] = useState(false); const [saving, setSaving] = useState(false);
  async function save() {
    setErr(""); if (!name.trim() || !email.trim()) { setErr("Name and email are required."); return; }
    setSaving(true);
    try {
      const res = await c360Fetch("/auth/me", { method: "PUT", body: JSON.stringify({ name: name.trim(), phone: phone.trim(), college: college.trim(), year: year.trim() }) });
      if (!res.success) { setErr(res.error || "Failed to save."); return; }
      const updated = { ...user, name: name.trim(), email: email.trim(), phone: phone.trim(), college: college.trim(), year: year.trim() };
      saveSess(updated); onUpdate(updated); setOk(true); setTimeout(onClose, 1200);
    } catch { setErr("Network error. Please try again."); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Users size={15} className="text-teal-600"/>Personal Information</span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-3">
          {ok && <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700 text-center font-semibold">Saved!</div>}
          {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{err}</div>}
          {([["Full Name", name, setName, "text", "Your full name"], ["Email", email, setEmail, "email", "your@email.com"], ["Phone", phone, setPhone, "tel", "+91 9999999999"], ["College / University", college, setCollege, "text", "Your institution"], ["Year / Batch", year, setYear, "text", "e.g. 3rd Year, 2025"]] as const).map(([lbl, val, set, type, ph]: any) => (
            <div key={lbl}><label className="text-xs font-semibold text-gray-600 mb-1 block">{lbl}</label>
              <input type={type} value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" placeholder={ph}/>
            </div>
          ))}
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Role: <span className="font-semibold text-gray-700 capitalize">{user.role}</span> · Since {new Date(user.createdAt).toLocaleDateString("en-IN",{month:"short",year:"numeric"})}</p>
          </div>
          <button onClick={save} disabled={saving} className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 flex items-center justify-center gap-2">{saving && <Loader2 size={14} className="animate-spin"/>}Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Friends Modal ───────────────────────────────────────────────────────
function InviteFriendsModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const [copied, setCopied] = useState(false); const [emailTo, setEmailTo] = useState(""); const [emailSent, setEmailSent] = useState(false);
  const [log, setLog] = useState<InviteLog>(() => loadInvites(user.id));
  const refLink = `https://dplan-ebon.vercel.app/college360?ref=${user.id}`;
  function recordAndRefresh(method: "copy"|"whatsapp"|"email", to?: string) {
    pushInvite(user.id, method, to);
    setLog(loadInvites(user.id));
  }
  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    recordAndRefresh("copy");
    pushNotif(user.id, { type:"info", title:"Invite link copied", body:"Share it with friends to earn credit when they join College360." });
  }
  function shareWhatsApp() {
    const msg = encodeURIComponent(`Hey! I've been using College360 — an AI-powered career platform for college students. Find internships, prep for interviews, connect with mentors. Join free: ${refLink}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    recordAndRefresh("whatsapp");
  }
  function sendEmail() {
    if (!emailTo.trim()) return;
    const s = encodeURIComponent("Join me on College360 — AI Career Platform for Students");
    const b = encodeURIComponent(`Hi!\n\nI've been using College360 — it's an AI-powered platform for college students to find internships, practice interviews with AI, and connect with industry mentors.\n\nJoin free using my link: ${refLink}\n\nSee you there!\n${user.name}`);
    window.open(`mailto:${emailTo}?subject=${s}&body=${b}`, "_blank");
    setEmailSent(true); setTimeout(() => { setEmailSent(false); setEmailTo(""); }, 2000);
    recordAndRefresh("email", emailTo.trim());
    pushNotif(user.id, { type:"info", title:"Invite sent", body:`Invite emailed to ${emailTo}.` });
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Share2 size={15} className="text-teal-600"/>Invite Friends</span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-teal-600">{log.total}</p>
                <p className="text-xs text-teal-700">Total Invites Sent</p>
              </div>
              <div className="flex gap-4 text-center">
                <div><p className="text-lg font-black text-violet-600">{log.events.filter(e=>e.method==="copy").length}</p><p className="text-[10px] text-gray-500">Link</p></div>
                <div><p className="text-lg font-black text-emerald-600">{log.events.filter(e=>e.method==="whatsapp").length}</p><p className="text-[10px] text-gray-500">WhatsApp</p></div>
                <div><p className="text-lg font-black text-blue-600">{log.events.filter(e=>e.method==="email").length}</p><p className="text-[10px] text-gray-500">Email</p></div>
              </div>
            </div>
            {log.events.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                {log.events.slice(0,5).map((e,i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] text-teal-800 bg-white/60 rounded px-2 py-1">
                    <span>{e.method==="copy"?"🔗 Link copied":e.method==="whatsapp"?"💬 WhatsApp":`✉️ Email${e.to?" → "+e.to:""}`}</span>
                    <span className="text-teal-500">{new Date(e.ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Your invite link</p>
            <div className="flex gap-2">
              <input value={refLink} readOnly className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 focus:outline-none"/>
              <button onClick={copyLink} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${copied?"bg-emerald-100 border-emerald-200 text-emerald-600 border":"bg-gray-100 border-gray-200 text-gray-700 border hover:bg-gray-200"}`}>
                {copied ? <><CheckCircle size={12}/>Copied!</> : <><Copy size={12}/>Copy</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={shareWhatsApp} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 transition">
              <MessageCircle size={15}/>WhatsApp
            </button>
            <button onClick={copyLink} className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
              <Link2 size={15}/>Copy Link
            </button>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Invite by email</p>
            <div className="flex gap-2">
              <input type="email" value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="friend@email.com" onKeyDown={e=>e.key==="Enter"&&sendEmail()} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"/>
              <button onClick={sendEmail} className="shrink-0 px-3 py-2 bg-teal-100 hover:bg-teal-200 border border-teal-200 rounded-lg text-xs font-semibold text-teal-700 transition flex items-center gap-1">
                {emailSent ? <CheckCircle size={12}/> : <Mail size={12}/>}{emailSent ? "Sent!" : "Send"}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center">All invites and referrals are tracked on this device only for MVP.</p>
        </div>
      </div>
    </div>
  );
}

// ── Setup Profile Modal (College / Expert / Training Center) ──────────────────
function SetupProfileModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const type = user.role === "college" ? "college" : user.role === "training_center" ? "training_center" : "expert";
  const [step, setStep] = useState<"name"|"form"|"done">("name");
  const [nameInput, setNameInput] = useState(user.name || "");
  const [cityInput, setCityInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<Record<string, any>>({});

  const aiSearch = async () => {
    if (!nameInput.trim()) { setErr("Enter a name first"); return; }
    setAiLoading(true); setErr("");
    try {
      const res = await fetch("/api/c360-setup", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type, name: nameInput.trim(), city: cityInput.trim() || undefined }) });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      setForm(d.data || {});
      setStep("form");
    } catch (e: any) { setErr(e.message || "AI search failed. Enter details manually."); setStep("form"); }
    finally { setAiLoading(false); }
  };

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const endpoint = type === "college" ? "/setup/college" : type === "expert" ? "/setup/expert" : "/setup/training-center";
      const payload = type === "expert"
        ? { ...form }
        : { ...form, name: form.name || nameInput.trim(), city: form.city || cityInput || undefined };
      const res = await c360Fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (!res.success) throw new Error(res.error);
      setStep("done");
    } catch (e: any) { setErr(e.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const typeLabel = type === "college" ? "College / University" : type === "training_center" ? "Training Center" : "Expert Profile";
  const typeIcon = type === "college" ? "🏛️" : type === "training_center" ? "🏫" : "💡";

  const Field = ({ label, field, placeholder, textarea }: { label: string; field: string; placeholder?: string; textarea?: boolean }) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      {textarea
        ? <textarea rows={3} value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"/>
        : <input value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"/>
      }
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="text-lg">{typeIcon}</span>{typeLabel} Setup
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">i360</span>
          </span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-4">
          {step === "done" ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle size={26} className="text-green-600"/></div>
              <p className="text-base font-bold text-gray-900">Profile submitted!</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Your profile is live in the Directory with an <span className="font-semibold text-amber-600">i360 Not Verified</span> badge. Our team will verify it shortly.</p>
              <button onClick={onClose} className="mt-5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition">Done</button>
            </div>
          ) : step === "name" ? (
            <>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-700">Enter your {typeLabel.toLowerCase()} name and click <strong>AI Search</strong> — we'll auto-fill your profile from our knowledge base. You can edit before saving.</div>
              {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{err}</div>}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{typeLabel} Name *</label>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder={`e.g. ${type==="expert"?"Dr. Rajesh Kumar":type==="college"?"BITS Pilani":"Aptech Computer Education"}`}/>
              </div>
              {type !== "expert" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">City (optional)</label>
                  <input value={cityInput} onChange={e=>setCityInput(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="e.g. Bangalore"/>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={aiSearch} disabled={aiLoading} className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition">
                  {aiLoading ? <><Loader2 size={14} className="animate-spin"/>Searching...</> : <><Sparkles size={14}/>AI Search</>}
                </button>
                <button onClick={()=>setStep("form")} className="py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-600 transition">Enter manually</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                <AlertCircle size={13} className="shrink-0"/><span>Review and edit the AI-filled details before saving. Profile will be marked <strong>i360 Not Verified</strong> until reviewed.</span>
              </div>
              {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{err}</div>}

              {type === "college" && (<>
                <Field label="College Name *" field="name" placeholder="Full official name"/>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" field="city" placeholder="City"/>
                  <Field label="State" field="state" placeholder="State"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type" field="college_type" placeholder="Engineering / Arts / Medical"/>
                  <Field label="Established Year" field="established_year" placeholder="e.g. 1985"/>
                </div>
                <Field label="Accreditation" field="accreditation" placeholder="e.g. NAAC A+, NBA, NIRF #42"/>
                <Field label="Ranking" field="ranking" placeholder="e.g. NIRF #42"/>
                <Field label="Website" field="website" placeholder="https://"/>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Programs (comma-separated)</label>
                  <input value={Array.isArray(form.programs)?form.programs.join(", "):form.programs||""} onChange={e=>setForm(f=>({...f,programs:e.target.value.split(",").map((s:string)=>s.trim()).filter(Boolean)}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="B.Tech, MBA, M.Tech, BCA"/>
                </div>
                <Field label="Description" field="description" placeholder="About the institution..." textarea/>
                <Field label="Placement Stats" field="placement_stats" placeholder="e.g. Avg 8 LPA, 95% placed"/>
              </>)}

              {type === "expert" && (<>
                <Field label="Designation *" field="designation" placeholder="e.g. Senior Software Engineer"/>
                <Field label="Company" field="company" placeholder="e.g. Microsoft India"/>
                <Field label="Industry" field="industry" placeholder="e.g. Technology"/>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Years of Experience</label>
                  <input type="number" min={0} max={50} value={form.years_experience||""} onChange={e=>setForm(f=>({...f,years_experience:parseInt(e.target.value)||undefined}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="e.g. 8"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Skills (comma-separated)</label>
                  <input value={Array.isArray(form.skills)?form.skills.join(", "):form.skills||""} onChange={e=>setForm(f=>({...f,skills:e.target.value.split(",").map((s:string)=>s.trim()).filter(Boolean)}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="Python, Machine Learning, AWS"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Expertise Areas (comma-separated)</label>
                  <input value={Array.isArray(form.expertise_areas)?form.expertise_areas.join(", "):form.expertise_areas||""} onChange={e=>setForm(f=>({...f,expertise_areas:e.target.value.split(",").map((s:string)=>s.trim()).filter(Boolean)}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="AI/ML, Cloud Architecture"/>
                </div>
                <Field label="LinkedIn URL" field="linkedin" placeholder="https://linkedin.com/in/"/>
                <Field label="Bio" field="bio" placeholder="Short professional bio..." textarea/>
              </>)}

              {type === "training_center" && (<>
                <Field label="Training Center Name *" field="name" placeholder="Full name"/>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" field="city" placeholder="City"/>
                  <Field label="State" field="state" placeholder="State"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Courses Offered (comma-separated)</label>
                  <input value={Array.isArray(form.courses)?form.courses.join(", "):form.courses||""} onChange={e=>setForm(f=>({...f,courses:e.target.value.split(",").map((s:string)=>s.trim()).filter(Boolean)}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="Full Stack Dev, Data Science, Java"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Certifications (comma-separated)</label>
                  <input value={Array.isArray(form.certifications)?form.certifications.join(", "):form.certifications||""} onChange={e=>setForm(f=>({...f,certifications:e.target.value.split(",").map((s:string)=>s.trim()).filter(Boolean)}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="AWS Certified, ISTQB"/>
                </div>
                <Field label="Fee Range" field="fee_range" placeholder="e.g. ₹15,000 – ₹50,000"/>
                <Field label="Website" field="website" placeholder="https://"/>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="ps" checked={form.placement_support||false} onChange={e=>setForm(f=>({...f,placement_support:e.target.checked}))} className="rounded"/>
                  <label htmlFor="ps" className="text-xs font-semibold text-gray-700">Placement support offered</label>
                </div>
                <Field label="Description" field="description" placeholder="About the training center..." textarea/>
              </>)}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={()=>setStep("name")} className="py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-600 transition">← Back</button>
                <button onClick={save} disabled={saving} className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition">
                  {saving ? <><Loader2 size={14} className="animate-spin"/>Saving...</> : <><CheckCircle size={14}/>Save Profile</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Directory Tab ──────────────────────────────────────────────────────────────
interface DirEntry { entity_type: string; id: string; name: string; i360_verified: boolean; created_at: string;
  city?: string; state?: string; description?: string; programs?: string[]; accreditation?: string; ranking?: string; website?: string;
  designation?: string; company?: string; industry?: string; skills?: string[]; bio?: string; years_experience?: number;
  courses?: string[]; certifications?: string[]; fee_range?: string; placement_support?: boolean;
}
function DirectoryTab({ user, onSetup }: { user: C360User|null; onSetup: ()=>void }) {
  const [data, setData] = useState<{ colleges: DirEntry[]; experts: DirEntry[]; training_centers: DirEntry[] }>({ colleges:[], experts:[], training_centers:[] });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all"|"college"|"expert"|"training_center">("all");
  const [expanded, setExpanded] = useState<string|null>(null);

  const load = (search = "") => {
    setLoading(true);
    c360Fetch(`/directory${search ? `?q=${encodeURIComponent(search)}&type=${typeFilter}` : `?type=${typeFilter}`}`)
      .then(r => { if (r.success) setData(r.data); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); }, [typeFilter]);

  const all: DirEntry[] = [
    ...(typeFilter==="all"||typeFilter==="college" ? data.colleges : []),
    ...(typeFilter==="all"||typeFilter==="expert" ? data.experts : []),
    ...(typeFilter==="all"||typeFilter==="training_center" ? data.training_centers : []),
  ];

  const VerifiedBadge = ({ v }: { v: boolean }) => v
    ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-0.5"><CheckCircle size={9}/>i360 Verified</span>
    : <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5"><AlertCircle size={9}/>i360 Not Verified</span>;

  const typeIcon = (t: string) => t==="college"?"🏛️":t==="expert"?"💡":"🏫";
  const typeColor = (t: string) => t==="college"?"text-indigo-700 bg-indigo-50 border-indigo-200":t==="expert"?"text-amber-700 bg-amber-50 border-amber-200":"text-teal-700 bg-teal-50 border-teal-200";
  const typeLabel = (t: string) => t==="college"?"College":t==="expert"?"Expert":"Training Center";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">College360 Directory</h2>
          <p className="text-xs text-gray-500 mt-0.5">Colleges, Experts & Training Centers — all in one place</p>
        </div>
        {user && (user.role==="expert"||user.role==="training_center"||user.role==="college") && (
          <button onClick={onSetup} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition">
            <Sparkles size={12}/>Setup My Profile
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Search size={13} className="text-gray-400 shrink-0"/>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load(q)} placeholder="Search colleges, experts, training centers…" className="text-sm bg-transparent placeholder-gray-400 outline-none w-full text-gray-900"/>
        </div>
        <button onClick={()=>load(q)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition">Search</button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {(["all","college","expert","training_center"] as const).map(t => (
          <button key={t} onClick={()=>setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${typeFilter===t?"bg-indigo-600 text-white border-indigo-600":"border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
            {t==="all"?"All":t==="training_center"?"Training Centers":typeLabel(t)+"s"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-indigo-400" size={28}/></div>
      ) : all.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Globe size={32} className="text-gray-300 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-gray-500">No entries yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to add a college, expert, or training center to the directory.</p>
          {user && (user.role==="expert"||user.role==="training_center"||user.role==="college") && (
            <button onClick={onSetup} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition mx-auto"><Sparkles size={12}/>Setup My Profile</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {all.map(e => (
            <div key={e.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 transition">
              <button onClick={()=>setExpanded(expanded===e.id?null:e.id)} className="w-full text-left p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl shrink-0 mt-0.5">{typeIcon(e.entity_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">{e.name}</p>
                        <VerifiedBadge v={e.i360_verified}/>
                      </div>
                      {e.entity_type==="expert" && e.designation && <p className="text-xs text-gray-500 mt-0.5">{e.designation}{e.company?` · ${e.company}`:""}</p>}
                      {e.entity_type!=="expert" && (e.city||e.state) && <p className="text-xs text-gray-500 mt-0.5">{[e.city,e.state].filter(Boolean).join(", ")}</p>}
                      <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor(e.entity_type)}`}>{typeLabel(e.entity_type)}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className={`text-gray-400 shrink-0 mt-1 transition-transform ${expanded===e.id?"rotate-90":""}`}/>
                </div>
              </button>
              {expanded===e.id && (
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                  {e.description && <p className="text-xs text-gray-600 leading-relaxed">{e.description}</p>}
                  {e.entity_type==="college" && (<>
                    {e.accreditation && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Award size={12} className="text-indigo-400"/>{e.accreditation}</div>}
                    {e.ranking && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Star size={12} className="text-amber-400"/>{e.ranking}</div>}
                    {e.programs?.length ? <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Programs</p><div className="flex flex-wrap gap-1">{e.programs.map(p=><span key={p} className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{p}</span>)}</div></div> : null}
                  </>)}
                  {e.entity_type==="expert" && (<>
                    {e.industry && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Briefcase size={12} className="text-amber-400"/>{e.industry}{e.years_experience?` · ${e.years_experience}y exp`:""}</div>}
                    {e.skills?.length ? <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Skills</p><div className="flex flex-wrap gap-1">{e.skills.map(s=><span key={s} className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">{s}</span>)}</div></div> : null}
                    {e.bio && <p className="text-xs text-gray-600 italic">"{e.bio}"</p>}
                  </>)}
                  {e.entity_type==="training_center" && (<>
                    {e.fee_range && <div className="flex items-center gap-1.5 text-xs text-gray-500"><CreditCard size={12} className="text-teal-400"/>{e.fee_range}</div>}
                    {e.placement_support && <div className="flex items-center gap-1.5 text-xs text-green-600"><CheckCircle size={12}/>Placement support</div>}
                    {e.courses?.length ? <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Courses</p><div className="flex flex-wrap gap-1">{e.courses.map(c=><span key={c} className="text-[10px] bg-teal-100 text-teal-700 rounded-full px-2 py-0.5">{c}</span>)}</div></div> : null}
                    {e.certifications?.length ? <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Certifications</p><div className="flex flex-wrap gap-1">{e.certifications.map(c=><span key={c} className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{c}</span>)}</div></div> : null}
                  </>)}
                  {e.website && <a href={e.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"><Globe size={11}/>{e.website}</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Study Planner Modal ────────────────────────────────────────────────────────
function StudyPlannerModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const [savedPlan, setSavedPlan] = useState<C360StudyPlan|null>(() => { try { const s=localStorage.getItem(SPK(user.id)); return s?JSON.parse(s):null; } catch { return null; } });
  const [usageCount, setUsageCount] = useState<number>(() => { try { return parseInt(localStorage.getItem(SPC(user.id))||"0")||0; } catch { return 0; } });
  const [goal, setGoal] = useState(""); const [tech, setTech] = useState(""); const [level, setLevel] = useState("beginner");
  const [hpw, setHpw] = useState("10"); const [weeks, setWeeks] = useState("4");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const [expandedWeek, setExpandedWeek] = useState<number|null>(0);
  const [exampleCache, setExampleCache] = useState<Record<string, {explanation:string;code:string;language:string;practice:string}>>({});
  const [loadingExample, setLoadingExample] = useState<string|null>(null);
  const [showAddTopic, setShowAddTopic] = useState<number|null>(null);
  const [newDay, setNewDay] = useState("Monday");
  const [newTopic, setNewTopic] = useState("");
  const [newTasks, setNewTasks] = useState("");
  const [newResource, setNewResource] = useState("");

  const FREE_LIMIT = 2;
  const isLocked = !user.premium && usageCount >= FREE_LIMIT && !savedPlan;

  async function fetchExample(key: string, topic: string) {
    if (exampleCache[key] || loadingExample === key || !savedPlan) return;
    setLoadingExample(key);
    try {
      const res = await fetch("/api/study-plan-example", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ topic, technology: savedPlan.tech }),
      });
      const d = await res.json();
      if (d.success) setExampleCache(prev => ({ ...prev, [key]: d.example }));
    } catch {}
    setLoadingExample(null);
  }

  function addCustomTopic(weekIdx: number) {
    if (!newTopic.trim() || !savedPlan) return;
    const updated = { ...savedPlan, weeks: savedPlan.weeks.map((w, i) =>
      i !== weekIdx ? w : { ...w, days: [...w.days, {
        day: newDay, topic: newTopic.trim(),
        tasks: newTasks.split("\n").map(t=>t.trim()).filter(Boolean),
        resource: newResource.trim(),
      }] }
    )};
    localStorage.setItem(SPK(user.id), JSON.stringify(updated));
    setSavedPlan(updated);
    setShowAddTopic(null);
    setNewTopic(""); setNewTasks(""); setNewResource(""); setNewDay("Monday");
  }

  async function generate() {
    if (!goal.trim() || !tech.trim()) { setErr("Please fill in your goal and technology."); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/study-planner", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ goal, technology:tech, currentLevel:level, hoursPerWeek:parseInt(hpw)||10, weeks:parseInt(weeks)||4 }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error||"AI failed");
      const plan: C360StudyPlan = { id:`sp${Date.now()}`, goal, tech, weeks:data.plan.weeks, generatedAt:new Date().toISOString() };
      localStorage.setItem(SPK(user.id), JSON.stringify(plan));
      const newCount = usageCount + 1;
      localStorage.setItem(SPC(user.id), String(newCount));
      setUsageCount(newCount);
      setSavedPlan(plan); setExpandedWeek(0);
      pushNotif(user.id, { type:"action", title:"Study Plan Ready!", body:`Your ${weeks}-week ${tech} plan is saved.` });
      c360Fetch("/study-planner/track", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ goal, tech }) }).catch(()=>{});
    } catch (e: any) { setErr(e.message||"Failed to generate. Try again."); }
    finally { setLoading(false); }
  }

  /* ── Mentor help card (reused in both paywall and plan view) ── */
  const MentorHelpCard = () => (
    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Brain size={15} className="text-amber-600 shrink-0"/>
        <p className="text-xs font-bold text-amber-800">Need personalised guidance?</p>
        <span className="ml-auto text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-full">College360</span>
      </div>
      <p className="text-[11px] text-amber-700 leading-relaxed">Book a 1-on-1 Google Meet session with an industry mentor who will review your roadmap, fix gaps, and give you a tailored action plan.</p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`mailto:paariwalaconnect@gmail.com?subject=Study%20Plan%20Mentor%20Session%20Request&body=Hi%2C%20I%27d%20like%20to%20book%20a%201-hour%20mentor%20GMeet%20session%20for%20₹500.%0A%0AName%3A%20${encodeURIComponent(user.name)}%0AEmail%3A%20${encodeURIComponent(user.email)}%0A%0APlease%20reach%20out%20to%20confirm%20the%20slot.`}
          className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg py-2 transition"
        >
          <Globe size={12}/>Book GMeet — ₹500/hr
        </a>
        <a
          href={`mailto:paariwalaconnect@gmail.com?subject=Full%20Package%20Inquiry%20-%20College360&body=Hi%2C%20I%27m%20interested%20in%20the%20full%20College360%20package%20(includes%20free%20mentor%20GMeet).%0A%0AName%3A%20${encodeURIComponent(user.name)}%0AEmail%3A%20${encodeURIComponent(user.email)}%0A%0APlease%20share%20the%20package%20details.`}
          className="flex items-center justify-center gap-1.5 border border-amber-400 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-lg py-2 transition"
        >
          <Mail size={12}/>Full Package (Free GMeet)
        </a>
      </div>
      <p className="text-[10px] text-amber-600 text-center">Full package includes unlimited study plans + free mentor session</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={15} className="text-teal-600"/>AI Study Planner
            <span className="text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-full">College360</span>
          </span>
          <div className="flex items-center gap-2">
            {!user.premium && <span className="text-[10px] text-gray-400 font-semibold">{usageCount}/{FREE_LIMIT} free</span>}
            {savedPlan && <button onClick={()=>{localStorage.removeItem(SPK(user.id));setSavedPlan(null);}} className="text-xs text-red-400 hover:text-red-600">Reset Plan</button>}
            <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
          </div>
        </div>
        <div className="p-5">
          {/* ── Paywall screen ── */}
          {isLocked ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={22} className="text-amber-600"/>
                </div>
                <p className="text-base font-bold text-gray-900">You've used your 2 free plans</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Free accounts can generate up to 2 AI study plans. Upgrade to unlock unlimited plans and premium features.</p>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-teal-800">What you get with the full package:</p>
                {["Unlimited AI study plan generations","Personalised adaptive roadmaps","Free 1-hour mentor Google Meet session","Priority mentor matching","College360 premium badge"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-teal-700"><CheckCircle size={12} className="text-teal-500 shrink-0"/>{f}</div>
                ))}
              </div>
              <MentorHelpCard/>
              <p className="text-center text-[11px] text-gray-400">Already have existing plan? <button onClick={()=>{ try { const s=localStorage.getItem(SPK(user.id)); if(s) setSavedPlan(JSON.parse(s)); } catch{} }} className="text-teal-600 font-semibold hover:underline">View saved plan</button></p>
            </div>
          ) : !savedPlan ? (
            /* ── Generation form ── */
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                <p className="text-xs text-teal-700">Tell the AI your goal and it creates a personalised week-by-week plan with daily topics and resources.</p>
                {!user.premium && usageCount === FREE_LIMIT - 1 && <p className="text-xs text-amber-600 font-semibold mt-1">⚠ This is your last free plan generation.</p>}
              </div>
              {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{err}</div>}
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Your Goal *</label>
                <input value={goal} onChange={e=>setGoal(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. Land a backend developer internship at a startup"/></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Technology / Domain *</label>
                <input value={tech} onChange={e=>setTech(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. Python, React, Machine Learning, AWS, Java Spring Boot"/></div>
              <div className="grid grid-cols-3 gap-3">
                {([["Current Level", level, setLevel, [["beginner","Beginner"],["intermediate","Intermediate"],["advanced","Advanced"]]], ["Hours/Week", hpw, setHpw, [["5","5h"],["10","10h"],["15","15h"],["20","20h"],["25","25h"],["30","30h"]]], ["Duration", weeks, setWeeks, [["2","2 weeks"],["4","4 weeks"],["6","6 weeks"],["8","8 weeks"],["12","12 weeks"]]]] as any[]).map(([lbl, val, set, opts]: any) => (
                  <div key={lbl}><label className="text-xs font-semibold text-gray-600 mb-1 block">{lbl}</label>
                    <select value={val} onChange={(e: any)=>set(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white">
                      {opts.map(([v,l]: any) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={generate} disabled={loading} className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={15} className="animate-spin"/>Generating Plan...</> : <><Sparkles size={15}/>Generate My Study Plan</>}
              </button>
              <MentorHelpCard/>
            </div>
          ) : (
            /* ── Saved plan view ── */
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
                <p className="text-sm font-bold text-teal-800">{savedPlan.goal}</p>
                <p className="text-xs text-teal-600 mt-0.5">{savedPlan.tech} · {savedPlan.weeks.length} weeks · Generated {new Date(savedPlan.generatedAt).toLocaleDateString()}</p>
              </div>
              {savedPlan.weeks.map((w, wi) => (
                <div key={w.week} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={()=>setExpandedWeek(expandedWeek===wi?null:wi)} className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200 hover:bg-gray-100 transition">
                    <p className="text-xs font-bold text-gray-900">Week {w.week}: {w.focus}</p>
                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${expandedWeek===wi?"rotate-90":""}`}/>
                  </button>
                  {expandedWeek===wi && (
                    <div>
                      <div className="divide-y divide-gray-100">
                        {w.days.map((d, di) => {
                          const eKey = `${wi}-${di}`;
                          const example = exampleCache[eKey];
                          const isLoadingEx = loadingExample === eKey;
                          return (
                            <div key={`${d.day}-${di}`} className="px-4 py-3">
                              <div className="flex gap-3">
                                <span className="text-[10px] font-bold text-teal-600 w-8 shrink-0 pt-0.5">{d.day.slice(0,3).toUpperCase()}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <p className="text-xs font-semibold text-gray-900">{d.topic}</p>
                                    <button onClick={()=>example ? setExampleCache(p=>({...p,[eKey]:undefined as any})) : fetchExample(eKey, d.topic)}
                                      disabled={isLoadingEx}
                                      className={`shrink-0 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition ${example?"bg-teal-600 text-white border-teal-600":"bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"}`}>
                                      {isLoadingEx ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                                      {isLoadingEx ? "Loading…" : example ? "Hide Example" : "Show Example"}
                                    </button>
                                  </div>
                                  <ul className="mt-1 space-y-0.5">{d.tasks.slice(0,3).map((t,i)=><li key={i} className="text-[11px] text-gray-500 flex gap-1"><span className="text-teal-400 shrink-0">·</span>{t}</li>)}</ul>
                                  {d.resource && <p className="text-[10px] text-gray-400 mt-1 italic">{d.resource}</p>}
                                  {example && (
                                    <div className="mt-2 bg-gray-900 rounded-xl p-3 space-y-2">
                                      <p className="text-[11px] text-gray-300 leading-relaxed">{example.explanation}</p>
                                      <div className="relative">
                                        <span className="absolute top-2 right-2 text-[9px] font-bold text-gray-500 uppercase">{example.language}</span>
                                        <pre className="text-[11px] text-green-400 overflow-x-auto whitespace-pre-wrap pr-12 font-mono leading-relaxed"><code>{example.code}</code></pre>
                                      </div>
                                      {example.practice && (
                                        <div className="border-t border-gray-700 pt-2">
                                          <p className="text-[10px] text-amber-400 font-semibold">🎯 Practice: {example.practice}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Add Topic inline */}
                      {showAddTopic === wi ? (
                        <div className="border-t border-teal-100 bg-teal-50/50 p-4 space-y-3">
                          <p className="text-xs font-bold text-teal-800">Add a topic to Week {w.week}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Day</label>
                              <select value={newDay} onChange={e=>setNewDay(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-teal-400">
                                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=><option key={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Resource (optional)</label>
                              <input value={newResource} onChange={e=>setNewResource(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400" placeholder="Book / article / tool"/>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Topic *</label>
                            <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400" placeholder="e.g. Introduction to async/await"/>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Tasks (one per line)</label>
                            <textarea rows={3} value={newTasks} onChange={e=>setNewTasks(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400 resize-none" placeholder={"Read the docs\nWrite a small example\nSolve one exercise"}/>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={()=>addCustomTopic(wi)} disabled={!newTopic.trim()} className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition">Add Topic</button>
                            <button onClick={()=>setShowAddTopic(null)} className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-600 rounded-lg transition">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-gray-100 px-4 py-2">
                          <button onClick={()=>{setShowAddTopic(wi);setExpandedWeek(wi);}} className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition">
                            <Plus size={12}/>Add custom topic
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!user.premium && usageCount < FREE_LIMIT) && (
                <button onClick={()=>setSavedPlan(null)} className="w-full py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 font-semibold transition flex items-center justify-center gap-1">
                  <RefreshCw size={13}/>Regenerate Plan
                </button>
              )}
              <MentorHelpCard/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── College Enquiry Modal ──────────────────────────────────────────────────────
function CollegeEnquiryModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const [college, setCollege] = useState(""); const [program, setProgram] = useState(""); const [queries, setQueries] = useState("");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const [draft, setDraft] = useState<{subject:string;email:string;tips:string[]}|null>(null);
  const [threadCreated, setThreadCreated] = useState(false);
  async function generate() {
    if (!college.trim()||!queries.trim()) { setErr("College name and your queries are required."); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/college-enquiry", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"enquiry", collegeName:college, program, queries, userName:user.name, userEmail:user.email }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error||"AI failed");
      setDraft({ subject:data.subject, email:data.draftEmail, tips:data.tips||[] });
    } catch (e: any) { setErr(e.message||"Failed to draft. Try again."); }
    finally { setLoading(false); }
  }
  function createThread() {
    if (!draft) return;
    const threads = loadThreads(user.id);
    threads.unshift({ id:`th${Date.now()}`, type:"enquiry", subject:draft.subject, to:college, body:draft.email, status:"sent", createdAt:new Date().toISOString(), replies:[] });
    saveThreads(user.id, threads);
    pushNotif(user.id, { type:"action", title:"Thread created", body:`Enquiry to ${college} saved to Threads.` });
    setThreadCreated(true); setTimeout(onClose, 1500);
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><MessageCircle size={15} className="text-teal-600"/>College Enquiry Agent</span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-4">
          {threadCreated ? (
            <div className="text-center py-8"><CheckCircle size={36} className="text-emerald-500 mx-auto mb-2"/><p className="text-sm font-semibold">Thread created! Track it in Community → Threads.</p></div>
          ) : !draft ? (<>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3"><p className="text-xs text-teal-700">AI will draft a professional enquiry email to your target college. Review and send it yourself.</p></div>
            {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{err}</div>}
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">College / University *</label><input value={college} onChange={e=>setCollege(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. IIT Madras, VIT Vellore, Anna University"/></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Program / Course</label><input value={program} onChange={e=>setProgram(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. M.Tech CSE, MBA, B.Arch"/></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Your Questions / Queries *</label>
              <textarea value={queries} onChange={e=>setQueries(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none" placeholder="e.g. Scholarship availability, hostel facilities, placement statistics, lateral entry procedure"/></div>
            <button onClick={generate} disabled={loading} className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin"/>Drafting Email...</> : <><Sparkles size={15}/>Draft My Enquiry Email</>}
            </button>
          </>) : (<>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-emerald-700 mb-0.5">Subject: {draft.subject}</p>
              <p className="text-[10px] text-emerald-600">Review the draft below. Edit it as needed before sending to the college's admissions email.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{draft.email}</pre></div>
            {draft.tips.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-2">Tips from AI</p>
                <ul className="space-y-1">{draft.tips.map((t,i)=><li key={i} className="text-xs text-amber-600 flex gap-1.5"><Zap size={10} className="mt-0.5 shrink-0"/>{t}</li>)}</ul>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={()=>setDraft(null)} className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 font-semibold transition">Regenerate</button>
              <button onClick={()=>navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.email}`)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition flex items-center justify-center gap-1">
                <Copy size={13}/>Copy
              </button>
              <button onClick={createThread} className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-1">
                <Hash size={13}/>Save Thread
              </button>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── Outreach Agent Modal ───────────────────────────────────────────────────────
function OutreachAgentModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const TEMPLATES = [
    { id:"recruiter", label:"Recruiter Outreach", ph:"Role you're targeting, company name, why you're a great fit" },
    { id:"mentor", label:"Mentor Request", ph:"What you want to learn, why this mentor, your background" },
    { id:"collab", label:"Collaboration Ask", ph:"Project idea, what you need, your contribution to the project" },
  ];
  const [tplId, setTplId] = useState("recruiter"); const [recipient, setRecipient] = useState(""); const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false); const [draft, setDraft] = useState(""); const [subject, setSubject] = useState("");
  const [err, setErr] = useState(""); const [copied, setCopied] = useState(false);
  const tpl = TEMPLATES.find(t=>t.id===tplId)!;
  async function generate() {
    if (!context.trim()) { setErr("Please provide context for the outreach."); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/college-enquiry", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"outreach", program:tplId, queries:context, userName:user.name, userEmail:user.email, recipientName:recipient, context }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error||"AI failed");
      setDraft(data.draft||""); setSubject(data.subject||"");
      try {
        const log: any[] = JSON.parse(localStorage.getItem(`c360_outreach_log_${user.id}`)||"[]");
        log.unshift({ id:`ou${Date.now()}`, type:tplId, to:recipient, draft:data.draft, createdAt:new Date().toISOString() });
        localStorage.setItem(`c360_outreach_log_${user.id}`, JSON.stringify(log.slice(0,20)));
        // Save to threads too
        const threads = loadThreads(user.id);
        threads.unshift({ id:`th${Date.now()}`, type:"outreach", subject:data.subject||`Outreach to ${recipient}`, to:recipient||"Recipient", body:data.draft, status:"sent", createdAt:new Date().toISOString(), replies:[] });
        saveThreads(user.id, threads);
      } catch {}
    } catch (e: any) { setErr(e.message||"Failed to draft. Try again."); }
    finally { setLoading(false); }
  }
  function copy() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Megaphone size={15} className="text-teal-600"/>Outreach Agent</span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {TEMPLATES.map(t=>(
              <button key={t.id} onClick={()=>{setTplId(t.id);setDraft("");}} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${tplId===t.id?"bg-teal-100 border-teal-300 text-teal-700":"bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>{t.label}</button>
            ))}
          </div>
          {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{err}</div>}
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Recipient Name / Company</label>
            <input value={recipient} onChange={e=>setRecipient(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. Priya Sharma at Zoho Corp"/></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Context — {tpl.ph}</label>
            <textarea value={context} onChange={e=>setContext(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none" placeholder={tpl.ph}/></div>
          {!draft ? (
            <button onClick={generate} disabled={loading} className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin"/>Drafting...</> : <><Sparkles size={15}/>Draft Message</>}
            </button>
          ) : (
            <div className="space-y-3">
              {subject && <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"><p className="text-xs text-gray-500">Suggested subject: <span className="font-semibold text-gray-700">{subject}</span></p></div>}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{draft}</pre></div>
              <div className="flex gap-2">
                <button onClick={()=>setDraft("")} className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 font-semibold transition"><RefreshCw size={12} className="inline mr-1"/>Regenerate</button>
                <button onClick={copy} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1 border ${copied?"bg-emerald-100 border-emerald-200 text-emerald-600":"bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"}`}>
                  {copied?<><CheckCircle size={13}/>Copied!</>:<><Copy size={13}/>Copy</>}
                </button>
                <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`} className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-1">
                  <Mail size={13}/>Email
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Voice Mock Interview Modal ─────────────────────────────────────────────────
type VMIPhase = "setup"|"loading"|"speaking"|"recording"|"confirming"|"grading"|"result"|"done";
interface VMIResult { question:string; transcript:string; relevance:number; depth:number; communication:number; overall:number; feedback:string; strengths:string[]; improvements:string[]; }

const VMI_TOPICS = ["React","Python","Node.js","Java","DSA","System Design","SQL","TypeScript","Machine Learning","DevOps"];
const VMI_ROLES  = ["Frontend Developer","Backend Developer","Full Stack Developer","Data Scientist","DevOps Engineer","Software Engineer"];

function MockInterviewModal({ user, onClose, onNeedPremium }: { user: C360User; onClose: () => void; onNeedPremium: () => void }) {
  const [phase, setPhase]           = useState<VMIPhase>("setup");
  const [topic, setTopic]           = useState("React");
  const [role, setRole]             = useState("Frontend Developer");
  const [difficulty, setDifficulty] = useState<"Easy"|"Medium"|"Hard">("Medium");
  const [qCount, setQCount]         = useState(5);
  const [questions, setQuestions]   = useState<{q:string;a:string}[]>([]);
  const [currentQ, setCurrentQ]     = useState(0);
  const [transcript, setTranscript] = useState("");
  const [edited, setEdited]         = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [results, setResults]       = useState<VMIResult[]>([]);
  const [error, setError]           = useState("");
  const [speechSupport, setSpeechSupport] = useState<"supported"|"unsupported"|"unknown">("unknown");
  const recogRef     = useRef<any>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupport(SR ? "supported" : "unsupported");
    }
    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
      try { recogRef.current?.stop(); } catch {}
    };
  }, []);

  const speakText = (text: string, onEnd?: () => void) => {
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.9; utt.pitch = 1; utt.lang = "en-US";
      if (onEnd) utt.onend = onEnd;
      window.speechSynthesis.speak(utt);
    } catch {}
  };

  const doSpeakQuestion = (qs: {q:string;a:string}[], idx: number) => {
    setCurrentQ(idx);
    setTranscript(""); setEdited(""); transcriptRef.current = "";
    setPhase("speaking");
    speakText(`Question ${idx + 1}. ${qs[idx].q}`, () => setPhase(p => p === "speaking" ? "recording" : p));
  };

  const startInterview = async () => {
    setPhase("loading"); setError("");
    try {
      const resp = await fetch("/api/interview-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technology: topic, role, difficulty, count: qCount }),
      });
      const data = await resp.json();
      if (!data.success || !data.questions?.length) throw new Error("Failed to generate questions");
      setQuestions(data.questions); setResults([]); setCurrentQ(0);
      doSpeakQuestion(data.questions, 0);
    } catch (e: any) { setError(e.message || "Failed to load questions"); setPhase("setup"); }
  };

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    transcriptRef.current = ""; setTranscript(""); setIsRecording(true);
    const recog = new SR();
    recog.continuous = true; recog.interimResults = true; recog.lang = "en-US";
    recog.onresult = (e: any) => {
      let final = ""; let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      transcriptRef.current = final;
      setTranscript(final + interim);
    };
    recog.onend = () => {
      setIsRecording(false);
      const t = transcriptRef.current.trim();
      setEdited(t); setPhase("confirming");
    };
    recog.onerror = (e: any) => {
      setIsRecording(false);
      if (e.error !== "aborted") setError("Mic error: " + e.error);
      setEdited(transcriptRef.current.trim()); setPhase("confirming");
    };
    recogRef.current = recog;
    try { recog.start(); } catch { setIsRecording(false); }
  };

  const stopRecording = () => {
    try { recogRef.current?.stop(); }
    catch { setIsRecording(false); setEdited(transcriptRef.current.trim()); setPhase("confirming"); }
  };

  const submitAnswer = async () => {
    setPhase("grading"); setError("");
    try {
      const resp = await fetch("/api/evaluate-answer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questions[currentQ].q, answer: edited.trim(), technology: topic, role, difficulty }),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Evaluation failed");
      setResults(prev => [...prev, { question: questions[currentQ].q, transcript: edited.trim(), relevance: data.relevance, depth: data.depth, communication: data.communication, overall: data.overall, feedback: data.feedback, strengths: data.strengths, improvements: data.improvements }]);
      setPhase("result");
    } catch (e: any) { setError(e.message); setPhase("confirming"); }
  };

  const nextQuestion = () => {
    const next = currentQ + 1;
    if (next >= questions.length) { setPhase("done"); return; }
    doSpeakQuestion(questions, next);
  };

  const avgScore = results.length ? (results.reduce((s,r) => s+r.overall, 0) / results.length).toFixed(1) : "0";
  const scoreColor = (v: number) => v >= 8 ? "text-teal-600" : v >= 6 ? "text-blue-600" : v >= 4 ? "text-amber-600" : "text-red-500";
  const barColor   = (v: number) => v >= 8 ? "bg-teal-500" : v >= 6 ? "bg-blue-500" : v >= 4 ? "bg-amber-400" : "bg-red-400";

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">{label}</span><span className={`font-bold ${scoreColor(value)}`}>{value}/10</span></div>
      <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full transition-all ${barColor(value)}`} style={{width:`${value*10}%`}}/></div>
    </div>
  );

  const handleClose = () => {
    try { window.speechSynthesis?.cancel(); recogRef.current?.stop(); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center"><Mic size={14} className="text-teal-600"/></div>
            <div>
              <p className="text-sm font-bold text-gray-900">Voice Mock Interview</p>
              {phase !== "setup" && phase !== "loading" && phase !== "done" && (
                <p className="text-[10px] text-gray-400">Q{currentQ+1} of {questions.length} · {topic} · {difficulty}</p>
              )}
            </div>
          </div>
          <button onClick={handleClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>

        <div className="p-5">

          {/* Setup */}
          {phase === "setup" && (
            <div className="space-y-4">
              {speechSupport === "unsupported" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                  <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-700">Voice recording works best in Chrome or Edge. On other browsers you can type your answers instead.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Topic</label>
                  <select value={topic} onChange={e=>setTopic(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300">
                    {VMI_TOPICS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Role</label>
                  <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300">
                    {VMI_ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Difficulty</label>
                <div className="flex gap-2">
                  {(["Easy","Medium","Hard"] as const).map(d=>(
                    <button key={d} onClick={()=>setDifficulty(d)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${difficulty===d?(d==="Easy"?"bg-teal-500 text-white border-teal-500":d==="Medium"?"bg-blue-500 text-white border-blue-500":"bg-red-500 text-white border-red-500"):"border-gray-200 text-gray-600 hover:border-gray-300"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Questions</label>
                <div className="flex gap-2">
                  {[3,5,7].map(n=>(
                    <button key={n} onClick={()=>setQCount(n)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${qCount===n?"bg-teal-500 text-white border-teal-500":"border-gray-200 text-gray-600 hover:border-gray-300"}`}>{n} questions</button>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <button onClick={startInterview} className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2">
                <Mic size={15}/>Start Interview
              </button>
              <p className="text-[10px] text-center text-gray-400">AI speaks each question aloud · you speak your answer · AI scores you instantly</p>
            </div>
          )}

          {/* Loading */}
          {phase === "loading" && (
            <div className="py-14 text-center">
              <Loader2 size={28} className="text-teal-500 animate-spin mx-auto mb-3"/>
              <p className="text-sm font-semibold text-gray-700">Preparing your interview…</p>
              <p className="text-xs text-gray-400 mt-1">Generating {qCount} {difficulty.toLowerCase()} {topic} questions</p>
            </div>
          )}

          {/* Speaking */}
          {phase === "speaking" && questions[currentQ] && (
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Question {currentQ+1} of {questions.length}</p>
              <div className="flex items-center justify-center gap-1 my-5">
                {[1,2,3,4,5,6,7].map(i=>(
                  <div key={i} className="w-1.5 bg-teal-400 rounded-full animate-pulse" style={{height:`${Math.round(Math.sin(i*0.9)*10+20)}px`,animationDelay:`${i*90}ms`}}/>
                ))}
                <span className="ml-3 text-xs text-teal-600 font-semibold">AI Speaking…</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-800 leading-relaxed font-medium">{questions[currentQ].q}</p>
              </div>
              <button onClick={()=>{ try{window.speechSynthesis?.cancel();}catch{} setPhase("recording"); }} className="w-full py-2.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-xl text-xs font-semibold text-teal-700 transition">
                Skip — I'm ready to answer
              </button>
            </div>
          )}

          {/* Recording */}
          {phase === "recording" && questions[currentQ] && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wide">Q{currentQ+1}</p>
                <p className="text-xs text-gray-700 leading-relaxed">{questions[currentQ].q}</p>
              </div>
              {speechSupport === "supported" ? (
                <>
                  <div className="text-center py-2">
                    {!isRecording ? (
                      <>
                        <button onClick={startRecording} className="w-20 h-20 mx-auto rounded-full bg-gray-100 hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 flex items-center justify-center transition active:scale-95">
                          <Mic size={28} className="text-gray-500"/>
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Tap to start recording</p>
                      </>
                    ) : (
                      <>
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"/>
                          <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg transition active:scale-95">
                            <MicOff size={26} className="text-white"/>
                          </button>
                        </div>
                        <p className="text-xs text-red-500 font-semibold mt-2 animate-pulse">Recording… tap to stop</p>
                      </>
                    )}
                  </div>
                  {transcript && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1">Live transcript</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
                    </div>
                  )}
                  {isRecording && (
                    <button onClick={stopRecording} className="w-full py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-bold text-white transition">
                      Done Speaking
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400">Voice not supported in this browser — type your answer:</p>
                  <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300 min-h-[110px]" placeholder="Type your answer here…" autoFocus/>
                  <button onClick={()=>{setEdited(transcript);setPhase("confirming");}} className="w-full py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-bold text-white transition">
                    Continue →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Confirming */}
          {phase === "confirming" && questions[currentQ] && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Review your answer</p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-0.5">Question:</p>
                <p className="text-xs text-gray-600 leading-relaxed">{questions[currentQ].q}</p>
              </div>
              <textarea value={edited} onChange={e=>setEdited(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300 min-h-[120px]" placeholder="Your transcribed answer — edit if needed…"/>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button onClick={()=>{setTranscript("");setEdited("");transcriptRef.current="";setPhase("recording");}} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Re-record
                </button>
                <button onClick={submitAnswer} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold text-white transition">
                  Submit Answer →
                </button>
              </div>
            </div>
          )}

          {/* Grading */}
          {phase === "grading" && (
            <div className="py-14 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
                <Loader2 size={22} className="text-teal-500 animate-spin"/>
              </div>
              <p className="text-sm font-semibold text-gray-700">Grading your answer…</p>
              <p className="text-xs text-gray-400 mt-1">Evaluating relevance, depth and communication</p>
            </div>
          )}

          {/* Result — per question */}
          {phase === "result" && results.length > 0 && (() => {
            const r = results[results.length-1];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Q{currentQ+1} Score</p>
                  <span className={`text-2xl font-black ${scoreColor(r.overall)}`}>{r.overall}<span className="text-sm text-gray-400">/10</span></span>
                </div>
                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <ScoreBar label="Relevance" value={r.relevance}/>
                  <ScoreBar label="Technical Depth" value={r.depth}/>
                  <ScoreBar label="Communication" value={r.communication}/>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1">AI Feedback</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{r.feedback}</p>
                </div>
                {r.strengths.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-1.5">Strengths</p>
                    {r.strengths.map((s,i)=><div key={i} className="flex gap-2 text-xs text-gray-600 mb-1"><CheckCircle size={11} className="text-teal-500 shrink-0 mt-0.5"/>{s}</div>)}
                  </div>
                )}
                {r.improvements.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-1.5">Improve On</p>
                    {r.improvements.map((s,i)=><div key={i} className="flex gap-2 text-xs text-gray-600 mb-1"><ArrowRight size={11} className="text-amber-400 shrink-0 mt-0.5"/>{s}</div>)}
                  </div>
                )}
                <button onClick={nextQuestion} className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-bold text-white transition">
                  {currentQ+1 < questions.length ? `Next Question →` : `View Final Report`}
                </button>
              </div>
            );
          })()}

          {/* Done — Report */}
          {phase === "done" && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-3">
                  <Trophy size={24} className="text-teal-600"/>
                </div>
                <p className="text-base font-black text-gray-900">Interview Complete!</p>
                <div className={`text-3xl font-black mt-1 ${scoreColor(parseFloat(avgScore))}`}>
                  {avgScore}<span className="text-base text-gray-400">/10</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Average · {results.length} questions answered</p>
              </div>
              <div className="space-y-2">
                {results.map((r,i)=>(
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <span className={`text-sm font-black shrink-0 w-7 text-center ${scoreColor(r.overall)}`}>{r.overall}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 line-clamp-2">{r.question}</p>
                      {r.transcript && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">You: {r.transcript}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className={`rounded-xl p-4 border ${user.premium?"bg-teal-50 border-teal-200":"bg-amber-50 border-amber-200"}`}>
                {user.premium ? (<>
                  <p className="text-xs font-bold text-teal-800 mb-1">Book a 1-on-1 Session with a Mentor</p>
                  <p className="text-[10px] text-teal-600 mb-2">Premium members can book 45-min recorded sessions with industry experts.</p>
                  <a href="mailto:college360@nexusos.in?subject=Mock Interview Booking Request" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-[10px] font-bold text-white transition"><Mail size={10}/>Book Session</a>
                </>) : (<>
                  <p className="text-xs font-bold text-amber-800 mb-1">Go deeper with a real expert</p>
                  <p className="text-[10px] text-amber-600 mb-2">Upgrade to book live 45-min mock sessions with detailed written feedback.</p>
                  <button onClick={()=>{handleClose();onNeedPremium();}} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-[10px] font-bold text-white transition"><Sparkles size={10}/>Upgrade to Premium</button>
                </>)}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{setPhase("setup");setResults([]);setQuestions([]);}} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">New Interview</button>
                <button onClick={handleClose} className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-xs font-bold text-white transition">Close</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Technical Help Modal ───────────────────────────────────────────────────────
function TechnicalHelpModal({ user, onClose, onNeedPremium }: { user: C360User; onClose: () => void; onNeedPremium: () => void }) {
  const EXPERTS = [
    { id:"e1", name:"Arjun Mehta", role:"Senior Backend Engineer", domain:"Backend · Node.js · Python", email:"arjun.help@nexusos.in" },
    { id:"e2", name:"Priya Raghavan", role:"ML Engineer", domain:"AI · ML · Data Science", email:"priya.help@nexusos.in" },
    { id:"e3", name:"Karthik Sundaram", role:"DevOps Lead", domain:"DevOps · Cloud · Kubernetes", email:"karthik.help@nexusos.in" },
    { id:"e4", name:"Divya Krishnan", role:"UI/UX Designer", domain:"Design · Figma · UX Research", email:"divya.help@nexusos.in" },
  ];
  const [expert, setExpert] = useState<typeof EXPERTS[0]|null>(null);
  const [problem, setProblem] = useState(""); const [sent, setSent] = useState(false);
  if (!user.premium) return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 text-center">
        <Sparkles size={32} className="text-amber-500 mx-auto mb-3"/>
        <h3 className="text-sm font-bold text-gray-900 mb-2">Premium Feature</h3>
        <p className="text-xs text-gray-500 mb-4">Technical Help connects you to domain experts for paid consultations. Upgrade to unlock.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={()=>{onClose();onNeedPremium();}} className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition">Upgrade Now</button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Zap size={15} className="text-amber-500"/>Technical Help <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold ml-1">Premium</span></span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-4">
          {sent ? (
            <div className="text-center py-8"><CheckCircle size={36} className="text-emerald-500 mx-auto mb-2"/><p className="text-sm font-semibold text-gray-900">Request sent!</p><p className="text-xs text-gray-500 mt-1">The expert will respond within 24h to your email.</p></div>
          ) : (<>
            <p className="text-xs text-gray-500">Select a domain expert and describe your problem. They respond to your email within 24 hours.</p>
            <div className="grid grid-cols-2 gap-2">
              {EXPERTS.map(e=>(
                <button key={e.id} onClick={()=>setExpert(expert?.id===e.id?null:e)} className={`text-left p-3 rounded-xl border transition ${expert?.id===e.id?"border-amber-300 bg-amber-50":"border-gray-200 bg-gray-50 hover:border-amber-200"}`}>
                  <p className="text-xs font-bold text-gray-900">{e.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{e.role}</p>
                  <p className="text-[10px] text-amber-600 mt-1">{e.domain}</p>
                </button>
              ))}
            </div>
            {expert && (<>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Describe Your Problem</label>
                <textarea value={problem} onChange={e=>setProblem(e.target.value)} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none" placeholder="Explain the issue, what you've already tried, and what outcome you need..."/></div>
              <a href={`mailto:${expert.email}?cc=${user.email}&subject=Technical Help via College360&body=${encodeURIComponent(`Hi ${expert.name},\n\nI need help with:\n\n${problem}\n\nMy details:\nName: ${user.name}\nEmail: ${user.email}\n\nThank you!`)}`}
                onClick={()=>{ if(problem.trim()) setSent(true); }}
                className={`flex w-full py-2.5 rounded-xl text-sm font-bold text-white items-center justify-center gap-2 transition ${problem.trim()?"bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90":"bg-gray-200 text-gray-400 pointer-events-none"}`}>
                <Mail size={14}/>Send to Expert
              </a>
            </>)}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-[10px] text-amber-600">Premium feature · Expert responds within 24h · Billed via your Premium subscription</p></div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── Book Marketplace Section ───────────────────────────────────────────────────
function BooksFeedSection({ user }: { user: C360User | null }) {
  type BookTab = "marketplace" | "curated" | "mine";
  const [btab, setBtab] = useState<BookTab>("marketplace");
  const [listings, setListings] = useState<C360MarketBook[]>([]);
  const [myListings, setMyListings] = useState<C360MarketBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:"", author:"", subject:"", condition:"good", price:"0", type:"sell" as "sell"|"gift", description:"" });
  const [submitting, setSubmitting] = useState(false);
  const [requestModal, setRequestModal] = useState<C360MarketBook|null>(null);
  const [reqMsg, setReqMsg] = useState("");
  const [reqDone, setReqDone] = useState<string|null>(null);

  // curated
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState<string[]>(() => user ? loadSavedBooks(user.id) : []);
  const domains = ["all","programming","ai","data","design","cloud","testing"];
  const curated = C360_BOOKS.filter(b => filter==="all"||b.domain===filter||b.domain==="all");

  useEffect(() => {
    if (btab === "marketplace") {
      setLoading(true);
      c360Fetch("/books").then(r => { if (r.success) setListings(r.data || []); }).finally(()=>setLoading(false));
    }
    if (btab === "mine" && user) {
      c360Fetch("/books/mine").then(r => { if (r.success) setMyListings(r.data || []); });
    }
  }, [btab, user]);

  async function addListing() {
    if (!form.title || !user) return;
    setSubmitting(true);
    const r = await c360Fetch("/books", { method:"POST", body: JSON.stringify({ ...form, price: parseFloat(form.price)||0 }) });
    if (r.success) {
      setListings(l => [r.data, ...l]);
      setMyListings(l => [r.data, ...l]);
      setShowAdd(false);
      setForm({ title:"", author:"", subject:"", condition:"good", price:"0", type:"sell", description:"" });
    }
    setSubmitting(false);
  }

  async function markSold(book: C360MarketBook, status: "sold"|"gifted") {
    await c360Fetch(`/books/${book.id}/close`, { method:"PUT", body: JSON.stringify({ status }) });
    setMyListings(l => l.map(b => b.id===book.id ? {...b, status} : b));
  }

  async function removeBook(id: string) {
    await c360Fetch(`/books/${id}`, { method:"DELETE" });
    setMyListings(l => l.filter(b => b.id!==id));
    setListings(l => l.filter(b => b.id!==id));
  }

  async function requestBook() {
    if (!requestModal || !user) return;
    setSubmitting(true);
    const r = await c360Fetch(`/books/${requestModal.id}/request`, { method:"POST", body: JSON.stringify({ message: reqMsg }) });
    if (r.success) { setReqDone(requestModal.title); setRequestModal(null); setReqMsg(""); }
    setSubmitting(false);
  }

  function toggleSave(bookId: string) {
    if (!user) return;
    const next = saved.includes(bookId) ? saved.filter(id=>id!==bookId) : [...saved, bookId];
    setSaved(next);
    try { localStorage.setItem(BSK(user.id), JSON.stringify(next)); } catch {}
  }

  const COND_LABELS: Record<string,string> = { new:"New", good:"Good", fair:"Fair" };
  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 bg-white";

  return (
    <div>
      {reqDone && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600 shrink-0"/>
          <p className="text-sm text-emerald-800 font-semibold">Request sent for "{reqDone}"! Seller will contact you.</p>
          <button onClick={()=>setReqDone(null)} className="ml-auto text-emerald-600"><X size={14}/></button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {([["marketplace","🛒 Marketplace"],["curated","📚 Curated"],["mine","📦 My Listings"]] as [BookTab,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setBtab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${btab===t?"bg-white text-violet-700 shadow-sm":"text-gray-600 hover:text-gray-800"}`}>{l}</button>
          ))}
        </div>
        {user && btab!=="curated" && (
          <button onClick={()=>setShowAdd(v=>!v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-bold text-white transition">
            <Plus size={13}/>{btab==="mine"?"Add Listing":"Sell / Gift"}
          </button>
        )}
      </div>

      {/* Add listing form */}
      {showAdd && user && (
        <div className="mb-5 bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-gray-900">List a Book</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600 mb-1 block">Book Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={inp} placeholder="Clean Code"/></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Author</label><input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} className={inp} placeholder="Robert C. Martin"/></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Subject</label><input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className={inp} placeholder="Programming"/></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Condition</label>
              <select value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} className={inp}>
                {["new","good","fair"].map(c=><option key={c} value={c}>{COND_LABELS[c]}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Type</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as "sell"|"gift"}))} className={inp}>
                <option value="sell">Sell</option><option value="gift">Gift (Free)</option>
              </select>
            </div>
            {form.type==="sell" && (
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Price (₹)</label><input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} className={inp} placeholder="150"/></div>
            )}
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className={inp+" resize-none"} placeholder="Condition details, pickup area, etc."/></div>
          <div className="flex gap-2">
            <button onClick={()=>setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
            <button onClick={addListing} disabled={!form.title||submitting} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-1">
              {submitting && <Loader2 size={12} className="animate-spin"/>}List Book
            </button>
          </div>
        </div>
      )}

      {/* Request modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={()=>setRequestModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900">{requestModal.type==="gift"?"Request this book":"Buy this book"}</p>
              <button onClick={()=>setRequestModal(null)}><X size={16} className="text-gray-400"/></button>
            </div>
            <p className="text-xs text-gray-600 mb-3"><span className="font-semibold">{requestModal.title}</span> · by {requestModal.seller_name}</p>
            {requestModal.type==="sell" && <p className="text-sm font-black text-violet-600 mb-3">₹{requestModal.price}</p>}
            <textarea value={reqMsg} onChange={e=>setReqMsg(e.target.value)} rows={3} className={inp+" resize-none mb-3"} placeholder="Hi! I'm interested in this book. I can meet at..."/>
            <button onClick={requestBook} disabled={submitting} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2">
              {submitting && <Loader2 size={12} className="animate-spin"/>}Send Request
            </button>
          </div>
        </div>
      )}

      {/* MARKETPLACE TAB */}
      {btab === "marketplace" && (
        loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-500"/></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-sm text-gray-500 font-semibold mb-1">No books listed yet</p>
            <p className="text-xs text-gray-400">Be the first to sell or gift a book to the community!</p>
            {user && <button onClick={()=>setShowAdd(true)} className="mt-4 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-500 transition">List a Book</button>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(b=>(
              <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-violet-200 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{b.title}</p>
                    {b.author && <p className="text-xs text-gray-500">{b.author}</p>}
                  </div>
                  <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${b.type==="gift"?"bg-emerald-100 text-emerald-700":"bg-violet-100 text-violet-700"}`}>
                    {b.type==="gift"?"FREE GIFT":`₹${b.price}`}
                  </span>
                </div>
                {b.subject && <p className="text-[10px] text-gray-400 mb-1">{b.subject}</p>}
                {b.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{b.description}</p>}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{COND_LABELS[b.condition]||b.condition}</span>
                  {b.seller_college && <span className="text-[10px] text-gray-400">{b.seller_college}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">by {b.seller_name}</p>
                  {user && b.seller_id !== user.id ? (
                    <button onClick={()=>setRequestModal(b)} className="px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold text-white transition">
                      {b.type==="gift"?"Request":"Buy"}
                    </button>
                  ) : !user ? (
                    <span className="text-[10px] text-gray-400">Sign in to request</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* CURATED TAB */}
      {btab === "curated" && (
        <div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {domains.map(d=>(
              <button key={d} onClick={()=>setFilter(d)} className={`shrink-0 capitalize px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filter===d?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>{d}</button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curated.map(b=>(
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-violet-200 transition">
                <div className={`${b.color} h-2`}/>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{b.title}</p>
                    {user && <button onClick={()=>toggleSave(b.id)} className={`shrink-0 p-1 rounded transition ${saved.includes(b.id)?"text-violet-600":"text-gray-300 hover:text-gray-400"}`}><Bookmark size={14} className={saved.includes(b.id)?"fill-violet-600":""}/></button>}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{b.author}</p>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{b.desc}</p>
                  <div className="flex flex-wrap gap-1 mb-3">{b.tags.map(t=><span key={t} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{t}</span>)}</div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-semibold transition"><ExternalLink size={11}/>View / Read</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY LISTINGS TAB */}
      {btab === "mine" && (
        !user ? (
          <div className="text-center py-12 text-gray-400"><BookOpen size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">Sign in to manage your listings</p></div>
        ) : myListings.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><BookOpen size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">You haven't listed any books yet.</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map(b=>(
              <div key={b.id} className={`bg-white border rounded-2xl p-4 transition ${b.status!=="available"?"opacity-60 border-gray-100":"border-gray-200 hover:border-violet-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">{b.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status==="available"?"bg-emerald-100 text-emerald-700":b.status==="sold"?"bg-gray-100 text-gray-500":"bg-teal-100 text-teal-700"}`}>{b.status}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{b.type==="gift"?"Free Gift":`₹${b.price}`} · {COND_LABELS[b.condition]||b.condition}</p>
                {b.pending_requests && b.pending_requests > 0 ? (
                  <p className="text-xs text-violet-600 font-semibold mb-2">{b.pending_requests} request{Number(b.pending_requests)!==1?"s":""} pending</p>
                ) : null}
                {b.status === "available" && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>markSold(b, b.type==="gift"?"gifted":"sold")} className="flex-1 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition">
                      Mark {b.type==="gift"?"Gifted":"Sold"}
                    </button>
                    <button onClick={()=>removeBook(b.id)} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition">Remove</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ── Projects Board Section ─────────────────────────────────────────────────────
function ProjectsBoardSection({ user }: { user: C360User | null }) {
  const [projects, setProjects] = useState<C360Project[]>(() => user ? loadProjects(user.id) : []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title:"", tech:"", desc:"", github:"", status:"idea" as C360Project["status"], public:false });
  const [statusFilter, setStatusFilter] = useState<"all"|C360Project["status"]>("all");
  function save() {
    if (!form.title.trim()||!user) return;
    const proj: C360Project = { id:`pj${Date.now()}`, ...form, createdAt:new Date().toISOString() };
    const next = [proj, ...projects];
    setProjects(next); saveProjects(user.id, next); setAdding(false);
    setForm({ title:"", tech:"", desc:"", github:"", status:"idea", public:false });
  }
  function removeProject(id: string) {
    if (!user) return;
    const next = projects.filter(p=>p.id!==id);
    setProjects(next); saveProjects(user.id, next);
  }
  const STATUS_LABELS: Record<C360Project["status"],string> = { idea:"💡 Idea", building:"🔨 Building", done:"✅ Done" };
  const STATUS_COLORS: Record<C360Project["status"],string> = { idea:"bg-yellow-100 text-yellow-700 border-yellow-200", building:"bg-blue-100 text-blue-700 border-blue-200", done:"bg-emerald-100 text-emerald-700 border-emerald-200" };
  const filtered = projects.filter(p=>statusFilter==="all"||p.status===statusFilter);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Layers size={20} className="text-violet-600"/>Project Board</h2><p className="text-xs text-gray-500 mt-0.5">Track your side projects and share them with the community</p></div>
        {user && <button onClick={()=>setAdding(v=>!v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 border border-violet-200 rounded-lg text-xs font-semibold text-violet-700 transition"><Plus size={12}/>Add Project</button>}
      </div>
      {adding && user && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Project Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" placeholder="My awesome project"/></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Tech Stack</label><input value={form.tech} onChange={e=>setForm(f=>({...f,tech:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" placeholder="React, Node.js, PostgreSQL"/></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label><textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none" placeholder="What does this project do?"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">GitHub URL</label><input value={form.github} onChange={e=>setForm(f=>({...f,github:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" placeholder="https://github.com/..."/></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as C360Project["status"]}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 bg-white">
                <option value="idea">💡 Idea</option><option value="building">🔨 Building</option><option value="done">✅ Done</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={form.public} onChange={e=>setForm(f=>({...f,public:e.target.checked}))} className="rounded"/><span>Share to Community Board</span></label>
          <div className="flex gap-2">
            <button onClick={()=>setAdding(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
            <button onClick={save} disabled={!form.title.trim()} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg text-sm font-bold text-white transition">Save Project</button>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        {(["all","idea","building","done"] as const).map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className={`capitalize px-3 py-1.5 rounded-full text-xs font-semibold border transition ${statusFilter===s?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s==="all"?"All":STATUS_LABELS[s as C360Project["status"]]}
          </button>
        ))}
      </div>
      {!user ? (
        <div className="text-center py-12 text-gray-400"><FolderOpen size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">Sign in to track your projects</p></div>
      ) : filtered.length===0 ? (
        <div className="text-center py-12 text-gray-400"><FolderOpen size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No projects yet. Add your first one!</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p=>(
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-violet-200 transition">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-gray-900">{p.title}</p>
                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 shrink-0 ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
              </div>
              {p.tech && <p className="text-xs text-gray-500 mb-2 font-mono">{p.tech}</p>}
              {p.desc && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{p.desc}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"><ExternalLink size={11}/>GitHub</a>}
                  {p.public && <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">Public</span>}
                </div>
                <button onClick={()=>removeProject(p.id)} className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Job Board Section ──────────────────────────────────────────────────────────
interface C360JobPost {
  id: string; poster_id: string; poster_name: string; poster_role: string;
  title: string; company?: string; location?: string; type: string;
  description?: string; skills: string[]; apply_link?: string; salary?: string;
  status: string; created_at: string;
}
function JobBoardSection({ user }: { user: C360User|null }) {
  type JTab = "browse" | "mine" | "post";
  const [jtab, setJtab] = useState<JTab>("browse");
  const [posts, setPosts] = useState<C360JobPost[]>([]);
  const [myPosts, setMyPosts] = useState<C360JobPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title:"", company:"", location:"", type:"full-time", description:"", skills:"", applyLink:"", salary:"" });
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState("");
  const [ok2, setOk2] = useState(false);
  const typeOpts = ["full-time","part-time","internship","freelance","contract"];
  const canPost = !!user;

  useEffect(() => {
    setLoading(true);
    c360Fetch("/job-posts").then(r => { if (r.success) setPosts(r.data||[]); setLoading(false); });
  }, []);
  useEffect(() => {
    if (jtab==="mine" && user) c360Fetch("/job-posts/mine").then(r => { if (r.success) setMyPosts(r.data||[]); });
  }, [jtab, user]);

  async function postJob() {
    setErr(""); if (!form.title.trim()) { setErr("Title required"); return; }
    setPosting(true);
    const skills = form.skills.split(",").map(s=>s.trim()).filter(Boolean);
    const r = await c360Fetch("/job-posts", { method:"POST", body: JSON.stringify({ ...form, skills }) });
    if (r.success) { setMyPosts(p=>[r.data,...p]); setPosts(p=>[r.data,...p]); setOk2(true); setForm({ title:"", company:"", location:"", type:"full-time", description:"", skills:"", applyLink:"", salary:"" }); setTimeout(()=>setOk2(false),2000); }
    else setErr(r.error||"Failed");
    setPosting(false);
  }
  async function removePost(id: string) {
    await c360Fetch(`/job-posts/${id}`, { method:"DELETE" });
    setMyPosts(p=>p.filter(x=>x.id!==id)); setPosts(p=>p.filter(x=>x.id!==id));
  }

  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}); } catch { return d; } };
  const typeBadge: Record<string,string> = { "full-time":"bg-blue-100 text-blue-700","part-time":"bg-violet-100 text-violet-700","internship":"bg-teal-100 text-teal-700","freelance":"bg-orange-100 text-orange-700","contract":"bg-gray-100 text-gray-600" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Community Job Board</h2>
          <p className="text-xs text-gray-500 mt-0.5">Students & alumni sharing job opportunities</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {([
          ["browse", "Browse All"],
          ...(canPost ? [["mine","My Posts"],["post", canPost && (user?.role==="mentor"||user?.role==="expert"||user?.role==="recruiter"||user?.role==="training_center") ? "Post a Job" : "Share a Lead"]] : []),
        ] as [JTab,string][]).map(([t,l])=>(
          <button key={t} onClick={()=>setJtab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${jtab===t?"bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm":"text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>{l}</button>
        ))}
      </div>

      {jtab==="browse" && (
        loading ? <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-violet-400" size={24}/></div>
        : posts.length===0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <Megaphone size={28} className="text-gray-300 mx-auto mb-2"/>
            <p className="text-sm text-gray-500 font-semibold">No jobs posted yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to share an opportunity!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadge[p.type]||"bg-gray-100 text-gray-600"}`}>{p.type}</span>
                    </div>
                    {p.company && <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{p.company}{p.location ? ` · ${p.location}` : ""}</p>}
                    {p.salary && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{p.salary}</p>}
                    {p.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{p.description}</p>}
                    {p.skills?.length>0 && <div className="flex flex-wrap gap-1 mt-2">{p.skills.map((s,i)=><span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded px-1.5 py-0.5">{s}</span>)}</div>}
                    <p className="text-[10px] text-gray-400 mt-2">Posted by {p.poster_name} · {fmtDate(p.created_at)}</p>
                  </div>
                  {p.apply_link && (
                    <a href={p.apply_link} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition">
                      Apply <ExternalLink size={11}/>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {jtab==="mine" && (
        <div className="space-y-3">
          {myPosts.length===0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
              <p className="text-sm text-gray-500">You haven't posted any jobs yet.</p>
              <button onClick={()=>setJtab("post")} className="mt-2 text-xs text-violet-600 hover:underline font-semibold">Post one now →</button>
            </div>
          ) : myPosts.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.title}</h3><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadge[p.type]||"bg-gray-100 text-gray-600"}`}>{p.type}</span></div>
                {p.company && <p className="text-xs text-gray-500 mt-0.5">{p.company}{p.location?` · ${p.location}`:""}</p>}
                <p className="text-[10px] text-gray-400 mt-1">{fmtDate(p.created_at)}</p>
              </div>
              <button onClick={()=>removePost(p.id)} className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold transition">
                <X size={11}/>Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {jtab==="post" && (
        !user ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
            <p className="text-sm text-gray-500">Login to post a job</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Share a Job Opportunity</h3>
            {[
              { key:"title",       label:"Job Title *",      placeholder:"e.g. Software Engineer" },
              { key:"company",     label:"Company / Client", placeholder:"Company name" },
              { key:"location",    label:"Location",         placeholder:"e.g. Bangalore / Remote" },
              { key:"salary",      label:"Salary / Stipend", placeholder:"e.g. ₹8-12 LPA" },
              { key:"applyLink",   label:"Apply Link / Email", placeholder:"https://..." },
              { key:"skills",      label:"Skills (comma-sep)", placeholder:"React, Node.js, AWS" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-300">
                {typeOpts.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the role, requirements, perks…" rows={3}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300 resize-none"/>
            </div>
            {err && <p className="text-xs text-red-500">{err}</p>}
            {ok2 && <p className="text-xs text-emerald-500 font-semibold">Job posted successfully!</p>}
            <button onClick={postJob} disabled={posting} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition">
              {posting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}Post Job
            </button>
          </div>
        )
      )}
    </div>
  );
}

// ── Idea Threads Section ───────────────────────────────────────────────────────
interface C360Idea {
  id: string; owner_id: string; owner_name: string; title: string; description?: string;
  tags: string[]; status: "open"|"concluded"; conclusion?: string; created_at: string;
  contributor_count?: number; comment_count?: number;
}
interface C360IdeaComment { id: string; idea_id: string; user_id: string; user_name: string; content: string; created_at: string; }
interface C360IdeaContributor { id: string; idea_id: string; user_id: string; user_name: string; status: "pending"|"accepted"|"rejected"; }
interface C360IdeaDetail extends C360Idea { comments: C360IdeaComment[]; contributors: C360IdeaContributor[]; }

function IdeaThreadsSection({ user }: { user: C360User|null }) {
  const [ideas, setIdeas] = useState<C360Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<C360IdeaDetail|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title:"", description:"", tags:"" });
  const [posting, setPosting] = useState(false);
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [concludeModal, setConcludeModal] = useState(false);
  const [conclusion, setConclusion] = useState("");

  useEffect(() => {
    c360Fetch("/ideas").then(r => { if (r.success) setIdeas(r.data||[]); setLoading(false); });
  }, []);

  async function loadDetail(id: string) {
    setDetailLoading(true);
    const r = await c360Fetch(`/ideas/${id}`);
    if (r.success) setSelected(r.data);
    setDetailLoading(false);
  }
  async function createIdea() {
    if (!newForm.title.trim()) return;
    setPosting(true);
    const tags = newForm.tags.split(",").map(s=>s.trim()).filter(Boolean);
    const r = await c360Fetch("/ideas", { method:"POST", body: JSON.stringify({ ...newForm, tags }) });
    if (r.success) { setIdeas(i=>[{ ...r.data, contributor_count:0, comment_count:0 },...i]); setShowNew(false); setNewForm({ title:"", description:"", tags:"" }); }
    setPosting(false);
  }
  async function deleteIdea(id: string) {
    await c360Fetch(`/ideas/${id}`, { method:"DELETE" });
    setIdeas(i=>i.filter(x=>x.id!==id)); setSelected(null);
  }
  async function concludeIdea() {
    if (!selected) return;
    const r = await c360Fetch(`/ideas/${selected.id}/conclude`, { method:"PUT", body: JSON.stringify({ conclusion }) });
    if (r.success) { setIdeas(i=>i.map(x=>x.id===selected.id?{...x,status:"concluded" as const,conclusion}:x)); setSelected(s=>s?{...s,status:"concluded",conclusion}:s); setConcludeModal(false); }
  }
  async function joinIdea(id: string) {
    const r = await c360Fetch(`/ideas/${id}/join`, { method:"POST" });
    if (r.success && selected?.id===id) setSelected(s=>s?{...s,contributors:[...s.contributors,r.data]}:s);
  }
  async function respondContributor(ideaId: string, userId: string, action: "accepted"|"rejected") {
    await c360Fetch(`/ideas/${ideaId}/contributors/${userId}/respond`, { method:"PUT", body: JSON.stringify({ action }) });
    setSelected(s=>s?{...s,contributors:s.contributors.map(c=>c.user_id===userId?{...c,status:action}:c)}:s);
  }
  async function postComment() {
    if (!comment.trim() || !selected) return;
    setCommenting(true);
    const r = await c360Fetch(`/ideas/${selected.id}/comments`, { method:"POST", body: JSON.stringify({ content: comment }) });
    if (r.success) { setSelected(s=>s?{...s,comments:[...s.comments,r.data],comment_count:(s.comment_count||0)+1}:s); setComment(""); }
    setCommenting(false);
  }

  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); } catch { return d; } };

  if (selected) {
    const isOwner = user?.id === selected.owner_id;
    const myContrib = selected.contributors.find(c=>c.user_id===user?.id);
    const acceptedContribs = selected.contributors.filter(c=>c.status==="accepted");
    const pendingContribs = selected.contributors.filter(c=>c.status==="pending");
    return (
      <div className="space-y-4">
        <button onClick={()=>setSelected(null)} className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-semibold">
          ← Back to Ideas
        </button>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.title}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selected.status==="open"?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-500"}`}>{selected.status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">by {selected.owner_name} · {fmtDate(selected.created_at)}</p>
              {selected.description && <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">{selected.description}</p>}
              {selected.tags?.length>0 && <div className="flex flex-wrap gap-1 mt-3">{selected.tags.map((t,i)=><span key={i} className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full px-2 py-0.5">#{t}</span>)}</div>}
              {selected.status==="concluded" && selected.conclusion && (
                <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-3">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Conclusion</p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">{selected.conclusion}</p>
                </div>
              )}
            </div>
          </div>

          {isOwner && selected.status==="open" && (
            <div className="flex gap-2 mt-4">
              <button onClick={()=>setConcludeModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition">
                <CheckCircle size={12}/>Conclude Idea
              </button>
              <button onClick={()=>deleteIdea(selected.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold transition">
                <X size={12}/>Delete Thread
              </button>
            </div>
          )}
        </div>

        {/* Contributors */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Contributors ({acceptedContribs.length})</p>
            {user && !isOwner && !myContrib && selected.status==="open" && (
              <button onClick={()=>joinIdea(selected.id)} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition">
                <Plus size={11}/>Join Idea
              </button>
            )}
            {myContrib && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${myContrib.status==="accepted"?"bg-emerald-100 text-emerald-700":myContrib.status==="pending"?"bg-amber-100 text-amber-700":"bg-gray-100 text-gray-500"}`}>{myContrib.status==="accepted"?"You're in":myContrib.status==="pending"?"Request pending":"Rejected"}</span>}
          </div>
          {acceptedContribs.length>0 ? (
            <div className="flex flex-wrap gap-2">{acceptedContribs.map(c=><span key={c.id} className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-full px-2.5 py-1"><CheckCircle size={10}/>{c.user_name}</span>)}</div>
          ) : <p className="text-xs text-gray-400">No contributors yet.</p>}
          {isOwner && pendingContribs.length>0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Pending Requests</p>
              {pendingContribs.map(c=>(
                <div key={c.id} className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.user_name}</p>
                  <div className="flex gap-1.5">
                    <button onClick={()=>respondContributor(selected.id,c.user_id,"accepted")} className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md transition">Accept</button>
                    <button onClick={()=>respondContributor(selected.id,c.user_id,"rejected")} className="text-[10px] font-bold px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Discussion ({selected.comments.length})</p>
          <div className="space-y-3 mb-4">
            {selected.comments.map(c=>(
              <div key={c.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.user_name[0]?.toUpperCase()}</div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.user_name} <span className="text-gray-400 font-normal ml-1">{fmtDate(c.created_at)}</span></p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            {selected.comments.length===0 && <p className="text-xs text-gray-400">No comments yet. Start the discussion!</p>}
          </div>
          {user && (
            <div className="flex gap-2">
              <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();postComment();}}} placeholder="Add a comment…"
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300"/>
              <button onClick={postComment} disabled={commenting||!comment.trim()} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition">
                {commenting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
              </button>
            </div>
          )}
        </div>

        {/* Conclude modal */}
        {concludeModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Conclude Idea</h3>
              <textarea value={conclusion} onChange={e=>setConclusion(e.target.value)} placeholder="Write a summary or outcome of this idea thread…" rows={4}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300 resize-none mb-4"/>
              <div className="flex gap-2">
                <button onClick={concludeIdea} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition">Conclude</button>
                <button onClick={()=>setConcludeModal(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Idea Threads</h2>
          <p className="text-xs text-gray-500 mt-0.5">Share ideas, collaborate, and build together</p>
        </div>
        {user && (
          <button onClick={()=>setShowNew(n=>!n)} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition">
            <Plus size={14}/>{showNew?"Cancel":"New Idea"}
          </button>
        )}
      </div>

      {showNew && (
        <div className="bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-500/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Share Your Idea</h3>
          <input value={newForm.title} onChange={e=>setNewForm(p=>({...p,title:e.target.value}))} placeholder="Idea title *"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300"/>
          <textarea value={newForm.description} onChange={e=>setNewForm(p=>({...p,description:e.target.value}))} placeholder="Describe your idea, problem it solves, what you're looking for…" rows={3}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300 resize-none"/>
          <input value={newForm.tags} onChange={e=>setNewForm(p=>({...p,tags:e.target.value}))} placeholder="Tags: AI, EdTech, Health (comma-separated)"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300"/>
          <button onClick={createIdea} disabled={posting||!newForm.title.trim()} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition">
            {posting?<Loader2 size={14} className="animate-spin"/>:<Send size={14}/>}Share Idea
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-violet-400" size={24}/></div>
      ) : ideas.length===0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <Hash size={28} className="text-gray-300 mx-auto mb-2"/>
          <p className="text-sm text-gray-500 font-semibold">No ideas yet</p>
          <p className="text-xs text-gray-400 mt-1">Share the first idea and find collaborators!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map(idea => (
            <button key={idea.id} onClick={()=>loadDetail(idea.id)} className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-500/50 rounded-xl p-4 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-400 transition">{idea.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${idea.status==="open"?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-500"}`}>{idea.status}</span>
                  </div>
                  {idea.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{idea.description}</p>}
                  {idea.tags?.length>0 && <div className="flex flex-wrap gap-1 mt-2">{idea.tags.slice(0,4).map((t,i)=><span key={i} className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full px-1.5 py-0.5">#{t}</span>)}</div>}
                  <p className="text-[10px] text-gray-400 mt-2">by {idea.owner_name} · {fmtDate(idea.created_at)}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Users size={10}/>{idea.contributor_count||0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={10}/>{idea.comment_count||0}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-white" size={32}/>
        </div>
      )}
    </div>
  );
}

// ── Community & Threads Section ────────────────────────────────────────────────
function CommunitySection({ user, onEnquiry, onOutreach, onMockInterview }: { user: C360User|null; onEnquiry: ()=>void; onOutreach: ()=>void; onMockInterview: ()=>void }) {
  type CTab = "threads" | "friends" | "alumni";
  const [ctab, setCtab] = useState<CTab>("threads");

  // Threads
  const [threads, setThreads] = useState<C360Thread[]>(() => user ? loadThreads(user.id) : []);
  const STATUS_COLORS = { sent:"bg-blue-100 text-blue-700", replied:"bg-emerald-100 text-emerald-700", closed:"bg-gray-100 text-gray-500" };
  const TYPE_ICONS: Record<string, React.ReactNode> = { enquiry:<MessageCircle size={12}/>, outreach:<Megaphone size={12}/> };
  function closeThread(id: string) {
    if (!user) return;
    const next = threads.map(t=>t.id===id?{...t,status:"closed" as const}:t);
    setThreads(next); saveThreads(user.id, next);
  }

  // Friends
  const [friends, setFriends] = useState<C360Friend[]>([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [searchResults, setSearchResults] = useState<C360User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  useEffect(() => {
    if (ctab==="friends" && user && !friendsLoaded) {
      c360Fetch("/friends").then(r => { if (r.success) setFriends(r.data||[]); setFriendsLoaded(true); });
    }
  }, [ctab, user, friendsLoaded]);
  async function searchUsers() {
    if (!friendSearch.trim()) return;
    setSearchLoading(true);
    const r = await c360Fetch(`/auth/search?q=${encodeURIComponent(friendSearch)}`);
    if (r.success) setSearchResults(r.data||[]);
    setSearchLoading(false);
  }
  async function sendFriendReq(peer: C360User) {
    const r = await c360Fetch("/friends/request", { method:"POST", body: JSON.stringify({ toId: peer.id, toName: peer.name }) });
    if (r.success) setFriends(f=>[...f, r.data]);
    setSearchResults(s=>s.filter(u=>u.id!==peer.id));
  }
  async function respondFriend(id: string, action: "accept"|"reject") {
    await c360Fetch(`/friends/${id}/${action}`, { method:"PUT" });
    if (action==="accept") setFriends(f=>f.map(fr=>fr.id===id?{...fr,status:"accepted"}:fr));
    else setFriends(f=>f.filter(fr=>fr.id!==id));
  }

  // Alumni
  const [alumni, setAlumni] = useState<C360AlumniProfile[]>([]);
  const [myAlumni, setMyAlumni] = useState<C360AlumniProfile|null>(null);
  const [alumniInvites, setAlumniInvites] = useState<C360AlumniInvite[]>([]);
  const [alumniLoaded, setAlumniLoaded] = useState(false);
  const [showAlumniReg, setShowAlumniReg] = useState(false);
  const [alumniForm, setAlumniForm] = useState({ college:"", batchYear:"", currentCompany:"", jobRole:"", linkedin:"", bio:"" });
  const [alumniSaving, setAlumniSaving] = useState(false);
  const [inviteModal, setInviteModal] = useState<C360AlumniProfile|null>(null);
  const [inviteMsg, setInviteMsg] = useState("");
  useEffect(() => {
    if (ctab==="alumni" && !alumniLoaded) {
      c360Fetch("/alumni").then(r => { if (r.success) setAlumni(r.data||[]); });
      if (user) {
        c360Fetch("/alumni/my-profile").then(r => { if (r.success && r.data) { setMyAlumni(r.data); setAlumniForm(f=>({...f,...r.data})); } });
        c360Fetch("/alumni/invites").then(r => { if (r.success) setAlumniInvites(r.data||[]); });
      }
      setAlumniLoaded(true);
    }
  }, [ctab, user, alumniLoaded]);
  async function saveAlumni() {
    setAlumniSaving(true);
    const r = await c360Fetch("/alumni/register", { method:"POST", body: JSON.stringify(alumniForm) });
    if (r.success) { setMyAlumni(r.data); setAlumni(a=>[r.data,...a.filter(x=>x.user_id!==r.data.user_id)]); setShowAlumniReg(false); }
    setAlumniSaving(false);
  }
  async function sendInvite() {
    if (!inviteModal) return;
    await c360Fetch("/alumni/invite", { method:"POST", body: JSON.stringify({ toId: inviteModal.user_id, toName: inviteModal.user_name, message: inviteMsg }) });
    setInviteModal(null); setInviteMsg("");
  }
  async function respondInvite(id: string, action: string) {
    await c360Fetch(`/alumni/invites/${id}/respond`, { method:"PUT", body: JSON.stringify({ action }) });
    setAlumniInvites(i=>i.filter(x=>x.id!==id));
  }
  const myFriends = friends.filter(f=>f.status==="accepted");
  const pendingIn = friends.filter(f=>f.status==="pending" && f.to_id===user?.id);
  const pendingOut = friends.filter(f=>f.status==="pending" && f.from_id===user?.id);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-1 flex items-center gap-2"><Users size={20} className="text-violet-600"/>Community Hub</h2>
        <p className="text-xs text-gray-500 mb-4">Stay connected with friends, alumni, and peers</p>
      </div>

      {/* Quick action cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label:"College Enquiry", icon:<MessageCircle size={18} className="text-teal-600"/>, color:"border-teal-200 bg-teal-50", action: onEnquiry },
          { label:"Outreach Agent", icon:<Megaphone size={18} className="text-indigo-600"/>, color:"border-indigo-200 bg-indigo-50", action: onOutreach },
          { label:"Mock Interview", icon:<Trophy size={18} className="text-amber-600"/>, color:"border-amber-200 bg-amber-50", action: onMockInterview },
        ].map(c=>(
          <button key={c.label} onClick={user?c.action:()=>{}} className={`border rounded-xl p-3 text-left hover:opacity-90 transition flex items-center gap-2.5 ${c.color}`}>
            {c.icon}<span className="text-xs font-bold text-gray-800">{c.label}</span><ArrowRight size={12} className="ml-auto text-gray-500"/>
          </button>
        ))}
      </div>

      {/* Sub tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        {([["threads","💬 Threads"],["friends","👥 Friends"],["alumni","🎓 Alumni"]] as [CTab,string][]).map(([t,l])=>(
          <button key={t} onClick={()=>setCtab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition relative ${ctab===t?"bg-white text-violet-700 shadow-sm":"text-gray-600 hover:text-gray-800"}`}>
            {l}
            {t==="friends" && pendingIn.length>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{pendingIn.length}</span>}
            {t==="alumni" && alumniInvites.length>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{alumniInvites.length}</span>}
          </button>
        ))}
      </div>

      {/* THREADS TAB */}
      {ctab === "threads" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Communication Threads</h3>
            <span className="text-xs text-gray-400">{threads.filter(t=>t.status!=="closed").length} active</span>
          </div>
          {!user ? (
            <div className="text-center py-8 text-gray-400"><Hash size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">Sign in to view your threads</p></div>
          ) : threads.length===0 ? (
            <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-400"><Hash size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No threads yet. Start an enquiry or outreach above.</p></div>
          ) : (
            <div className="space-y-2">
              {threads.map(t=>(
                <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${t.type==="enquiry"?"bg-teal-100 text-teal-600":"bg-indigo-100 text-indigo-600"}`}>{TYPE_ICONS[t.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-gray-900 truncate">{t.subject}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">To: {t.to} · {new Date(t.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{t.body.slice(0,100)}…</p>
                    </div>
                    {t.status!=="closed" && <button onClick={()=>closeThread(t.id)} className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0">Close</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FRIENDS TAB */}
      {ctab === "friends" && (
        <div className="space-y-4">
          {/* Incoming requests */}
          {pendingIn.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-3">{pendingIn.length} Friend Request{pendingIn.length!==1?"s":""}</p>
              <div className="space-y-2">
                {pendingIn.map(f=>(
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">{f.from_name[0]||"?"}</div>
                    <p className="text-sm font-semibold text-gray-800 flex-1">{f.from_name}</p>
                    <button onClick={()=>respondFriend(f.id,"accept")} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">Accept</button>
                    <button onClick={()=>respondFriend(f.id,"reject")} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition">Reject</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Search to add */}
          {user && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={friendSearch} onChange={e=>setFriendSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchUsers()} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-violet-500" placeholder="Search by name or email..."/>
              </div>
              <button onClick={searchUsers} disabled={searchLoading} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-60">
                {searchLoading?<Loader2 size={12} className="animate-spin"/>:"Search"}
              </button>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map(u=>(
                <div key={u.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">{u.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{u.role} {u.college?`· ${u.college}`:""}</p>
                  </div>
                  <button onClick={()=>sendFriendReq(u)} className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1">
                    <Plus size={11}/>Add
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Friends list */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{myFriends.length} Friends</p>
            {myFriends.length===0 && !user ? (
              <div className="text-center py-8 text-gray-400"><Users size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">Sign in to see your friends</p></div>
            ) : myFriends.length===0 ? (
              <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400"><Users size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No friends yet. Search and add peers!</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myFriends.map(f=>(
                  <div key={f.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold shrink-0">{f.peer_name[0]||"?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{f.peer_name}</p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">Connected</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {pendingOut.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Pending Sent ({pendingOut.length})</p>
              <div className="flex flex-wrap gap-2">
                {pendingOut.map(f=><span key={f.id} className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1">{f.to_name}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALUMNI TAB */}
      {ctab === "alumni" && (
        <div className="space-y-4">
          {/* Pending alumni invites */}
          {alumniInvites.length > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-violet-800 mb-3">Alumni Connection Requests ({alumniInvites.length})</p>
              {alumniInvites.map(inv=>(
                <div key={inv.id} className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm">{inv.from_name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{inv.from_name}</p>
                    {inv.message && <p className="text-xs text-gray-500 italic">"{inv.message}"</p>}
                  </div>
                  <button onClick={()=>respondInvite(inv.id,"accepted")} className="px-2 py-1 bg-violet-600 text-white text-xs font-bold rounded-lg">Accept</button>
                  <button onClick={()=>respondInvite(inv.id,"hold")} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">Hold</button>
                  <button onClick={()=>respondInvite(inv.id,"rejected")} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">Reject</button>
                </div>
              ))}
            </div>
          )}

          {/* Register as Alumni CTA */}
          {user && !myAlumni && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-center">
              <GraduationCap className="text-white/80 mx-auto mb-2" size={28}/>
              <h3 className="text-base font-black text-white mb-1">Register as Alumni</h3>
              <p className="text-violet-200 text-xs mb-3">Share your journey & mentor the next batch. Current students can connect with you.</p>
              <button onClick={()=>setShowAlumniReg(true)} className="px-5 py-2 bg-white text-violet-700 rounded-xl font-bold text-xs hover:bg-violet-50 transition">Register as Alumni →</button>
            </div>
          )}
          {myAlumni && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-600 shrink-0"/>
              <div>
                <p className="text-sm font-bold text-emerald-800">You're registered as Alumni</p>
                <p className="text-xs text-emerald-600">{myAlumni.job_role||""} {myAlumni.current_company?`@ ${myAlumni.current_company}`:""} · Batch {myAlumni.batch_year||"?"}</p>
              </div>
              <button onClick={()=>setShowAlumniReg(true)} className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Edit</button>
            </div>
          )}

          {/* Alumni registration form */}
          {showAlumniReg && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-900">Alumni Profile</p>
              {[["College / University","college","Your college name"],["Batch Year","batchYear","e.g. 2022"],["Current Company","currentCompany","Where you work now"],["Current Role","jobRole","Software Engineer, etc."],["LinkedIn","linkedin","https://linkedin.com/in/..."]].map(([lbl,key,ph])=>(
                <div key={key}><label className="text-xs font-semibold text-gray-600 mb-1 block">{lbl}</label>
                  <input value={(alumniForm as any)[key]} onChange={e=>setAlumniForm(f=>({...f,[key]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" placeholder={ph}/>
                </div>
              ))}
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Bio</label>
                <textarea value={alumniForm.bio} onChange={e=>setAlumniForm(f=>({...f,bio:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none" placeholder="Your journey, what you can help with..."/>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowAlumniReg(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                <button onClick={saveAlumni} disabled={alumniSaving} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-1">
                  {alumniSaving&&<Loader2 size={12} className="animate-spin"/>}Save Alumni Profile
                </button>
              </div>
            </div>
          )}

          {/* Alumni invite modal */}
          {inviteModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={()=>setInviteModal(null)}>
              <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl" onClick={e=>e.stopPropagation()}>
                <p className="text-sm font-bold text-gray-900 mb-1">Connect with {inviteModal.user_name}</p>
                <p className="text-xs text-gray-500 mb-3">{inviteModal.job_role||""} {inviteModal.current_company?`@ ${inviteModal.current_company}`:""}</p>
                <textarea value={inviteMsg} onChange={e=>setInviteMsg(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none mb-3" placeholder="Hi! I'd love to connect and learn from your journey..."/>
                <div className="flex gap-2">
                  <button onClick={()=>setInviteModal(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
                  <button onClick={sendInvite} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-500 transition">Send Invite</button>
                </div>
              </div>
            </div>
          )}

          {/* Alumni listing */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Alumni Network ({alumni.length})</p>
            {alumni.length===0 ? (
              <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400"><GraduationCap size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No alumni registered yet. Be the first!</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {alumni.map(a=>(
                  <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-violet-200 transition">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">{a.user_name[0]||"A"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-900 truncate">{a.user_name}</p>
                          {a.is_verified && <CheckCircle size={12} className="text-emerald-500 shrink-0"/>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{a.job_role||""}{a.current_company?` @ ${a.current_company}`:""}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {a.college && <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 rounded-full px-2 py-0.5">{a.college}</span>}
                      {a.batch_year && <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Batch {a.batch_year}</span>}
                    </div>
                    {a.bio && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{a.bio}</p>}
                    <div className="flex items-center gap-2">
                      {a.linkedin && <a href={a.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"><ExternalLink size={10}/>LinkedIn</a>}
                      {user && a.user_id !== user.id && (
                        <button onClick={()=>setInviteModal(a)} className="ml-auto px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1">
                          <Send size={10}/>Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── C360 Ad Banner (DB-driven, superadmin managed) ────────────────────────────
function C360AdSection({ placement="home" }: { placement?: string }) {
  const [ads, setAds] = useState<C360Ad[]>([]);
  useEffect(() => {
    c360Fetch(`/ads?placement=${placement}`).then(r => { if (r.success) setAds(r.data||[]); });
  }, [placement]);
  if (ads.length === 0) return null;
  const ad = ads[0];
  const bgMap: Record<string,string> = {
    violet:"from-violet-600 to-indigo-600",
    teal:"from-teal-600 to-emerald-600",
    orange:"from-orange-500 to-red-500",
    blue:"from-blue-600 to-cyan-600",
  };
  const bg = bgMap[ad.bg_gradient] || bgMap.violet;
  return (
    <div className={`bg-gradient-to-r ${bg} rounded-2xl p-4 mb-6 flex items-center gap-4`}>
      <div className="flex-1 min-w-0">
        {ad.badge && <span className="text-[10px] font-black bg-white/20 text-white rounded-full px-2 py-0.5 mb-2 inline-block">{ad.badge}</span>}
        <p className="text-sm font-black text-white mb-0.5">{ad.title}</p>
        {ad.description && <p className="text-xs text-white/80 line-clamp-1">{ad.description}</p>}
      </div>
      {ad.cta_text && (
        <button
          onClick={()=>{ c360Fetch(`/ads/${ad.id}/click`,{method:"POST"}); if(ad.cta_url&&!ad.cta_url.startsWith("#"))window.open(ad.cta_url,"_blank"); }}
          className="shrink-0 px-4 py-2 bg-white text-violet-700 rounded-xl text-xs font-black hover:bg-violet-50 transition whitespace-nowrap">
          {ad.cta_text}
        </button>
      )}
    </div>
  );
}

// ── Work Projects Section (apply for expert/TC/company projects) ───────────────
function WorkProjectsSection({ user, onNeedAuth }: { user: C360User|null; onNeedAuth: ()=>void }) {
  const [projects, setProjects] = useState<C360WorkProject[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"browse"|"mine"|"post">("browse");
  const [applyModal, setApplyModal] = useState<C360WorkProject|null>(null);
  const [applyMsg, setApplyMsg] = useState("");
  const [applySending, setApplySending] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [postForm, setPostForm] = useState({ title:"", company:"", description:"", skills:"", duration:"", stipend:"", spots:"1" });
  const [posting, setPosting] = useState(false);
  const [postDone, setPostDone] = useState(false);
  const canPost = user && (user.role==="mentor"||user.role==="expert"||user.role==="recruiter"||user.role==="training_center");

  useEffect(()=>{
    setLoading(true);
    c360Fetch("/work-projects").then(r=>{ if(r.success) setProjects(r.data||[]); }).finally(()=>setLoading(false));
    if (user) c360Fetch("/work-projects/my-applications").then(r=>{ if(r.success){ setMyApps(r.data||[]); setApplied((r.data||[]).map((a:any)=>a.project_id)); } });
  },[user]);

  async function apply() {
    if (!applyModal) return;
    setApplySending(true);
    const r = await c360Fetch(`/work-projects/${applyModal.id}/apply`, { method:"POST", body: JSON.stringify({ message: applyMsg }) });
    if (r.success) { setApplied(a=>[...a, applyModal.id]); setApplyModal(null); setApplyMsg(""); }
    setApplySending(false);
  }

  async function postProject() {
    if (!postForm.title) return;
    setPosting(true);
    const r = await c360Fetch("/work-projects", { method:"POST", body: JSON.stringify({ ...postForm, skills: postForm.skills.split(",").map(s=>s.trim()).filter(Boolean), spots: parseInt(postForm.spots)||1 }) });
    if (r.success) { setProjects(p=>[r.data,...p]); setPostDone(true); setPostForm({ title:"", company:"", description:"", skills:"", duration:"", stipend:"", spots:"1" }); }
    setPosting(false);
  }

  const ROLE_COLORS: Record<string,string> = { mentor:"bg-violet-100 text-violet-700", recruiter:"bg-blue-100 text-blue-700", training_center:"bg-teal-100 text-teal-700" };
  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 bg-white";

  return (
    <div>
      {applyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={()=>setApplyModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <p className="text-sm font-bold text-gray-900 mb-1">Apply: {applyModal.title}</p>
            <p className="text-xs text-gray-500 mb-3">by {applyModal.poster_name} {applyModal.company?`· ${applyModal.company}`:""}</p>
            <textarea value={applyMsg} onChange={e=>setApplyMsg(e.target.value)} rows={4} className={inp+" resize-none mb-3"} placeholder="Why are you a good fit? Mention relevant projects or skills..."/>
            <div className="flex gap-2">
              <button onClick={()=>setApplyModal(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button onClick={apply} disabled={applySending} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-500 transition disabled:opacity-60 flex items-center justify-center gap-1">
                {applySending&&<Loader2 size={12} className="animate-spin"/>}Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Briefcase size={20} className="text-violet-600"/>Work Projects</h2><p className="text-xs text-gray-500 mt-0.5">Real projects from mentors, companies & training centers</p></div>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-5 w-fit">
        {([["browse","🔍 Browse"],["mine","📋 My Applications"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab===t?"bg-white text-violet-700 shadow-sm":"text-gray-600 hover:text-gray-800"}`}>{l}</button>
        ))}
        {canPost && <button onClick={()=>setTab("post")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab==="post"?"bg-white text-violet-700 shadow-sm":"text-gray-600 hover:text-gray-800"}`}>📤 Post Project</button>}
      </div>

      {/* BROWSE */}
      {tab === "browse" && (
        loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-500"/></div> :
        projects.length===0 ? (
          <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
            <Briefcase size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-sm text-gray-500 font-semibold mb-1">No projects posted yet</p>
            <p className="text-xs text-gray-400">Mentors and training centers will post projects here soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.map(p=>(
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-violet-200 transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.poster_name}{p.company?` · ${p.company}`:""}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLORS[p.poster_type]||"bg-gray-100 text-gray-600"}`}>{p.poster_type.replace("_"," ")}</span>
                </div>
                {p.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{p.description}</p>}
                {p.skills?.length>0 && <div className="flex flex-wrap gap-1 mb-2">{p.skills.map(s=><span key={s} className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 rounded px-1.5 py-0.5">{s}</span>)}</div>}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  {p.duration && <span className="flex items-center gap-1"><Clock size={11}/>{p.duration}</span>}
                  {p.stipend && <span className="flex items-center gap-1"><CreditCard size={11}/>{p.stipend}</span>}
                  {p.spots && <span>{p.spots} spot{p.spots!==1?"s":""}</span>}
                </div>
                {applied.includes(p.id) ? (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle size={13}/>Applied</div>
                ) : user ? (
                  <button onClick={()=>setApplyModal(p)} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition">Apply Now</button>
                ) : (
                  <button onClick={onNeedAuth} className="w-full py-2 border border-violet-200 text-violet-600 rounded-xl text-xs font-bold hover:bg-violet-50 transition">Sign in to Apply</button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* MY APPLICATIONS */}
      {tab === "mine" && (
        !user ? <div className="text-center py-12 text-gray-400"><Briefcase size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">Sign in to view your applications</p></div> :
        myApps.length===0 ? <div className="text-center py-12 text-gray-400"><Briefcase size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No applications yet. Browse projects and apply!</p></div> :
        <div className="space-y-3">
          {myApps.map(a=>(
            <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{a.project_title}</p>
                <p className="text-xs text-gray-500">{a.poster_name}{a.company?` · ${a.company}`:""}{a.stipend?` · ${a.stipend}`:""}</p>
                <p className="text-xs text-gray-400 mt-0.5">Applied {new Date(a.applied_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${a.status==="accepted"?"bg-emerald-100 text-emerald-700":a.status==="rejected"?"bg-red-100 text-red-600":"bg-amber-100 text-amber-700"}`}>{a.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* POST PROJECT (mentors / recruiters / TCs) */}
      {tab === "post" && canPost && (
        postDone ? (
          <div className="text-center py-12">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500"/>
            <p className="text-sm font-bold text-gray-900 mb-1">Project Posted!</p>
            <p className="text-xs text-gray-500 mb-4">Students can now discover and apply to your project.</p>
            <button onClick={()=>{ setPostDone(false); setTab("browse"); }} className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-500 transition">View Projects</button>
          </div>
        ) : (
          <div className="max-w-lg space-y-3">
            <p className="text-sm font-bold text-gray-900">Post a Project / Work Opportunity</p>
            {[["Project Title *","title","React Dashboard Project"],["Company / Organization","company","Your company or institute"],["Duration","duration","2 months"],["Stipend / Compensation","stipend","₹5,000/month or Unpaid"]].map(([lbl,key,ph])=>(
              <div key={key}><label className="text-xs font-semibold text-gray-600 mb-1 block">{lbl}</label>
                <input value={(postForm as any)[key]} onChange={e=>setPostForm(f=>({...f,[key]:e.target.value}))} className={inp} placeholder={ph}/>
              </div>
            ))}
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Skills Required (comma-separated)</label>
              <input value={postForm.skills} onChange={e=>setPostForm(f=>({...f,skills:e.target.value}))} className={inp} placeholder="React, Node.js, PostgreSQL"/>
            </div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <textarea value={postForm.description} onChange={e=>setPostForm(f=>({...f,description:e.target.value}))} rows={3} className={inp+" resize-none"} placeholder="What will the student work on? What will they learn?"/>
            </div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Open Spots</label>
              <input type="number" value={postForm.spots} onChange={e=>setPostForm(f=>({...f,spots:e.target.value}))} className={inp} min="1" max="50"/>
            </div>
            <button onClick={postProject} disabled={!postForm.title||posting} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {posting&&<Loader2 size={13} className="animate-spin"/>}Post Project
            </button>
          </div>
        )
      )}
    </div>
  );
}

// ── Study Plan Tab Section ─────────────────────────────────────────────────────
function StudyPlanTab({ user, onOpenPlanner }: { user: C360User|null; onOpenPlanner: ()=>void }) {
  const savedPlan: C360StudyPlan|null = (() => { try { if(!user) return null; const s=localStorage.getItem(SPK(user.id)); return s?JSON.parse(s):null; } catch { return null; } })();
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Calendar size={20} className="text-violet-600"/>Study Planner</h2><p className="text-xs text-gray-500 mt-0.5">AI-generated personalised learning plans</p></div>
        <button onClick={user?onOpenPlanner:()=>{}} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-xs font-bold text-white transition">
          <Sparkles size={12}/>{savedPlan?"Regenerate Plan":"Create My Plan"}
        </button>
      </div>
      {!user ? (
        <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl"><Calendar size={40} className="mx-auto mb-3 text-gray-300"/><p className="text-sm text-gray-500 mb-3">Sign in to create your personalised study plan</p></div>
      ) : !savedPlan ? (
        <div className="text-center py-16 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl">
          <Calendar size={40} className="mx-auto mb-3 text-teal-500"/>
          <p className="text-sm font-semibold text-teal-800 mb-1">No study plan yet</p>
          <p className="text-xs text-teal-600 mb-4 max-w-xs mx-auto">Tell AI your goal and it will create a personalised week-by-week plan with daily topics, tasks, and resources.</p>
          <button onClick={onOpenPlanner} className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition flex items-center gap-2 mx-auto">
            <Sparkles size={14}/>Generate My Study Plan
          </button>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto px-4">
            {["Set your goal","Choose tech & level","Pick duration","Get AI plan"].map((s,i)=>(
              <div key={s} className="text-center"><div className="w-7 h-7 bg-teal-100 text-teal-700 rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-1">{i+1}</div><p className="text-[10px] text-teal-700">{s}</p></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
            <div><p className="text-sm font-bold text-teal-800">{savedPlan.goal}</p><p className="text-xs text-teal-600 mt-0.5">{savedPlan.tech} · {savedPlan.weeks.length} weeks · Created {new Date(savedPlan.generatedAt).toLocaleDateString()}</p></div>
            <button onClick={onOpenPlanner} className="shrink-0 text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Pencil size={11}/>Edit</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedPlan.weeks.map(w=>(
              <div key={w.week} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-teal-100 text-teal-700 rounded-full text-xs font-bold flex items-center justify-center shrink-0">{w.week}</div>
                  <p className="text-xs font-bold text-gray-900">{w.focus}</p>
                </div>
                <ul className="space-y-1">{w.days.slice(0,3).map(d=><li key={d.day} className="text-[11px] text-gray-500 flex gap-1.5"><span className="text-teal-400 shrink-0">·</span>{d.topic}</li>)}</ul>
                {w.days.length>3 && <p className="text-[10px] text-gray-400 mt-1">+{w.days.length-3} more days</p>}
              </div>
            ))}
          </div>
          <button onClick={onOpenPlanner} className="w-full py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 font-semibold transition flex items-center justify-center gap-1"><Sparkles size={12}/>Open Full Plan</button>
        </div>
      )}
    </div>
  );
}

// ── Advertisement Banner replaced by shared AdBanner component ────────────────

// ── Advance Search Panel (shared between student + recruiter) ─────────────────
interface AdvanceSearchPanelProps {
  srcMode: SourcingMode; setSrcMode: (m: SourcingMode) => void;
  srcRole: string; setSrcRole: (v: string) => void;
  srcLocation: string; setSrcLocation: (v: string) => void;
  srcSkills: string; setSrcSkills: (v: string) => void;
  srcMax: number; setSrcMax: (v: number) => void;
  srcBaseUrl: string; setSrcBaseUrl: (v: string) => void;
  srcLoading: boolean; srcError: string;
  srcDone: boolean; srcJobs: SourcingJob[]; srcCandidates: SourcingCandidate[];
  onTrigger: (mode?: SourcingMode) => void;
}

const CAT_COLOR: Record<string, string> = {
  "full stack developer": "bg-violet-100 text-violet-700 border-violet-200",
  "frontend":             "bg-blue-100 text-blue-700 border-blue-200",
  "backend":              "bg-indigo-100 text-indigo-700 border-indigo-200",
  "data science":         "bg-teal-100 text-teal-700 border-teal-200",
  "machine learning":     "bg-emerald-100 text-emerald-700 border-emerald-200",
  "devops":               "bg-cyan-100 text-cyan-700 border-cyan-200",
  "cloud":                "bg-sky-100 text-sky-700 border-sky-200",
  "mobile":               "bg-pink-100 text-pink-700 border-pink-200",
  "security":             "bg-red-100 text-red-700 border-red-200",
  "general":              "bg-gray-100 text-gray-600 border-gray-200",
};
const catCls = (cat: string) => CAT_COLOR[cat.toLowerCase()] ?? CAT_COLOR["general"];

const PORTAL_COLOR: Record<string, string> = {
  "linkedin": "bg-[#0A66C2] text-white",
  "github":   "bg-gray-900 text-white",
  "naukri":   "bg-orange-500 text-white",
  "indeed":   "bg-blue-600 text-white",
  "glassdoor":"bg-emerald-600 text-white",
};
const portalCls = (p: string) => PORTAL_COLOR[p.toLowerCase()] ?? "bg-violet-600 text-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Pagination({ page, total, pageSize, onChange }: { page:number; total:number; pageSize:number; onChange:(p:number)=>void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const start = (page-1)*pageSize+1, end = Math.min(page*pageSize, total);
  const nums: (number|"…")[] = [];
  if (pages <= 7) { for (let i=1;i<=pages;i++) nums.push(i); }
  else {
    nums.push(1);
    if (page > 3) nums.push("…");
    for (let i=Math.max(2,page-1);i<=Math.min(pages-1,page+1);i++) nums.push(i);
    if (page < pages-2) nums.push("…");
    nums.push(pages);
  }
  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <p className="text-[11px] text-gray-400">{start}–{end} of {total}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page-1)} disabled={page===1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition text-xs">‹</button>
        {nums.map((n,i) => n==="…"
          ? <span key={`e${i}`} className="w-7 text-center text-xs text-gray-400">…</span>
          : <button key={n} onClick={() => onChange(n as number)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition border ${n===page?"bg-violet-600 text-white border-violet-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{n}</button>
        )}
        <button onClick={() => onChange(page+1)} disabled={page===pages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition text-xs">›</button>
      </div>
    </div>
  );
}

function SortFilterBar({
  sortVal, sortOptions, onSort,
  filters,
}: {
  sortVal: string;
  sortOptions: {v:string;l:string}[];
  onSort: (v:string) => void;
  filters: {label:string; val:string; options:{v:string;l:string}[]; onChange:(v:string)=>void}[];
}) {
  const sel = "text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-violet-400 appearance-none pr-6 cursor-pointer";
  return (
    <div className="flex items-center gap-2 flex-wrap mb-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
      <ArrowUpDown size={12} className="text-gray-400 shrink-0"/>
      <div className="relative">
        <select value={sortVal} onChange={e => onSort(e.target.value)} className={sel}>
          {sortOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
      </div>
      {filters.map(f => (
        <div key={f.label} className="relative">
          <select value={f.val} onChange={e => f.onChange(e.target.value)} className={sel}>
            <option value="all">{f.label}: All</option>
            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
        </div>
      ))}
    </div>
  );
}

function AdvanceSearchPanel({
  srcMode, setSrcMode, srcRole, setSrcRole, srcLocation, setSrcLocation,
  srcSkills, setSrcSkills, srcMax, setSrcMax, srcBaseUrl, setSrcBaseUrl,
  srcLoading, srcError, srcDone, srcJobs, srcCandidates, onTrigger, jobsOnly,
}: AdvanceSearchPanelProps & { jobsOnly?: boolean }) {
  const total = srcJobs.length + srcCandidates.length;
  const inputCls = "w-full bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition";
  const selectCls = inputCls + " appearance-none pr-8";

  // ── Pagination / Sort / Filter state ──
  const [pageSize, setPageSize] = useState(10);
  const [jobPage, setJobPage]   = useState(1);
  const [jobSort, setJobSort]   = useState("title_asc");
  const [jobFilterCat, setJobFilterCat]       = useState("all");
  const [jobFilterPortal, setJobFilterPortal] = useState("all");
  const [candPage, setCandPage] = useState(1);
  const [candSort, setCandSort] = useState("name_asc");
  const [candFilterPortal, setCandFilterPortal] = useState("all");
  const [candFilterAvail,  setCandFilterAvail]  = useState("all");

  // Reset pages whenever data refreshes
  useEffect(() => { setJobPage(1); setJobFilterCat("all"); setJobFilterPortal("all"); }, [srcJobs]);
  useEffect(() => { setCandPage(1); setCandFilterPortal("all"); setCandFilterAvail("all"); }, [srcCandidates]);

  // Derived unique filter options
  const jobCats    = Array.from(new Set(srcJobs.map(j => j.category||j.type||"").filter(Boolean))).sort();
  const jobPortals = Array.from(new Set(srcJobs.map(j => j.source_portal||j.portal||"").filter(Boolean))).sort();
  const candPortals = Array.from(new Set(srcCandidates.map(c => c.source_portal||c.portal||"").filter(Boolean))).sort();

  // ── Platform i360 jobs injected at top ──
  const i360Jobs: SourcingJob[] = MOCK_OPPS.filter(o => o.is_i360).map(o => ({
    id: o.id, title: o.title, company: o.company, location: o.city,
    description: o.desc, url: "https://dplan-ebon.vercel.app/college360",
    portal: "i360", source_portal: "i360",
    salary: o.stipend_min >= 100000 ? `₹${(o.stipend_min/100000).toFixed(1)}–${(o.stipend_max/100000).toFixed(1)} LPA` : `₹${(o.stipend_min/1000).toFixed(0)}k–${(o.stipend_max/1000).toFixed(0)}k/mo`,
    is_i360: true,
  }));

  // ── Sorted + filtered jobs ──
  const processedJobs = (() => {
    const allJobs = [...i360Jobs, ...srcJobs.filter(j => !(j.source_portal||j.portal||"").toLowerCase().includes("i360"))];
    let arr = allJobs;
    if (jobFilterCat    !== "all") arr = arr.filter(j => (j.category||j.type||j.source_portal||"") === jobFilterCat);
    if (jobFilterPortal !== "all") arr = arr.filter(j => (j.source_portal||j.portal||"") === jobFilterPortal);
    arr.sort((a,b) => {
      if (a.is_i360 && !b.is_i360) return -1;
      if (!a.is_i360 && b.is_i360) return 1;
      if (jobSort === "title_asc")  return (a.title||"").localeCompare(b.title||"");
      if (jobSort === "title_desc") return (b.title||"").localeCompare(a.title||"");
      if (jobSort === "date_desc")  return (b.sourced_at||b.date_sourced||"").localeCompare(a.sourced_at||a.date_sourced||"");
      if (jobSort === "date_asc")   return (a.sourced_at||a.date_sourced||"").localeCompare(b.sourced_at||b.date_sourced||"");
      if (jobSort === "company_asc") return (a.company||"").localeCompare(b.company||"");
      return 0;
    });
    return arr;
  })();
  const pagedJobs    = processedJobs.slice((jobPage-1)*pageSize, jobPage*pageSize);

  // ── Sorted + filtered candidates ──
  const processedCands = (() => {
    let arr = [...srcCandidates];
    if (candFilterPortal !== "all") arr = arr.filter(c => (c.source_portal||c.portal||"") === candFilterPortal);
    if (candFilterAvail  !== "all") arr = arr.filter(c => (c.availability||"") === candFilterAvail);
    arr.sort((a,b) => {
      if (candSort === "name_asc")  return (a.name||"").localeCompare(b.name||"");
      if (candSort === "name_desc") return (b.name||"").localeCompare(a.name||"");
      if (candSort === "exp_desc")  return parseFloat(b.experience_years||b.experience||"0") - parseFloat(a.experience_years||a.experience||"0");
      if (candSort === "exp_asc")   return parseFloat(a.experience_years||a.experience||"0") - parseFloat(b.experience_years||b.experience||"0");
      return 0;
    });
    return arr;
  })();
  const pagedCands    = processedCands.slice((candPage-1)*pageSize, candPage*pageSize);

  return (
    <div className="flex flex-col lg:flex-row gap-5">

      {/* ── Control Panel ── */}
      <div className="lg:w-68 shrink-0 self-start">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-700/50">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-slate-700/50 flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Zap size={13} className="text-white"/>
            </div>
            <div>
              <p className="text-xs font-black text-white tracking-wide">Advance Search</p>
              <p className="text-[10px] text-slate-400">AI-powered pipeline</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Mode selector — hidden for students (jobs only) */}
            {!jobsOnly && (
              <Field label="Source Mode">
                <div className="grid grid-cols-3 gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                  {([ ["all","All"], ["jobs","Jobs"], ["candidates","People"] ] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setSrcMode(v)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${srcMode===v?"bg-violet-600 text-white shadow":"text-slate-400 hover:text-slate-200"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <Field label="Job Title / Role">
              <div className="relative">
                <Briefcase size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={srcRole} onChange={e => setSrcRole(e.target.value)}
                  placeholder="e.g. Node.js Developer" className={inputCls + " pl-8"}/>
              </div>
            </Field>

            <Field label="Location">
              <div className="relative">
                <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={srcLocation} onChange={e => setSrcLocation(e.target.value)}
                  placeholder="e.g. Bangalore" className={inputCls + " pl-8"}/>
              </div>
            </Field>

            <Field label="Skills">
              <input value={srcSkills} onChange={e => setSrcSkills(e.target.value)}
                placeholder="e.g. Python, Docker, Go" className={inputCls}/>
            </Field>

            <Field label="Max Results per Portal">
              <div className="relative">
                <select value={srcMax} onChange={e => setSrcMax(Number(e.target.value))} className={selectCls}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>All / No Limit (Max 100)</option>
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              </div>
            </Field>

            <div className="pt-3 border-t border-slate-700/60">
              <Field label="API Endpoint">
                <div className="relative">
                  <Globe size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                  <input value={srcBaseUrl} onChange={e => setSrcBaseUrl(e.target.value)}
                    placeholder="https://job-sourcing-agent.vercel.app"
                    className={inputCls + " pl-8 font-mono text-violet-300 text-[10px]"}/>
                </div>
              </Field>
            </div>

            <button onClick={() => onTrigger()} disabled={srcLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition
                bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-violet-900/30">
              {srcLoading
                ? <><Loader2 size={15} className="animate-spin"/>Searching…</>
                : <><Zap size={15}/>Trigger Sourcing Pipelines</>}
            </button>

            {srcDone && !srcLoading && total > 0 && (
              <div className="flex items-center justify-center gap-1.5 py-2 bg-emerald-900/30 border border-emerald-700/40 rounded-xl">
                <CheckCircle size={12} className="text-emerald-400"/>
                <p className="text-[11px] font-bold text-emerald-400">{total} results consolidated</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Results Panel ── */}
      <div className="flex-1 min-w-0">

        {/* Error */}
        {srcError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-red-500 shrink-0"/>
              <p className="text-xs font-bold text-red-700">Connection Error</p>
            </div>
            <pre className="text-[11px] text-red-600 whitespace-pre-wrap font-mono overflow-x-auto">{srcError}</pre>
          </div>
        )}

        {/* Idle */}
        {!srcDone && !srcLoading && !srcError && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
              <Zap size={28} className="text-violet-500"/>
            </div>
            <p className="text-base font-bold text-gray-700">Ready to search</p>
            <p className="text-xs mt-1.5 text-gray-400 max-w-xs">Set your filters on the left and trigger the pipeline — results from all portals appear here instantly</p>
          </div>
        )}

        {/* Skeleton */}
        {srcLoading && (
          <div className="space-y-3">
            {Array.from({length:5}).map((_,i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded-lg w-3/5"/>
                    <div className="h-3 bg-gray-100 rounded w-2/5"/>
                  </div>
                  <div className="h-8 w-24 bg-gray-100 rounded-lg"/>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-1.5"/>
                <div className="h-3 bg-gray-100 rounded w-4/5"/>
              </div>
            ))}
          </div>
        )}

        {/* Global page-size + totals bar */}
        {srcDone && !srcLoading && total > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-xs text-gray-500">{total} total results</p>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span>Per page:</span>
              {[10,20,50].map(n => (
                <button key={n} onClick={() => { setPageSize(n); setJobPage(1); setCandPage(1); }}
                  className={`w-8 h-6 rounded-md font-bold transition text-[11px] ${pageSize===n?"bg-violet-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{n}</button>
              ))}
            </div>
          </div>
        )}

        {/* Candidates */}
        {srcDone && !srcLoading && srcCandidates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-teal-500 rounded-full"/>
              <p className="text-xs font-black uppercase tracking-widest text-gray-700">Candidates</p>
              <span className="ml-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">{processedCands.length} {processedCands.length !== srcCandidates.length ? `of ${srcCandidates.length}` : "found"}</span>
            </div>

            <SortFilterBar
              sortVal={candSort}
              sortOptions={[
                {v:"name_asc",l:"Name A–Z"},{v:"name_desc",l:"Name Z–A"},
                {v:"exp_desc",l:"Most Experience"},{v:"exp_asc",l:"Least Experience"},
              ]}
              onSort={v => { setCandSort(v); setCandPage(1); }}
              filters={[
                { label:"Portal", val:candFilterPortal, options:candPortals.map(p=>({v:p,l:p})),
                  onChange:v => { setCandFilterPortal(v); setCandPage(1); } },
                { label:"Availability", val:candFilterAvail,
                  options:[{v:"available",l:"Available"},{v:"not available",l:"Not Available"}],
                  onChange:v => { setCandFilterAvail(v); setCandPage(1); } },
              ]}
            />

            {processedCands.length === 0
              ? <p className="text-xs text-gray-400 py-6 text-center">No candidates match the current filters.</p>
              : <>
                  <div className="space-y-2.5">
                    {pagedCands.map((c, i) => {
                      const role = c.job_role || c.title || "";
                      const exp  = c.experience_years || c.experience || "";
                      const via  = c.source_portal || c.portal || "";
                      const profileLink = c.profile_url || c.linkedin || "";
                      return (
                        <div key={c.id || i}
                          className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-teal-200 hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-base shrink-0">
                              {c.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                                {via && (
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${portalCls(via)}`}>{via}</span>
                                )}
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  c.availability === "available"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                }`}>{c.availability === "available" ? "● Available" : "● Not Available"}</span>
                              </div>
                              <p className="text-xs text-gray-500">{role || "Role not specified"}{c.location ? ` · ${c.location}` : ""}</p>
                              {c.company && <p className="text-xs text-gray-400 mt-0.5">{role} at {c.company}</p>}
                              {c.skills && c.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2.5">
                                  {c.skills.slice(0,7).map(s => (
                                    <span key={s} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 rounded-md px-1.5 py-0.5">{s}</span>
                                  ))}
                                  {c.skills.length > 7 && <span className="text-[10px] text-gray-400">+{c.skills.length - 7} more</span>}
                                </div>
                              )}
                            </div>
                            {profileLink && (
                              <a href={profileLink} target="_blank" rel="noopener noreferrer"
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded-lg text-[11px] font-bold transition">
                                View profile <ExternalLink size={10}/>
                              </a>
                            )}
                          </div>
                          {exp && exp !== "Not Available" && (
                            <p className="text-[11px] text-gray-400 mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1">
                              <Clock size={10} className="text-gray-300"/>Experience: {exp} years
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Pagination page={candPage} total={processedCands.length} pageSize={pageSize} onChange={setCandPage}/>
                </>
            }
          </div>
        )}

        {/* Jobs */}
        {srcDone && !srcLoading && srcJobs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-violet-500 rounded-full"/>
              <p className="text-xs font-black uppercase tracking-widest text-gray-700">Jobs</p>
              <span className="ml-1 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">{processedJobs.length} {processedJobs.length !== srcJobs.length ? `of ${srcJobs.length}` : "found"}</span>
            </div>

            <SortFilterBar
              sortVal={jobSort}
              sortOptions={[
                {v:"title_asc",l:"Title A–Z"},{v:"title_desc",l:"Title Z–A"},
                {v:"date_desc",l:"Newest First"},{v:"date_asc",l:"Oldest First"},
                {v:"company_asc",l:"Company A–Z"},
              ]}
              onSort={v => { setJobSort(v); setJobPage(1); }}
              filters={[
                { label:"Category", val:jobFilterCat, options:jobCats.map(c=>({v:c,l:c})),
                  onChange:v => { setJobFilterCat(v); setJobPage(1); } },
                { label:"Portal", val:jobFilterPortal, options:jobPortals.map(p=>({v:p,l:p})),
                  onChange:v => { setJobFilterPortal(v); setJobPage(1); } },
              ]}
            />

            {processedJobs.length === 0
              ? <p className="text-xs text-gray-400 py-6 text-center">No jobs match the current filters.</p>
              : <>
                  <div className="space-y-2.5">
                    {pagedJobs.map((j, i) => {
                      const jobUrl    = j.link || j.url || "";
                      const jobDate   = j.sourced_at ? new Date(j.sourced_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : (j.date_sourced || "");
                      const jobType   = j.category || j.type || "";
                      const jobPortal = j.source_portal || j.portal || "";
                      return (
                        <div key={j.id || i}
                          className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 flex-wrap mb-1">
                                <p className="font-bold text-gray-900 text-sm leading-snug">{j.title}</p>
                                {j.is_i360 && <I360Badge/>}
                                {jobType && !j.is_i360 && (
                                  <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${catCls(jobType)}`}>
                                    {jobType}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                {j.company && j.company !== "N/A" && (
                                  <span className="flex items-center gap-1"><Building2 size={10} className="text-gray-400"/>{j.company}</span>
                                )}
                                {j.location && (
                                  <span className="flex items-center gap-1"><MapPin size={10} className="text-gray-400"/>{j.location}</span>
                                )}
                                {jobPortal && (
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${portalCls(jobPortal)}`}>{jobPortal}</span>
                                )}
                              </div>
                            </div>
                            {jobUrl && (
                              <a href={jobUrl} target="_blank" rel="noopener noreferrer"
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 rounded-lg text-[11px] font-bold transition whitespace-nowrap">
                                Apply <ExternalLink size={10}/>
                              </a>
                            )}
                          </div>
                          {j.description && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2.5">{j.description}</p>
                          )}
                          {j.salary && (
                            <p className="text-xs font-semibold text-emerald-700 mb-2.5">{j.salary}</p>
                          )}
                          {jobDate && (
                            <p className="text-[11px] text-gray-400 pt-2.5 border-t border-gray-100 flex items-center gap-1">
                              <Clock size={10} className="text-gray-300"/>Sourced {jobDate}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Pagination page={jobPage} total={processedJobs.length} pageSize={pageSize} onChange={setJobPage}/>
                </>
            }
          </div>
        )}

        {srcDone && !srcLoading && total === 0 && !srcError && (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-gray-400"/>
            </div>
            <p className="text-sm font-semibold text-gray-600">No results found</p>
            <p className="text-xs text-gray-400 mt-1">Try relaxing your filters or check the API connection</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Resume Builder Modal ───────────────────────────────────────────────────
type ResumeStep = "pay"|"s1"|"s2"|"s3"|"s4"|"s5"|"ai"|"preview";
const RESUME_UPI = "8884166603@axisbank";
const RESUME_AMOUNT = 500;

function ResumeBuilderModal({ user, onClose }: { user: C360User|null; onClose: ()=>void }) {
  const [step, setStep] = useState<ResumeStep>("pay");
  const [order, setOrder] = useState<ResumeOrder|null>(null);
  const [txnId, setTxnId] = useState("");
  const [copied, setCopied] = useState(false);
  const [submittingPay, setSubmittingPay] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [form, setForm] = useState({
    name: user?.name||"", email: user?.email||"", phone: user?.phone||"",
    college: user?.college||"", branch:"", year: user?.year||"", gradYear:"2026",
    linkedin:"", github:"",
    targetRole:"", jobType:"internship", objective:"",
    degree:"B.Tech", cgpa:"", courses:"", achievements:"",
    p1Title:"", p1Company:"", p1Desc:"", p1Impact:"",
    p2Title:"", p2Company:"", p2Desc:"", p2Impact:"",
    techSkills:"", tools:"", softSkills:"",
  });
  const set = (k: keyof typeof form, v: string) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    if (!user) return;
    getUserResumeOrder(user.id).then(existing => {
      if (existing) { setOrder(existing); if (existing.status === "approved") setStep("s1"); }
    }).catch(()=>{});
  }, [user]);

  const STEPS: ResumeStep[] = ["s1","s2","s3","s4","s5","ai","preview"];
  const stepIdx = STEPS.indexOf(step);
  const stepLabels = ["Personal","Goal","Education","Projects","Skills","AI Build","Preview"];

  const submitPayment = async () => {
    if (!txnId.trim() || !user) return;
    setSubmittingPay(true);
    try {
      const o: ResumeOrder = { id:`ro_${Date.now()}`, userId:user.id, userName:user.name, userEmail:user.email, txnId:txnId.trim(), submittedAt:new Date().toISOString(), status:"pending" };
      await saveResumeOrder(o); setOrder(o);
    } finally { setSubmittingPay(false); }
  };

  const generateResume = async () => {
    setStep("ai"); setGenerating(true);
    try {
      const prompt = `Write a 3-line ATS-optimized professional summary for this student's resume:
Name: ${form.name}, College: ${form.college}, Branch: ${form.branch}, Year: ${form.year}
Target: ${form.targetRole} (${form.jobType}), Objective: ${form.objective}
Projects: ${form.p1Title}${form.p1Company?" at "+form.p1Company:""}: ${form.p1Desc}
Skills: ${form.techSkills}, Tools: ${form.tools}
Return only the summary paragraph, no preamble.`;
      const r = await fetch("/api/study-planner", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ goal:prompt, year:form.year, subjects:form.techSkills }) });
      const d = await r.json();
      const raw = d?.plan || d?.data?.plan || d?.summary || d?.result || "";
      setAiSummary(raw.trim() || `Results-driven ${form.branch} student from ${form.college} with hands-on experience in ${form.techSkills.split(",")[0]?.trim()}. Passionate about ${form.targetRole} with demonstrated skills in ${form.p1Title||"multiple projects"}. Seeking ${form.jobType} opportunities to create real-world impact.`);
    } catch {
      setAiSummary(`Motivated ${form.branch||"engineering"} student from ${form.college||"a top institution"} with strong foundation in ${form.techSkills.split(",")[0]?.trim()||"software development"}. Delivered impactful projects including ${form.p1Title||"web applications"}. Actively seeking ${form.jobType} opportunities in ${form.targetRole||"technology"}.`);
    }
    setGenerating(false); setStep("preview");
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-gray-50 placeholder-gray-400";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5";

  const preview = `
    <div style="font-family:Georgia,serif;max-width:750px;margin:0 auto;padding:32px;color:#111;line-height:1.5;">
      <div style="border-bottom:2px solid #6d28d9;padding-bottom:12px;margin-bottom:16px;">
        <h1 style="font-size:22px;font-weight:900;margin:0 0 4px;color:#1e1b4b;">${form.name||"Your Name"}</h1>
        <p style="font-size:13px;color:#555;margin:0;">${[form.email,form.phone,form.linkedin?`linkedin.com/in/${form.linkedin}`:"",form.github?`github.com/${form.github}`:""].filter(Boolean).join(" · ")}</p>
      </div>
      ${aiSummary ? `<div style="margin-bottom:16px;"><h2 style="font-size:12px;font-weight:900;letter-spacing:1.5px;color:#6d28d9;text-transform:uppercase;margin:0 0 6px;">Professional Summary</h2><p style="font-size:13px;color:#333;">${aiSummary}</p></div>` : ""}
      <div style="margin-bottom:16px;"><h2 style="font-size:12px;font-weight:900;letter-spacing:1.5px;color:#6d28d9;text-transform:uppercase;margin:0 0 6px;">Education</h2>
        <div style="display:flex;justify-content:space-between;"><strong>${form.degree||"B.Tech"} — ${form.branch||"Computer Science"}</strong><span style="font-size:12px;color:#555;">Grad: ${form.gradYear}</span></div>
        <div style="font-size:13px;color:#555;">${form.college} ${form.cgpa?`· CGPA: ${form.cgpa}`:""}</div>
        ${form.achievements?`<div style="font-size:12px;color:#555;margin-top:4px;">• ${form.achievements}</div>`:""}
      </div>
      ${(form.p1Title||form.p2Title)?`<div style="margin-bottom:16px;"><h2 style="font-size:12px;font-weight:900;letter-spacing:1.5px;color:#6d28d9;text-transform:uppercase;margin:0 0 6px;">Projects & Experience</h2>
        ${form.p1Title?`<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><strong>${form.p1Title}</strong><span style="font-size:12px;color:#555;">${form.p1Company||""}</span></div><div style="font-size:12px;color:#333;">• ${form.p1Desc} ${form.p1Impact?`• Impact: ${form.p1Impact}`:""}</div></div>`:""}
        ${form.p2Title?`<div><div style="display:flex;justify-content:space-between;"><strong>${form.p2Title}</strong><span style="font-size:12px;color:#555;">${form.p2Company||""}</span></div><div style="font-size:12px;color:#333;">• ${form.p2Desc} ${form.p2Impact?`• Impact: ${form.p2Impact}`:""}</div></div>`:""}
      </div>`:""}
      ${form.techSkills?`<div style="margin-bottom:16px;"><h2 style="font-size:12px;font-weight:900;letter-spacing:1.5px;color:#6d28d9;text-transform:uppercase;margin:0 0 6px;">Skills</h2>
        <div style="font-size:13px;"><strong>Technical:</strong> ${form.techSkills}</div>
        ${form.tools?`<div style="font-size:13px;"><strong>Tools:</strong> ${form.tools}</div>`:""}
        ${form.softSkills?`<div style="font-size:13px;"><strong>Soft Skills:</strong> ${form.softSkills}</div>`:""}
      </div>`:""}
    </div>`;

  const printResume = () => {
    const w = window.open("","_blank")!;
    w.document.write(`<!doctype html><html><head><title>${form.name} — Resume</title><style>@media print{body{margin:0}}</style></head><body>${preview}</body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-700 p-5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center"><FileText size={18} className="text-white"/></div>
              <div>
                <h2 className="text-sm font-black text-white">AI Resume Builder</h2>
                <p className="text-violet-200 text-xs">1360Labs Career Service · ₹{RESUME_AMOUNT}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"><X size={15} className="text-white"/></button>
          </div>
          {step !== "pay" && (
            <div className="flex items-center gap-1.5">
              {STEPS.filter(s=>s!=="ai"&&s!=="preview").map((s,i)=>(
                <div key={s} className="flex items-center gap-1.5 flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition ${stepIdx>i?"bg-white text-violet-700":stepIdx===i?"bg-white/90 text-violet-700":"bg-white/20 text-white/60"}`}>{i+1}</div>
                  <div className={`flex-1 h-0.5 rounded-full ${stepIdx>i?"bg-white":"bg-white/20"}`}/>
                </div>
              ))}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step==="preview"?"bg-white text-violet-700":"bg-white/20 text-white/60"}`}><CheckCircle size={12}/></div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* PAY GATE */}
          {step === "pay" && (
            <div>
              {order?.status === "pending" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock size={28} className="text-amber-600"/></div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">Payment Under Review</h3>
                  <p className="text-sm text-gray-500 mb-2">Transaction ID: <span className="font-mono font-bold">{order.txnId}</span></p>
                  <p className="text-xs text-gray-400">Our team will verify your payment within 2–4 hours and unlock the Resume Builder.</p>
                </div>
              ) : order?.status === "rejected" ? (
                <div className="text-center py-6">
                  <p className="text-sm font-bold text-red-600 mb-2">Payment was rejected. Please try again with a valid transaction ID.</p>
                  <button onClick={()=>setOrder(null)} className="text-xs text-violet-600 underline">Try again</button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5">
                    <h3 className="text-base font-black text-gray-900 mb-1">AI Resume Builder — ₹{RESUME_AMOUNT}</h3>
                    <p className="text-xs text-gray-600 mb-4">One-time payment. Get a professional, ATS-optimized resume built step-by-step with AI assistance.</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {["ATS-Optimized Format","AI Professional Summary","Step-by-step Workflow","Print/Download PDF","Lifetime Access","Expert Review Ready"].map(f=>(
                        <div key={f} className="flex items-center gap-1.5 text-xs text-gray-700"><CheckCircle size={12} className="text-violet-600 shrink-0"/>{f}</div>
                      ))}
                    </div>
                    <div className="bg-white border border-violet-200 rounded-xl p-4">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Pay via UPI</p>
                      <div className="flex items-center justify-between bg-violet-50 rounded-lg px-3 py-2.5 mb-3">
                        <span className="font-mono text-sm font-bold text-violet-700">{RESUME_UPI}</span>
                        <button onClick={()=>{ navigator.clipboard.writeText(RESUME_UPI); setCopied(true); setTimeout(()=>setCopied(false),1800); }}
                          className="text-violet-500 hover:text-violet-700 transition">{copied?<Check size={14}/>:<Copy size={14}/>}</button>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Amount: <strong className="text-gray-900">₹{RESUME_AMOUNT}</strong> · Pay and enter your transaction ID below</p>
                      <label className={labelCls}>UPI Transaction / Reference ID *</label>
                      <input value={txnId} onChange={e=>setTxnId(e.target.value)} placeholder="e.g. 4156789012345678" className={inputCls}/>
                    </div>
                  </div>
                  <button onClick={submitPayment} disabled={!txnId.trim()||!user||submittingPay} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl disabled:opacity-40 hover:opacity-90 transition flex items-center justify-center gap-2">
                    {submittingPay && <Loader2 size={15} className="animate-spin"/>}
                    Submit Payment & Start Building →
                  </button>
                  {!user && <p className="text-xs text-center text-gray-400">Please sign in first to purchase this service.</p>}
                </div>
              )}
            </div>
          )}

          {/* S1: Personal Info */}
          {step === "s1" && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-800 mb-1">Personal & Contact Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Full Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ravi Kumar" className={inputCls}/></div>
                <div><label className={labelCls}>Email *</label><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="ravi@email.com" className={inputCls}/></div>
                <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91 98765 43210" className={inputCls}/></div>
                <div><label className={labelCls}>LinkedIn</label><input value={form.linkedin} onChange={e=>set("linkedin",e.target.value)} placeholder="linkedin.com/in/ravi" className={inputCls}/></div>
                <div><label className={labelCls}>GitHub</label><input value={form.github} onChange={e=>set("github",e.target.value)} placeholder="github.com/ravi" className={inputCls}/></div>
                <div><label className={labelCls}>Graduation Year</label><input value={form.gradYear} onChange={e=>set("gradYear",e.target.value)} placeholder="2026" className={inputCls}/></div>
              </div>
            </div>
          )}

          {/* S2: Career Goal */}
          {step === "s2" && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-800 mb-1">Career Goal</p>
              <div><label className={labelCls}>Target Role *</label><input value={form.targetRole} onChange={e=>set("targetRole",e.target.value)} placeholder="Software Engineer, Data Analyst, UX Designer..." className={inputCls}/></div>
              <div><label className={labelCls}>Looking for</label>
                <select value={form.jobType} onChange={e=>set("jobType",e.target.value)} className={inputCls}>
                  <option value="internship">Internship</option>
                  <option value="full-time job">Full-time Job</option>
                  <option value="internship and full-time">Both Internship & Job</option>
                  <option value="campus placement">Campus Placement</option>
                </select>
              </div>
              <div><label className={labelCls}>Career Objective (2–3 sentences)</label>
                <textarea value={form.objective} onChange={e=>set("objective",e.target.value)} rows={3} placeholder="What you're passionate about, what you want to build, what impact you want to create..." className={inputCls+" resize-none"}/>
              </div>
            </div>
          )}

          {/* S3: Education */}
          {step === "s3" && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-800 mb-1">Education</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Degree *</label>
                  <select value={form.degree} onChange={e=>set("degree",e.target.value)} className={inputCls}>
                    {["B.Tech / B.E.","B.Sc","BCA","MCA","M.Tech","MBA","BBA","B.Com"].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Branch *</label><input value={form.branch} onChange={e=>set("branch",e.target.value)} placeholder="Computer Science" className={inputCls}/></div>
                <div><label className={labelCls}>College *</label><input value={form.college} onChange={e=>set("college",e.target.value)} placeholder="Your college name" className={inputCls}/></div>
                <div><label className={labelCls}>CGPA / %</label><input value={form.cgpa} onChange={e=>set("cgpa",e.target.value)} placeholder="8.2" className={inputCls}/></div>
              </div>
              <div><label className={labelCls}>Key Courses (comma-separated)</label><input value={form.courses} onChange={e=>set("courses",e.target.value)} placeholder="Data Structures, Machine Learning, DBMS..." className={inputCls}/></div>
              <div><label className={labelCls}>Academic Achievements</label><input value={form.achievements} onChange={e=>set("achievements",e.target.value)} placeholder="Scholarship, rank, hackathon wins..." className={inputCls}/></div>
            </div>
          )}

          {/* S4: Projects */}
          {step === "s4" && (
            <div className="space-y-5">
              <p className="text-sm font-bold text-gray-800">Projects & Experience <span className="text-gray-400 font-normal text-xs">(up to 2)</span></p>
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">Project / Internship 1</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Title *</label><input value={form.p1Title} onChange={e=>set("p1Title",e.target.value)} placeholder="E-Commerce App" className={inputCls}/></div>
                  <div><label className={labelCls}>Company / Context</label><input value={form.p1Company} onChange={e=>set("p1Company",e.target.value)} placeholder="Self / Company Name" className={inputCls}/></div>
                </div>
                <div><label className={labelCls}>What you built / did</label><textarea value={form.p1Desc} onChange={e=>set("p1Desc",e.target.value)} rows={2} placeholder="Built a full-stack React + Node.js app with payment integration..." className={inputCls+" resize-none"}/></div>
                <div><label className={labelCls}>Impact / Result</label><input value={form.p1Impact} onChange={e=>set("p1Impact",e.target.value)} placeholder="500+ users, reduced load time by 40%..." className={inputCls}/></div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Project / Internship 2 <span className="text-gray-400 font-normal normal-case">(optional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Title</label><input value={form.p2Title} onChange={e=>set("p2Title",e.target.value)} placeholder="ML Recommendation System" className={inputCls}/></div>
                  <div><label className={labelCls}>Company / Context</label><input value={form.p2Company} onChange={e=>set("p2Company",e.target.value)} placeholder="Kaggle / Internship" className={inputCls}/></div>
                </div>
                <div><label className={labelCls}>What you built / did</label><textarea value={form.p2Desc} onChange={e=>set("p2Desc",e.target.value)} rows={2} placeholder="Trained collaborative filtering model on 50k+ records..." className={inputCls+" resize-none"}/></div>
                <div><label className={labelCls}>Impact / Result</label><input value={form.p2Impact} onChange={e=>set("p2Impact",e.target.value)} placeholder="85% accuracy, deployed on Heroku..." className={inputCls}/></div>
              </div>
            </div>
          )}

          {/* S5: Skills */}
          {step === "s5" && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-800 mb-1">Skills & Tools</p>
              <div><label className={labelCls}>Technical Skills *</label><input value={form.techSkills} onChange={e=>set("techSkills",e.target.value)} placeholder="Python, React, SQL, Machine Learning..." className={inputCls}/></div>
              <div><label className={labelCls}>Tools & Platforms</label><input value={form.tools} onChange={e=>set("tools",e.target.value)} placeholder="Git, Docker, Figma, VS Code, AWS..." className={inputCls}/></div>
              <div><label className={labelCls}>Soft Skills</label><input value={form.softSkills} onChange={e=>set("softSkills",e.target.value)} placeholder="Problem Solving, Team Collaboration, Communication..." className={inputCls}/></div>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                <Brain size={28} className="text-violet-600 mx-auto mb-2"/>
                <p className="text-sm font-black text-gray-900 mb-1">Ready to generate your resume!</p>
                <p className="text-xs text-gray-500">AI will craft a professional summary and format everything into a clean, ATS-ready resume.</p>
              </div>
            </div>
          )}

          {/* AI GENERATING */}
          {step === "ai" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-violet-600 animate-pulse"/>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Building Your Resume…</h3>
              <p className="text-sm text-gray-500 mb-6">AI is crafting your professional summary and formatting your experience.</p>
              <div className="flex gap-1.5">
                {[0,1,2].map(i=><div key={i} className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {step === "preview" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black text-gray-900">Your Resume Preview</p>
                <div className="flex gap-2">
                  <button onClick={()=>setStep("s5")} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">← Edit</button>
                  <button onClick={printResume} className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-xs font-black text-white hover:opacity-90 transition">
                    <FileText size={13}/>Download / Print PDF
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div dangerouslySetInnerHTML={{__html: preview}} className="text-sm"/>
              </div>
              {aiSummary && (
                <div className="mt-4 bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide mb-1">AI-Generated Summary</p>
                  <p className="text-xs text-gray-700">{aiSummary}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== "pay" && step !== "ai" && (
          <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
            {step !== "s1" && step !== "preview" && (
              <button onClick={()=>setStep(STEPS[stepIdx-1])} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">← Back</button>
            )}
            {step === "s5" ? (
              <button onClick={generateResume} disabled={generating} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-black text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Sparkles size={15}/>Generate with AI →
              </button>
            ) : step !== "preview" ? (
              <button onClick={()=>setStep(STEPS[stepIdx+1])} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-black text-white transition">
                Next → {stepLabels[stepIdx+1]}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message Compose Modal ─────────────────────────────────────────────────────
function MessageModal({ fromUser, toId, toName, onClose, onSent }: {
  fromUser: C360User; toId: string; toName: string; onClose: ()=>void; onSent: ()=>void;
}) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await pushMessage({ toId, toName, content: text.trim() });
      bumpActivity(fromUser.id, "mentorsContacted");
      setDone(true); onSent();
    } finally { setSending(false); }
  };
  if (done) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 text-center w-full max-w-sm shadow-2xl">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Check size={28} className="text-emerald-600"/></div>
        <h3 className="text-lg font-black text-gray-900 mb-1">Message Sent!</h3>
        <p className="text-sm text-gray-500 mb-5">Your message to <span className="font-semibold text-gray-700">{toName}</span> is in your inbox.</p>
        <button onClick={onClose} className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition">Done</button>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${clr(toName)} border-2 border-white/30 flex items-center justify-center text-white font-black`}>{toName[0]}</div>
              <div>
                <p className="text-sm font-black text-white">{toName}</p>
                <p className="text-xs text-violet-200">Industry Mentor</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"><X size={15} className="text-white"/></button>
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3">Your message will appear in both your inbox and the mentor&apos;s dashboard.</p>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder={`Hi ${toName.split(" ")[0]}, I found your profile on College360 and would love to connect for a mentorship session...`}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400 resize-none h-28"/>
          <div className="flex gap-2 mt-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={send} disabled={!text.trim()} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 flex items-center justify-center gap-2">
              <Send size={14}/>Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inbox Section ─────────────────────────────────────────────────────────────
function InboxSection({ user, onNeedAuth, onRefreshUnread }: {
  user: C360User|null; onNeedAuth: ()=>void; onRefreshUnread: ()=>void;
}) {
  const [msgs, setMsgs] = useState<C360Message[]>([]);
  const [activeId, setActiveId] = useState<string|null>(null);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const all = await loadMessages();
    setMsgs(all.filter(m => m.fromId === user.id || m.toId === user.id));
    onRefreshUnread();
  };

  useEffect(() => { refresh(); }, [user]);

  useEffect(() => {
    if (user && activeId) {
      markThreadRead(user.id, activeId).then(() => { refresh(); });
    }
  }, [activeId]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4"><MessageCircle size={28} className="text-violet-600"/></div>
      <h3 className="text-base font-black text-gray-900 mb-1">Sign in to view messages</h3>
      <p className="text-sm text-gray-500 mb-5">Connect with mentors and track conversations</p>
      <button onClick={onNeedAuth} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition">Sign In</button>
    </div>
  );

  const partners = new Map<string, { id:string; name:string; messages:C360Message[]; unread:number }>();
  msgs.forEach(m => {
    const pid = m.fromId === user.id ? m.toId : m.fromId;
    const pname = m.fromId === user.id ? m.toName : m.fromName;
    if (!partners.has(pid)) partners.set(pid, { id:pid, name:pname, messages:[], unread:0 });
    const p = partners.get(pid)!;
    p.messages.push(m);
    if (!m.read && m.toId === user.id) p.unread++;
  });
  const list = Array.from(partners.values()).sort((a,b) => {
    const al = a.messages[a.messages.length-1]?.ts||"", bl = b.messages[b.messages.length-1]?.ts||"";
    return bl.localeCompare(al);
  });
  const thread = activeId ? partners.get(activeId) : null;
  const threadMsgs = thread ? [...thread.messages].sort((a,b)=>a.ts.localeCompare(b.ts)) : [];

  const sendReply = async () => {
    if (!reply.trim() || !thread || sendingReply) return;
    setSendingReply(true);
    try {
      await pushMessage({ toId: thread.id, toName: thread.name, content: reply.trim() });
      setReply(""); await refresh();
    } finally { setSendingReply(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-gray-900">Messages</h2>
        <span className="text-xs text-gray-400">{list.reduce((a,p)=>a+p.unread,0)} unread · {msgs.length} total</span>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3"><MessageCircle size={24} className="text-gray-400"/></div>
          <p className="text-sm font-semibold text-gray-600 mb-1">No messages yet</p>
          <p className="text-xs text-gray-400">Start by messaging a mentor from the Industry Mentors tab</p>
        </div>
      ) : (
        <div className="flex gap-4" style={{height:"calc(100vh - 220px)", minHeight:"420px"}}>
          <div className={`${activeId?"hidden lg:flex":"flex"} flex-col w-full lg:w-72 shrink-0 border border-gray-200 rounded-2xl overflow-hidden bg-white`}>
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Conversations</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {list.map(p => (
                <button key={p.id} onClick={()=>setActiveId(p.id)}
                  className={`w-full flex items-center gap-3 p-3.5 text-left border-b border-gray-100 hover:bg-gray-50 transition ${activeId===p.id?"bg-violet-50 border-l-[3px] border-l-violet-500":""}`}>
                  <div className={`w-10 h-10 rounded-xl ${clr(p.name)} flex items-center justify-center text-white font-black shrink-0 text-sm`}>{p.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.unread>0 && <span className="bg-violet-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-1 shrink-0">{p.unread}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{p.messages[p.messages.length-1]?.content}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white">
            {thread ? (<>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50">
                <button onClick={()=>setActiveId(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/60 transition">
                  <ChevronRight size={16} className="rotate-180 text-gray-600"/>
                </button>
                <div className={`w-9 h-9 rounded-xl ${clr(thread.name)} flex items-center justify-center text-white font-black text-sm`}>{thread.name[0]}</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{thread.name}</p>
                  <p className="text-xs text-gray-500">Industry Mentor</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {threadMsgs.map(m => (
                  <div key={m.id} className={`flex ${m.fromId===user.id?"justify-end":"justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.fromId===user.id?"bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm":"bg-white border border-gray-200 text-gray-900 rounded-bl-sm"}`}>
                      <p className="leading-relaxed">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.fromId===user.id?"text-violet-200":"text-gray-400"}`}>
                        {new Date(m.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2 bg-white">
                <input value={reply} onChange={e=>setReply(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendReply())}
                  placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-gray-50"/>
                <button onClick={sendReply} disabled={!reply.trim()} className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-white transition disabled:opacity-40">
                  <Send size={15}/>
                </button>
              </div>
            </>) : (
              <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-gray-400">
                <MessageCircle size={32} className="mb-2"/>
                <p className="text-sm">Select a conversation to open</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Student Dashboard Tab ─────────────────────────────────────────────────────
function StudentDashboardTab({ user, allMentors, opportunities, onTab, onNeedAuth, onNeedPremium, onInvite, onInterviewQ, onMessage }: {
  user: C360User|null; allMentors: Mentor[]; opportunities: Opportunity[];
  onTab: (t: StudentTab)=>void; onNeedAuth: ()=>void; onNeedPremium: ()=>void;
  onInvite: ()=>void; onInterviewQ: ()=>void; onMessage: (id:string, name:string)=>void;
}) {
  const act = user ? loadActivity(user.id) : { applications:0, mentorsContacted:0 };
  const inviteLog = user ? loadInvites(user.id) : { total:0, events:[] };
  const [msgs, setMsgs] = useState<C360Message[]>([]);
  useEffect(() => { if (user) { loadMessages().then(all => setMsgs(all.filter(m=>m.fromId===user.id||m.toId===user.id))); } }, [user]);
  const msgCount = msgs.length;
  const unread = user ? countUnread(msgs, user.id) : 0;

  const stats = [
    { label:"Applications Sent",  value:act.applications,        icon:<Briefcase size={17}/>,     color:"from-violet-500 to-indigo-600",  bg:"bg-violet-50", tc:"text-violet-600" },
    { label:"Messages",           value:msgCount,                 icon:<MessageCircle size={17}/>, color:"from-blue-500 to-cyan-600",       bg:"bg-blue-50",   tc:"text-blue-600",   badge:unread },
    { label:"Mentors Contacted",  value:act.mentorsContacted,     icon:<Brain size={17}/>,         color:"from-teal-500 to-emerald-600",    bg:"bg-teal-50",   tc:"text-teal-600" },
    { label:"Friends Invited",    value:inviteLog.total,          icon:<Users size={17}/>,         color:"from-amber-500 to-orange-600",    bg:"bg-amber-50",  tc:"text-amber-600" },
  ];


  const topOpps  = opportunities.filter(o=>!o.is_premium_only).slice(0,3);
  const topMents = allMentors.slice(0,3);

  return (
    <div className="space-y-8 pb-4">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 rounded-2xl p-6 sm:p-8">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none"/>
        <div className="absolute -bottom-10 left-1/4 w-36 h-36 bg-white/5 rounded-full pointer-events-none"/>
        <div className="relative flex items-start gap-4 justify-between">
          <div className="flex-1">
            {user ? (<>
              <p className="text-violet-300 text-xs font-bold uppercase tracking-wide mb-1">Welcome back</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{user.name.split(" ")[0]} 👋</h1>
              <p className="text-violet-200 text-sm">{user.college || "College360"} · {user.year || "Student"}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {!user.premium && (
                  <button onClick={onNeedPremium} className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-sm font-bold text-white transition">
                    <Sparkles size={14} className="text-yellow-300"/>Upgrade Premium — ₹500/yr
                  </button>
                )}
                {user.premium && <span className="flex items-center gap-1.5 text-yellow-300 text-sm font-bold"><Sparkles size={14}/>Premium Member</span>}
                <button onClick={()=>onTab("discover")} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold text-white transition">
                  <Briefcase size={14}/>Browse Opportunities
                </button>
              </div>
            </>) : (<>
              <h1 className="text-2xl font-black text-white mb-2">Your Career Dashboard</h1>
              <p className="text-violet-200 text-sm mb-5">Sign in to track progress, message mentors &amp; unlock your potential.</p>
              <button onClick={onNeedAuth} className="px-6 py-2.5 bg-white text-violet-700 rounded-xl font-black text-sm hover:bg-violet-50 transition shadow-lg">Get Started Free →</button>
            </>)}
          </div>
          {user && (
            <div className={`w-16 h-16 rounded-2xl ${clr(user.name)} flex items-center justify-center text-white text-2xl font-black border-2 border-white/30 shadow-lg shrink-0`}>{user.name[0]}</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-4 relative overflow-hidden`}>
            <div className="absolute top-2 right-2">
              {s.badge !== undefined && s.badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 animate-pulse">{s.badge}</span>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3 shadow-sm`}>{s.icon}</div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>


      {/* Featured Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Featured Opportunities</h2>
          <button onClick={()=>onTab("discover")} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">View all <ChevronRight size={13}/></button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {topOpps.map(o => (
            <div key={o.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-violet-200 hover:shadow-md transition">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${o.logo_color} flex items-center justify-center text-white font-black text-sm shrink-0`}>{o.company[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{o.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Building2 size={9}/>{o.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${TYPE_BADGE[o.type]||"bg-gray-100 text-gray-600"}`}>{o.type}</span>
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><MapPin size={8}/>{o.city}</span>
              </div>
              <p className="text-sm font-black text-emerald-600">{sal(o.stipend_min, o.stipend_max)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Mentors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Top Mentors</h2>
          <button onClick={()=>onTab("mentors")} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">View all <ChevronRight size={13}/></button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {topMents.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-violet-200 hover:shadow-md transition">
              <div className="flex gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${m.avatar_color} flex items-center justify-center text-white font-black shrink-0`}>{m.name[0]}</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.role}</p>
                  <p className="text-[10px] text-gray-400">{m.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Star size={10} className="text-yellow-400 fill-yellow-400"/>{m.rating} · {m.sessions} sessions
                </span>
                <button onClick={()=>{ if(user) onMessage(m.id, m.name); else onNeedAuth(); }}
                  className="ml-auto flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 transition">
                  <MessageCircle size={12}/>Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Search CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0"><Rocket size={24} className="text-white"/></div>
        <div className="flex-1">
          <p className="text-sm font-black text-white mb-0.5">Looking for jobs via AI?</p>
          <p className="text-xs text-indigo-200">Use Advance Search to aggregate live jobs from LinkedIn, Naukri &amp; more.</p>
        </div>
        <button onClick={()=>onTab("jobsearch")} className="shrink-0 px-4 py-2 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition">Search →</button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function College360Page() {
  const [user, setUser] = useState<C360User|null>(() => typeof window !== 'undefined' ? loadSess() : null);
  const [profile, setProfile] = useState<StudentProfile|null>(null);
  const [mode, setMode] = useState<Mode>("student");
  const [domain, setDomain] = useState("all");
  const [city, setCity] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [showInterviewQ, setShowInterviewQ] = useState(false);
  const [applyOpp, setApplyOpp] = useState<Opportunity|null>(null);
  const [communityMentors, setCommunityMentors] = useState<Mentor[]>([]);
  const [freeAI, setFreeAI] = useState(false);
  const [mounted, setMounted] = useState(false);
  // New feature state
  const [showChangePw, setShowChangePw] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showStudyPlanner, setShowStudyPlanner] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [showTechHelp, setShowTechHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTab>("dashboard");
  const [msgTo, setMsgTo] = useState<{id:string;name:string}|null>(null);
  const [inboxUnread, setInboxUnread] = useState(0);
  const refreshUnread = async () => {
    if (!user) { setInboxUnread(0); return; }
    const all = await loadMessages();
    setInboxUnread(countUnread(all, user.id));
  };
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const acctMenuRef = useRef<HTMLDivElement>(null);
  // Recruiter tabs
  const [recruiterTab, setRecruiterTab] = useState<"talent" | "sourcing">("talent");
  // Sourcing Controller state
  const [srcBaseUrl,    setSrcBaseUrl]    = useState(DEFAULT_SOURCING_URL);
  const [srcMode,       setSrcMode]       = useState<SourcingMode>("all");
  const [srcRole,       setSrcRole]       = useState("");
  const [srcLocation,   setSrcLocation]   = useState("India");
  const [srcSkills,     setSrcSkills]     = useState("");
  const [srcMax,        setSrcMax]        = useState(100);
  const [srcLoading,    setSrcLoading]    = useState(false);
  const [srcJobs,       setSrcJobs]       = useState<SourcingJob[]>([]);
  const [srcCandidates, setSrcCandidates] = useState<SourcingCandidate[]>([]);
  const [srcError,      setSrcError]      = useState("");
  const [srcDone,       setSrcDone]       = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = loadSess();
    if (u) {
      setUser(u);
      if (u.role === "recruiter") setMode("recruiter");
      c360Fetch("/profile").then(res => { if (res.success && res.data) setProfile(res.data); }).catch(()=>{});
    }
    setCommunityMentors(loadMentors());
    if (u) { loadMessages().then(all => setInboxUnread(countUnread(all, u.id))); }
    fetch("/v1/public/platform-config")
      .then(r => r.json())
      .then(d => { if (d?.data?.college360?.free_ai_enabled) setFreeAI(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (acctMenuRef.current && !acctMenuRef.current.contains(e.target as Node)) setShowAccountMenu(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const allMentors = [...MOCK_MENTORS, ...communityMentors];

  const login = (u: C360User) => {
    setUser(u);
    setShowAuth(false);
    if (u.role === "recruiter") setMode("recruiter");
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
  }).sort((a, b) => (b.is_i360 ? 1 : 0) - (a.is_i360 ? 1 : 0));

  if (!mounted) return null;

  const normalizeArray = (d: unknown): unknown[] => {
    if (Array.isArray(d)) return d;
    if (d && typeof d === "object") {
      for (const key of ["data","results","jobs","candidates","items","list","feed","records"]) {
        const v = (d as Record<string,unknown>)[key];
        if (Array.isArray(v)) return v;
      }
    }
    return [];
  };

  const triggerSourcing = async (modeOverride?: SourcingMode) => {
    const activeMode = modeOverride ?? srcMode;
    setSrcLoading(true); setSrcError(""); setSrcJobs([]); setSrcCandidates([]); setSrcDone(false);
    const base = srcBaseUrl.replace(/\/$/, "");
    const params = new URLSearchParams({
      role: srcRole, location: srcLocation, skills: srcSkills, max_results: String(srcMax),
    });
    const apiErrors: string[] = [];

    // 1 — fire source trigger via POST (backend fans out to portals)
    try {
      const sr = await fetch(`${base}/api/feed/source?${params}`, { method: "POST" });
      if (!sr.ok) apiErrors.push(`Source trigger: HTTP ${sr.status}`);
    } catch (e) {
      apiErrors.push(`Source trigger: ${e instanceof Error ? e.message : "network error"}`);
    }

    // 2 — fetch jobs
    let jobs: SourcingJob[] = [];
    if (activeMode === "jobs" || activeMode === "all") {
      try {
        const r = await fetch(`${base}/api/feed/jobs?sort_by=title&order=asc&category=all`);
        if (r.ok) jobs = normalizeArray(await r.json()) as SourcingJob[];
        else apiErrors.push(`Jobs API: HTTP ${r.status} — ${await r.text().catch(()=>"")}`);
      } catch (e) {
        apiErrors.push(`Jobs fetch: ${e instanceof Error ? e.message : "network/CORS error"}`);
      }
    }

    // 3 — fetch candidates
    let cands: SourcingCandidate[] = [];
    if (activeMode === "candidates" || activeMode === "all") {
      try {
        const r = await fetch(`${base}/api/feed/candidates?sort_by=name&order=asc&portal=all&category=all`);
        if (r.ok) cands = normalizeArray(await r.json()) as SourcingCandidate[];
        else apiErrors.push(`Candidates API: HTTP ${r.status} — ${await r.text().catch(()=>"")}`);
      } catch (e) {
        apiErrors.push(`Candidates fetch: ${e instanceof Error ? e.message : "network/CORS error"}`);
      }
    }

    setSrcJobs(jobs);
    setSrcCandidates(cands);
    setSrcDone(true);
    setSrcLoading(false);

    if (!jobs.length && !cands.length) {
      if (apiErrors.length) {
        setSrcError(
          `API call failed:\n${apiErrors.join("\n")}\n\n` +
          `Make sure your backend at "${base}" is running and returns CORS headers for this origin.`
        );
      } else {
        setSrcError(`No results from ${base} — API returned empty data. Verify the endpoint or relax filters.`);
      }
    } else if (apiErrors.length) {
      setSrcError(`Partial errors (some APIs failed):\n${apiErrors.join("\n")}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white"/>
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-gray-900">College<span className="text-violet-600">360</span></span>
              <span className="hidden sm:inline text-gray-600 text-xs ml-2">by 1360Labs</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/question-bank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-xs font-bold text-white transition shadow-sm"
            >
              <BookOpen size={13} /> Question Bank
            </Link>
            {user ? (
              <>
                <button onClick={()=>setShowInterviewQ(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 hover:bg-teal-200 border border-teal-200 rounded-lg text-xs font-semibold text-teal-600 transition">
                  <Brain size={13}/>Practice
                </button>
                <NotificationsPanel user={user}/>
                {!user.premium && <button onClick={()=>setShowPremium(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-lg text-xs font-bold text-white transition"><Sparkles size={12}/>Premium</button>}
                {/* Account menu */}
                <div ref={acctMenuRef} className="relative">
                  <button onClick={()=>setShowAccountMenu(v=>!v)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">
                    <div className={`w-5 h-5 rounded ${clr(user.name)} flex items-center justify-center text-white text-[10px] font-bold`}>{user.name[0]}</div>
                    <span className="text-gray-700 text-xs hidden sm:block">{user.name.split(" ")[0]}</span>
                    {user.premium && <Sparkles size={12} className="text-yellow-400"/>}
                    <ChevronDown size={12} className="text-gray-400"/>
                  </button>
                  {showAccountMenu && (
                    <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                      {[
                        { label:"View Profile",    icon:<Search size={13}/>,        action:()=>{ setShowProfileView(true); setShowAccountMenu(false); } },
                        { label:"Edit Profile",    icon:<Pencil size={13}/>,        action:()=>{ setShowProfile(true);     setShowAccountMenu(false); } },
                        { label:"Personal Info",   icon:<Users size={13}/>,         action:()=>{ setShowAccountSettings(true); setShowAccountMenu(false); } },
                        { label:"Change Password", icon:<Key size={13}/>,           action:()=>{ setShowChangePw(true);    setShowAccountMenu(false); } },
                        { label:"Invite Friends",  icon:<Share2 size={13}/>,        action:()=>{ setShowInvite(true);      setShowAccountMenu(false); } },
                        { label:"Study Planner",   icon:<Calendar size={13}/>,      action:()=>{ setShowStudyPlanner(true);setShowAccountMenu(false); } },
                        { label:"Outreach Agent",  icon:<Megaphone size={13}/>,     action:()=>{ setShowOutreach(true);    setShowAccountMenu(false); } },
                        { label:"Mock Interview",  icon:<Trophy size={13}/>,        action:()=>{ setShowMockInterview(true);setShowAccountMenu(false); } },
                        { label:"Technical Help",  icon:<Zap size={13}/>,           action:()=>{ setShowTechHelp(true);    setShowAccountMenu(false); }, premium:true },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition text-left">
                          <span className="text-gray-400">{item.icon}</span>{item.label}
                          {item.premium && <span className="ml-auto text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-bold">PRO</span>}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={()=>{ logout(); setShowAccountMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition">
                          <LogOut size={13}/>Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={()=>setShowAuth(true)} className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-lg text-sm font-semibold text-white transition">Get Started Free</button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero (logged-out only) ── */}
      {!user && <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 via-indigo-50/30 to-transparent"/>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-400/10 blur-[100px] rounded-full pointer-events-none"/>
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={13} className="text-violet-600"/>
            <span className="text-xs text-violet-700 font-semibold">AI-powered career launch for college students</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-2 leading-tight">
            Your Career,{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-transparent bg-clip-text">Launched Right.</span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-gray-500 tracking-tight mb-4">
            From Final Year to{" "}
            <span className="text-violet-600 font-bold">First Offer.</span>
          </p>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Find internships, campus placements, and mentors. Build an AI-powered profile. Learn in-demand skills.
            Everything a college student needs — in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            {user ? (
              <button onClick={()=>setShowProfile(true)} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition flex items-center gap-2 justify-center">
                <Brain size={16}/>{profile ? "View My Profile" : "Build My Profile"}
              </button>
            ) : (
              <button onClick={()=>setShowAuth(true)} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition flex items-center gap-2 justify-center">
                <Rocket size={16}/>Start Free — No credit card
              </button>
            )}
            <button onClick={()=>document.getElementById("opportunities")?.scrollIntoView({behavior:"smooth"})} className="px-8 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition flex items-center gap-2 justify-center">
              <Briefcase size={16}/>Browse Opportunities
            </button>
            <button onClick={()=>{ if(user) setShowInterviewQ(true); else setShowAuth(true); }} className="px-8 py-3 bg-teal-100 hover:bg-teal-100 border border-teal-200 rounded-xl text-sm font-semibold text-teal-600 transition flex items-center gap-2 justify-center">
              <Brain size={16}/>Practice Interview
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
              <div key={s.l} className="bg-gray-50 border border-gray-100 rounded-xl py-3 px-2">
                <p className="text-2xl font-black text-gray-900">{s.n}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ── MVP Free AI Banner ── */}
      {freeAI && !user?.premium && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2">
            <Sparkles size={13} className="text-emerald-600 shrink-0"/>
            <p className="text-xs text-emerald-800 font-semibold text-center">AI Profile Builder is <span className="font-black">free for everyone</span> during our MVP launch — try it now!</p>
            <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} className="shrink-0 ml-2 px-3 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-full text-[10px] font-bold text-emerald-700 transition">Try AI →</button>
          </div>
        </div>
      )}


      {/* ── App Layout: Left Sidebar + Main Content ── */}
      <div className="max-w-7xl mx-auto border-t border-gray-100">
        <div className="flex">

          {/* ── Left Sidebar (desktop, logged-in only) ── */}
          {user && <nav className="hidden lg:flex flex-col w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-gray-100 bg-white overflow-y-auto">

            <div className="p-4 space-y-0.5 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Navigation</p>

              {/* Student / Alumni nav */}
              {(user.role === "student" || user.role === "alumni") && (<>
                {([
                  ["dashboard", "Dashboard",         <Rocket size={14}/>],
                  ["discover",  "Opportunities",     <Briefcase size={14}/>],
                  ["work",      "Work Projects",     <FolderOpen size={14}/>],
                  ["mentors",   "Industry Mentors",  <Brain size={14}/>],
                  ["learning",  "Learning Tracks",   <BookOpen size={14}/>],
                  ["studyplan", "Study Plan",        <Calendar size={14}/>],
                  ["community", "Community",         <Users size={14}/>],
                  ["jobs",      "Job Board",         <Megaphone size={14}/>],
                  ["ideas",     "Idea Threads",      <Hash size={14}/>],
                  ["projects",  "My Projects",       <Layers size={14}/>],
                  ["books",     "Books",             <Newspaper size={14}/>],
                  ["jobsearch", "AI Job Search",     <Zap size={14}/>],
                  ["directory", "Directory",         <Globe size={14}/>],
                ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                  <button key={id} onClick={()=>setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab===id?"bg-violet-50 text-violet-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    {icon}<span className="flex-1 text-left">{label}</span>
                  </button>
                ))}
                <button onClick={()=>setActiveTab("inbox")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab==="inbox"?"bg-violet-50 text-violet-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Send size={14}/><span className="flex-1 text-left">Messages</span>
                  {inboxUnread > 0 && <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 shrink-0">{inboxUnread}</span>}
                </button>
                <button onClick={()=>setShowInterviewQ(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium text-teal-600 hover:bg-teal-50">
                  <Target size={14}/>Interview Prep
                </button>
                <button onClick={()=>setShowResumeBuilder(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium text-violet-600 hover:bg-violet-50">
                  <FileText size={14}/><span className="flex-1 text-left">AI Resume</span>
                  <span className="text-[9px] font-black bg-violet-100 text-violet-700 rounded-full px-1.5 py-0.5">₹500</span>
                </button>
              </>)}

              {/* Mentor / Expert nav */}
              {(user.role === "mentor" || user.role === "expert") && (<>
                {([
                  ["dashboard", "Dashboard",      <Rocket size={14}/>],
                  ["directory", "Directory",      <Globe size={14}/>],
                  ["work",      "Work Projects",  <FolderOpen size={14}/>],
                  ["jobs",      "Job Board",      <Megaphone size={14}/>],
                  ["community", "Community",      <Users size={14}/>],
                  ["ideas",     "Idea Threads",   <Hash size={14}/>],
                ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                  <button key={id} onClick={()=>setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab===id?"bg-amber-50 text-amber-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    {icon}<span className="flex-1 text-left">{label}</span>
                  </button>
                ))}
                <button onClick={()=>setActiveTab("inbox")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab==="inbox"?"bg-amber-50 text-amber-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Send size={14}/><span className="flex-1 text-left">Messages</span>
                  {inboxUnread > 0 && <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 shrink-0">{inboxUnread}</span>}
                </button>
              </>)}

              {/* Training Center nav */}
              {user.role === "training_center" && (<>
                {([
                  ["dashboard", "Dashboard",      <Rocket size={14}/>],
                  ["directory", "Directory",      <Globe size={14}/>],
                  ["work",      "Work Projects",  <FolderOpen size={14}/>],
                  ["jobs",      "Job Board",      <Megaphone size={14}/>],
                  ["community", "Community",      <Users size={14}/>],
                ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                  <button key={id} onClick={()=>setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab===id?"bg-teal-50 text-teal-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    {icon}<span className="flex-1 text-left">{label}</span>
                  </button>
                ))}
                <button onClick={()=>setActiveTab("inbox")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab==="inbox"?"bg-teal-50 text-teal-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Send size={14}/><span className="flex-1 text-left">Messages</span>
                  {inboxUnread > 0 && <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 shrink-0">{inboxUnread}</span>}
                </button>
              </>)}

              {/* College nav */}
              {user.role === "college" && (<>
                {([
                  ["dashboard", "Dashboard",      <Rocket size={14}/>],
                  ["directory", "Directory",      <Globe size={14}/>],
                  ["work",      "Work Projects",  <FolderOpen size={14}/>],
                  ["jobs",      "Job Board",      <Megaphone size={14}/>],
                  ["community", "Community",      <Users size={14}/>],
                ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                  <button key={id} onClick={()=>setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab===id?"bg-indigo-50 text-indigo-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    {icon}<span className="flex-1 text-left">{label}</span>
                  </button>
                ))}
                <button onClick={()=>setActiveTab("inbox")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${activeTab==="inbox"?"bg-indigo-50 text-indigo-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Send size={14}/><span className="flex-1 text-left">Messages</span>
                  {inboxUnread > 0 && <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 shrink-0">{inboxUnread}</span>}
                </button>
              </>)}

              {/* Recruiter nav (role=recruiter) */}
              {user.role === "recruiter" && ([
                ["talent",   "Talent Pool",    <Users size={14}/>],
                ["sourcing", "Advance Search", <Zap size={14}/>],
              ] as ["talent"|"sourcing", string, React.ReactNode][]).map(([id, label, icon]) => (
                <button key={id} onClick={()=>setRecruiterTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${recruiterTab===id?"bg-indigo-50 text-indigo-700 font-semibold":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  {icon}{label}
                </button>
              ))}
            </div>

            {user && !user.premium && (
              <div className="mt-auto p-4 border-t border-gray-100">
                <button onClick={()=>setShowPremium(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl text-xs font-bold text-white transition">
                  <Sparkles size={13}/>Upgrade Premium
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-1.5">₹500/year · All features</p>
              </div>
            )}
          </nav>}

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">

      {mode === "student" && (
        <div className="px-4 py-6 pb-24 lg:pb-6">
          <AdBanner page="college360"/>

          {/* Logged-out landing panel */}
          {!user && activeTab === "dashboard" && (
            <div className="max-w-2xl mx-auto text-center py-12 space-y-8">
              <C360AdSection placement="home"/>
              <div>
                <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 text-xs font-bold mb-4">
                  <Sparkles size={12}/>Platform for Final-Year Students
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3 leading-tight">Find Jobs, Mentors &amp; Build Your Career</h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Search 500+ opportunities, connect with industry mentors, and build an AI-powered resume — all in one place.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon:<Briefcase size={18} className="text-violet-600"/>, title:"500+ Opportunities", desc:"Jobs & internships from verified companies" },
                  { icon:<Brain size={18} className="text-indigo-600"/>, title:"Industry Mentors", desc:"Connect with professionals at Google, Microsoft &amp; more" },
                  { icon:<FileText size={18} className="text-teal-600"/>, title:"AI Resume Builder", desc:"ATS-optimized resume in minutes with AI" },
                  { icon:<Target size={18} className="text-orange-500"/>, title:"Interview Prep", desc:"Practice with role-specific questions" },
                ].map((f,i)=>(
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 hover:border-violet-200 hover:shadow-md transition">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">{f.icon}</div>
                    <div><p className="text-xs font-bold text-gray-900">{f.title}</p><p className="text-[11px] text-gray-500" dangerouslySetInnerHTML={{__html:f.desc}}/></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={()=>setShowAuth(true)} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl text-sm hover:opacity-90 transition">Sign Up Free →</button>
                <button onClick={()=>setActiveTab("discover")} className="px-6 py-3 border border-gray-200 bg-white text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition">Browse Opportunities</button>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                {[["500+","Opportunities"],["200+","Students Placed"],["50+","Mentors"]].map(([n,l])=>(
                  <div key={l}><p className="text-2xl font-black text-violet-700">{n}</p><p className="text-xs text-gray-500">{l}</p></div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "dashboard" && user && (
            <>
              {(user.role === "expert" || user.role === "training_center" || user.role === "college") && !user.premium && (
                <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                      <Globe size={18} className="text-indigo-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900">Complete your {user.role === "college" ? "college" : user.role === "training_center" ? "training center" : "expert"} profile</p>
                      <p className="text-xs text-indigo-600 mt-0.5">Use AI to auto-fill your profile from the web — appears in the Directory with i360 badge</p>
                    </div>
                  </div>
                  <button onClick={()=>setShowSetup(true)} className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition">
                    <Sparkles size={12}/>Setup Profile
                  </button>
                </div>
              )}
              <StudentDashboardTab
                user={user}
                allMentors={allMentors}
                opportunities={MOCK_OPPS}
                onTab={setActiveTab}
                onNeedAuth={()=>setShowAuth(true)}
                onNeedPremium={()=>setShowPremium(true)}
                onInvite={()=>setShowInvite(true)}
                onInterviewQ={()=>setShowInterviewQ(true)}
                onMessage={(id,name)=>setMsgTo({id,name})}
              />
            </>
          )}

          {activeTab === "inbox" && (
            <InboxSection user={user} onNeedAuth={()=>setShowAuth(true)} onRefreshUnread={refreshUnread}/>
          )}

          {activeTab === "discover" && <>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden" onClick={()=>setShowMobileFilters(false)}>
              <div className="absolute inset-0 bg-black/40"/>
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[75vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-900">Filter Opportunities</p>
                  <button onClick={()=>setShowMobileFilters(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                </div>
                <div className="mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {[["all","All Types"],["internship","Internship"],["placement","Placement"],["job","Job"],["freelance","Freelance"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setTypeFilter(v)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${typeFilter===v?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600"}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">City</p>
                  <div className="flex flex-wrap gap-2">
                    {CITIES.map(c=>(
                      <button key={c} onClick={()=>setCity(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${city===c?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600"}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <button onClick={()=>setShowMobileFilters(false)} className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold">
                  Show {filteredOpps.length} Results
                </button>
              </div>
            </div>
          )}

          <div id="opportunities" className="flex gap-6">
            {/* Desktop sidebar filters */}
            <aside className="hidden lg:block w-52 shrink-0 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Type</p>
                {[["all","All Types"],["internship","Internship"],["placement","Placement"],["job","Job"],["freelance","Freelance"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setTypeFilter(v)} className={`block w-full text-left text-xs px-2 py-1.5 rounded-lg transition ${typeFilter===v?"bg-violet-100 text-violet-700":"text-gray-600 hover:text-gray-900"}`}>{l}</button>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">City</p>
                {CITIES.map(c=>(
                  <button key={c} onClick={()=>setCity(c)} className={`block w-full text-left text-xs px-2 py-1.5 rounded-lg transition ${city===c?"bg-violet-100 text-violet-700":"text-gray-600 hover:text-gray-900"}`}>{c}</button>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Search bar + filter button + profile CTA */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="Search opportunities, companies..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                {/* Mobile filter button */}
                <button onClick={()=>setShowMobileFilters(true)} className="lg:hidden shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-violet-300 transition">
                  <Layers size={14} className={(typeFilter!=="all"||city!=="All Cities")?"text-violet-600":"text-gray-400"}/>
                  <span className="text-xs">Filter{(typeFilter!=="all"||city!=="All Cities")?" ✓":""}</span>
                </button>
                {user && !profile && (
                  <button onClick={()=>setShowProfile(true)} className="hidden sm:flex shrink-0 items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 border border-violet-200 rounded-xl text-sm font-semibold text-violet-700 transition">
                    <Plus size={15}/>Build Profile
                  </button>
                )}
              </div>

              {/* Profile completion nudge (mobile) */}
              {user && !profile && (
                <button onClick={()=>setShowProfile(true)} className="sm:hidden w-full mb-3 flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl text-left">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0"><Plus size={14} className="text-violet-600"/></div>
                  <div>
                    <p className="text-xs font-bold text-violet-700">Build your profile to stand out</p>
                    <p className="text-[10px] text-violet-500">Recruiters see your profile when you apply</p>
                  </div>
                </button>
              )}

              {profile && (
                <div className="mb-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3 sm:p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${clr(profile.name)} flex items-center justify-center text-white font-black shrink-0 text-sm`}>{profile.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                    <p className="text-xs text-gray-600 truncate">{profile.headline || `${profile.college} · ${profile.year}`}</p>
                  </div>
                  <button onClick={()=>setShowProfile(true)} className="text-xs text-violet-600 hover:text-violet-700 shrink-0">Edit</button>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{filteredOpps.length} opportunities{domain!=="all"?` in ${DOMAINS.find(d=>d.id===domain)?.label}`:""}{city!=="All Cities"?` · ${city}`:""}{typeFilter!=="all"?` · ${typeFilter}`:""}</p>
                {(typeFilter!=="all"||city!=="All Cities") && (
                  <button onClick={()=>{setTypeFilter("all");setCity("All Cities");}} className="text-[10px] text-violet-600 hover:text-violet-800 font-semibold">Clear filters</button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {filteredOpps.map(o => <OppCard key={o.id} opp={o} onApply={setApplyOpp}/>)}
                {filteredOpps.length === 0 && (
                  <div className="col-span-2 text-center py-16 text-gray-400">
                    <Search size={40} className="mx-auto mb-3 opacity-30"/>
                    <p className="text-sm font-semibold">No opportunities found.</p>
                    <button onClick={()=>{setTypeFilter("all");setCity("All Cities");setSearch("");}} className="mt-2 text-xs text-violet-600 hover:underline">Clear all filters</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <button onClick={()=>setActiveTab("mentors")} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-violet-200 hover:bg-violet-50 transition text-left">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 shrink-0"><Brain size={18}/></div>
              <div>
                <p className="text-sm font-bold text-gray-900">Industry Mentors</p>
                <p className="text-xs text-gray-500">1-on-1 sessions · {allMentors.length} mentors</p>
              </div>
            </button>
            <button onClick={()=>setActiveTab("learning")} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-teal-200 hover:bg-teal-50 transition text-left">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 shrink-0"><BookOpen size={18}/></div>
              <div>
                <p className="text-sm font-bold text-gray-900">Learning Tracks</p>
                <p className="text-xs text-gray-500">Structured paths · {LEARN_TRACKS.length} tracks</p>
              </div>
            </button>
            {user && (
              <button onClick={()=>setShowInterviewQ(true)} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-emerald-200 hover:bg-emerald-50 transition text-left">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0"><Target size={18}/></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Interview Prep</p>
                  <p className="text-xs text-gray-500">AI-generated questions · Role-specific</p>
                </div>
              </button>
            )}
            <button onClick={()=>setActiveTab("studyplan")} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition text-left">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0"><Calendar size={18}/></div>
              <div>
                <p className="text-sm font-bold text-gray-900">Study Planner</p>
                <p className="text-xs text-gray-500">AI-powered schedule builder</p>
              </div>
            </button>
          </div>

          {/* ── Premium CTA Banner ── */}
          {!user?.premium && (
            <div className="mt-14 relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-white/10 blur-[60px] rounded-full pointer-events-none"/>
              <div className="relative">
                <Sparkles className="text-yellow-300 mx-auto mb-3" size={32}/>
                <h2 className="text-2xl font-black text-white mb-2">Unlock Your Full Potential</h2>
                <p className="text-violet-100 text-sm max-w-md mx-auto mb-6">Get AI resume building, premium internships, mentor sessions, and all learning tracks for just <span className="text-white font-bold">₹500/year</span> — less than a pizza.</p>
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {["AI Profile Builder","Premium Opportunities","1-on-1 Mentors","All Learning Tracks","Priority Visibility","ATS Resume"].map(f=>(
                    <span key={f} className="flex items-center gap-1 text-xs text-white bg-white/15 border border-white/20 rounded-full px-3 py-1"><CheckCircle size={11} className="text-violet-200"/>{f}</span>
                  ))}
                </div>
                <button onClick={()=>user?setShowPremium(true):setShowAuth(true)} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-bold text-white transition flex items-center gap-2 mx-auto">
                  <Sparkles size={16}/>Upgrade to Premium — ₹500/year
                </button>
              </div>
            </div>
          )}
          </>}

          {activeTab === "studyplan" && (
            <StudyPlanTab user={user} onOpenPlanner={()=>setShowStudyPlanner(true)}/>
          )}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <C360AdSection placement="projects"/>
              <ProjectsBoardSection user={user}/>
            </div>
          )}
          {activeTab === "work" && (
            <WorkProjectsSection user={user} onNeedAuth={()=>setShowAuth(true)}/>
          )}
          {activeTab === "community" && (
            <div className="space-y-4">
              <C360AdSection placement="community"/>
              <CommunitySection user={user} onEnquiry={()=>setShowEnquiry(true)} onOutreach={()=>setShowOutreach(true)} onMockInterview={()=>setShowMockInterview(true)}/>
            </div>
          )}
          {activeTab === "books" && (
            <BooksFeedSection user={user}/>
          )}
          {activeTab === "jobs" && (
            <JobBoardSection user={user}/>
          )}
          {activeTab === "ideas" && (
            <IdeaThreadsSection user={user}/>
          )}

          {/* ── AI Job Search tab (student) ── */}
          {activeTab === "jobsearch" && <AdvanceSearchPanel
            srcMode="jobs" setSrcMode={setSrcMode}
            srcRole={srcRole} setSrcRole={setSrcRole}
            srcLocation={srcLocation} setSrcLocation={setSrcLocation}
            srcSkills={srcSkills} setSrcSkills={setSrcSkills}
            srcMax={srcMax} setSrcMax={setSrcMax}
            srcBaseUrl={srcBaseUrl} setSrcBaseUrl={setSrcBaseUrl}
            srcLoading={srcLoading} srcError={srcError}
            srcDone={srcDone} srcJobs={srcJobs} srcCandidates={[]}
            onTrigger={triggerSourcing}
            jobsOnly={true}
          />}

          {/* ── Directory tab ── */}
          {activeTab === "directory" && <DirectoryTab user={user} onSetup={()=>setShowSetup(true)}/>}

          {/* ── Industry Mentors tab ── */}
          {activeTab === "mentors" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Industry Mentors</h2>
                  <p className="text-xs text-gray-500 mt-0.5">1-on-1 sessions with professionals from top companies</p>
                </div>
                <div className="flex items-center gap-2">
                  {!user?.premium && <button onClick={()=>setShowPremium(true)} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"><Lock size={11}/>Unlock all</button>}
                  <button onClick={()=>setShowMentorForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 border border-violet-200 rounded-lg text-xs font-semibold text-violet-700 transition"><Plus size={12}/>Become a Mentor</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {DOMAINS.map(d => (
                  <button key={d.id} onClick={()=>setDomain(d.id)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition border ${domain===d.id?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"}`}>{d.label}</button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMentors.filter(m => domain === "all" || m.domain === domain).map(mentor => (
                  <div key={mentor.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-violet-200 transition">
                    <div className="flex gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl ${mentor.avatar_color} flex items-center justify-center text-white font-black text-lg shrink-0`}>{mentor.name[0]}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-900">{mentor.name}</p>
                          {mentor.is_i360 && <I360Badge/>}
                        </div>
                        <p className="text-xs text-gray-600">{mentor.role} · {mentor.company}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={11} className="text-yellow-400 fill-yellow-400"/>
                          <span className="text-xs text-gray-600">{mentor.rating} · {mentor.sessions} sessions</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{mentor.bio}</p>
                    <div className="flex flex-wrap gap-1 mb-3">{mentor.skills.slice(0,3).map(s=><span key={s} className="text-[10px] bg-white border border-gray-200 text-gray-500 rounded px-1.5 py-0.5">{s}</span>)}</div>
                    {mentor.is_community && <span className="text-[10px] text-violet-700 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 mb-2 inline-block">Community Expert</span>}
                    <div className="flex gap-2">
                      <button onClick={()=>{ if(user) setMsgTo({id:mentor.id, name:mentor.name}); else setShowAuth(true); }}
                        className="flex-1 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-xs text-violet-700 font-semibold flex items-center justify-center gap-1 transition">
                        <MessageCircle size={11}/>Message
                      </button>
                      {mentor.is_premium && !user?.premium ? (
                        <button onClick={()=>setShowPremium(true)} className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs text-amber-700 font-semibold flex items-center justify-center gap-1 transition"><Lock size={11}/>Premium</button>
                      ) : mentor.wa_number ? (
                        <a href={user ? `https://wa.me/${mentor.wa_number}?text=Hi+${encodeURIComponent(mentor.name)}!+I+found+you+on+College360.+I+am+a+${encodeURIComponent(user?.college||"college")}+student.` : "#"}
                           onClick={!user ? ()=>setShowAuth(true) : undefined}
                           target="_blank" rel="noopener noreferrer"
                           className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-600 font-semibold text-center flex items-center justify-center gap-1 transition">
                          <Phone size={11}/>WhatsApp
                        </a>
                      ) : mentor.email ? (
                        <a href={user ? `mailto:${mentor.email}?subject=Mentorship via College360` : "#"}
                           onClick={!user ? ()=>setShowAuth(true) : undefined}
                           className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs text-indigo-700 font-semibold text-center flex items-center justify-center gap-1 transition">
                          <Mail size={11}/>Email
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
                {allMentors.filter(m => domain === "all" || m.domain === domain).length === 0 && (
                  <div className="col-span-3 text-center py-16 text-gray-500">
                    <Brain size={40} className="mx-auto mb-3 opacity-30"/>
                    <p className="text-sm">No mentors in this domain yet.</p>
                    <button onClick={()=>setShowMentorForm(true)} className="mt-3 text-xs text-violet-600 hover:underline">Become the first mentor →</button>
                  </div>
                )}
              </div>
              {!user?.premium && (
                <div className="mt-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-center">
                  <Brain className="text-white/80 mx-auto mb-2" size={28}/>
                  <h3 className="text-lg font-black text-white mb-1">Unlock Premium Mentors</h3>
                  <p className="text-violet-100 text-xs mb-4">Get direct access to senior professionals at Google, Flipkart, Microsoft &amp; more for just <span className="text-white font-bold">₹500/year</span>.</p>
                  <button onClick={()=>user?setShowPremium(true):setShowAuth(true)} className="px-6 py-2.5 bg-white text-violet-700 rounded-xl font-bold text-sm hover:bg-violet-50 transition">Upgrade to Premium</button>
                </div>
              )}
            </div>
          )}

          {/* ── Learning Tracks tab ── */}
          {activeTab === "learning" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Learning Tracks</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Structured paths to job-ready skills</p>
                </div>
                {!user?.premium && <button onClick={()=>setShowPremium(true)} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"><Sparkles size={11}/>Premium unlocks all</button>}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {LEARN_TRACKS.map(track => (
                  <div key={track.id} className={`border rounded-xl p-4 transition ${track.is_premium && !user?.premium ? "border-gray-100 opacity-70" : "border-gray-200 hover:border-violet-200"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 ${track.bg} rounded-xl flex items-center justify-center ${track.color}`}>{track.icon}</div>
                      <div className="flex items-center gap-1">
                        {track.is_premium ? (
                          user?.premium ? <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 flex items-center gap-1"><Sparkles size={9}/>PRO</span>
                          : <button onClick={()=>setShowPremium(true)} className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 flex items-center gap-1 hover:bg-yellow-200 transition"><Lock size={9}/>PRO</button>
                        ) : <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">FREE</span>}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{track.title}</p>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{track.desc}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><BookOpen size={11}/>{track.modules} modules</span>
                      <span className="flex items-center gap-1"><Clock size={11}/>{track.hours}h</span>
                      <span>{track.level}</span>
                    </div>
                    <button
                      onClick={()=>track.is_premium && !user?.premium ? setShowPremium(true) : undefined}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold transition ${track.is_premium && !user?.premium ? "bg-gray-50 border border-gray-200 text-gray-400" : "bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700"}`}>
                      {track.is_premium && !user?.premium ? "Upgrade to Start" : "Start Track →"}
                    </button>
                  </div>
                ))}
              </div>
              {!user?.premium && (
                <div className="mt-10 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-center">
                  <BookOpen className="text-white/80 mx-auto mb-2" size={28}/>
                  <h3 className="text-lg font-black text-white mb-1">Unlock All Learning Tracks</h3>
                  <p className="text-teal-100 text-xs mb-4">Get full access to all {LEARN_TRACKS.length} structured learning paths for just <span className="text-white font-bold">₹500/year</span>.</p>
                  <button onClick={()=>user?setShowPremium(true):setShowAuth(true)} className="px-6 py-2.5 bg-white text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-50 transition">Upgrade to Premium</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Recruiter View ── */}
      {mode === "recruiter" && (
        <div className="px-4 py-6 pb-24 lg:pb-6">

          {/* ── Recruiter Dashboard ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-800 rounded-2xl p-6 mb-6">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none"/>
            <div className="relative flex items-start justify-between">
              <div>
                {user ? (<>
                  <p className="text-blue-300 text-xs font-bold uppercase tracking-wide mb-1">Recruiter Dashboard</p>
                  <h2 className="text-2xl font-black text-white mb-0.5">{user.name.split(" ")[0]} 👋</h2>
                  <p className="text-blue-200 text-sm mb-4">{user.college || "Your Company"}</p>
                  <div className="flex gap-3">
                    <button onClick={()=>setRecruiterTab("sourcing")} className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-sm font-bold text-white transition">
                      <Zap size={14}/>Source Talent
                    </button>
                    <button onClick={()=>setShowOutreach(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-sm font-semibold text-white transition">
                      <Megaphone size={14}/>Outreach Agent
                    </button>
                  </div>
                </>) : (<>
                  <h2 className="text-2xl font-black text-white mb-2">Hire Top College Talent</h2>
                  <p className="text-blue-200 text-sm mb-4">Access 2,400+ verified students from top colleges. Source, screen &amp; hire faster.</p>
                  <button onClick={()=>setShowAuth(true)} className="px-6 py-2.5 bg-white text-indigo-700 rounded-xl font-black text-sm hover:bg-indigo-50 transition shadow-lg">Get Started Free →</button>
                </>)}
              </div>
              <div className="hidden sm:grid grid-cols-2 gap-2 shrink-0">
                {[{n:"2,400+",l:"Students"},{n:"180+",l:"Companies"},{n:"850+",l:"Placements"},{n:"48h",l:"Avg. Fill Time"}].map(s=>(
                  <div key={s.l} className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-center">
                    <p className="text-lg font-black text-white">{s.n}</p>
                    <p className="text-[10px] text-blue-200">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Talent Pool tab ── */}
          {recruiterTab === "talent" && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500" placeholder="Search students by skill, college, domain..."/>
                </div>
                <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition">
                  <Plus size={15}/>Post Opportunity
                </button>
              </div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Available Talent</h2>
                <p className="text-xs text-gray-500">Verified college students actively seeking opportunities</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_STUDENTS.map(st => (
                  <div key={st.id} className="bg-gray-50 border border-gray-200 hover:border-indigo-300 rounded-xl p-4 transition">
                    <div className="flex gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl ${st.color} flex items-center justify-center text-white font-black text-lg shrink-0`}>{st.name[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{st.name}</p>
                        <p className="text-xs text-gray-600">{st.college}</p>
                        <p className="text-xs text-gray-500">{st.year} · CGPA {st.cgpa}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">{st.skills.map(s=><span key={s} className="text-[10px] bg-gray-50 text-gray-600 rounded px-1.5 py-0.5">{s}</span>)}</div>
                    <div className="flex flex-wrap gap-1 mb-3">{st.seeking.map(s=><span key={s} className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5">{s}</span>)}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`flex items-center gap-1 ${st.available?"text-emerald-600":"text-gray-500"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${st.available?"bg-emerald-500":"bg-gray-400"}`}/>
                        {st.available ? "Available" : "Placed"}
                      </span>
                      <button onClick={()=>user?window.open(`mailto:?subject=Opportunity from College360 for ${encodeURIComponent(st.name)}`):setShowAuth(true)} className="text-indigo-600 hover:text-indigo-700 font-semibold transition">Contact</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                <Building2 className="text-indigo-600 mx-auto mb-3" size={28}/>
                <h3 className="text-gray-900 font-bold mb-1">Post Your Campus Drive or Internship</h3>
                <p className="text-gray-600 text-sm mb-4">Reach 2,400+ verified college students. Free for the first posting.</p>
                <a href={`mailto:college360@nexusos.in?subject=Post%20Opportunity%20on%20College360&body=Company%20Name:%0AOpportunity%20Title:%0AType%20(internship/placement/job):%0AStipend/CTC:%0ALocation:%0ARequired%20Skills:%0ADeadline:%0A%0AContact%20Person:%0APhone:%0A`} className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition">
                  <Mail size={15}/>Email Us to Post
                </a>
              </div>
            </>
          )}

          {/* ── Advance Search tab ── */}
          {recruiterTab === "sourcing" && <AdvanceSearchPanel
            srcMode={srcMode} setSrcMode={setSrcMode}
            srcRole={srcRole} setSrcRole={setSrcRole}
            srcLocation={srcLocation} setSrcLocation={setSrcLocation}
            srcSkills={srcSkills} setSrcSkills={setSrcSkills}
            srcMax={srcMax} setSrcMax={setSrcMax}
            srcBaseUrl={srcBaseUrl} setSrcBaseUrl={setSrcBaseUrl}
            srcLoading={srcLoading} srcError={srcError}
            srcDone={srcDone} srcJobs={srcJobs} srcCandidates={srcCandidates}
            onTrigger={triggerSourcing}
          />}
        </div>
      )}

          </div>{/* end flex-1 main content */}
        </div>{/* end flex row */}
      </div>{/* end max-w-7xl layout */}

      {/* ── Mobile Bottom Nav ── */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40">
          <div className="flex items-stretch justify-around h-16 px-1 max-w-sm mx-auto">

            {/* Student / Alumni mobile nav */}
            {(user.role === "student" || user.role === "alumni") && (<>
              {([
                ["dashboard", "Home",      <Rocket size={19}/>],
                ["discover",  "Jobs",      <Briefcase size={19}/>],
                ["mentors",   "Mentors",   <Brain size={19}/>],
                ["community", "People",    <Users size={19}/>],
                ["directory", "Directory", <Globe size={19}/>],
              ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                <button key={id} onClick={()=>setActiveTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition ${activeTab===id?"text-violet-600":"text-gray-400"}`}>
                  {icon}<span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={()=>setActiveTab("inbox")}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition relative ${activeTab==="inbox"?"text-violet-600":"text-gray-400"}`}>
                <Send size={19}/>
                {inboxUnread > 0 && <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">{inboxUnread}</span>}
                <span className="text-[9px] font-bold">Inbox</span>
              </button>
            </>)}

            {/* Mentor / Expert mobile nav */}
            {(user.role === "mentor" || user.role === "expert") && (<>
              {([
                ["dashboard", "Home",      <Rocket size={19}/>],
                ["directory", "Directory", <Globe size={19}/>],
                ["work",      "Projects",  <FolderOpen size={19}/>],
                ["jobs",      "Jobs",      <Megaphone size={19}/>],
                ["community", "People",    <Users size={19}/>],
              ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                <button key={id} onClick={()=>setActiveTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition ${activeTab===id?"text-amber-600":"text-gray-400"}`}>
                  {icon}<span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={()=>setActiveTab("inbox")}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition relative ${activeTab==="inbox"?"text-amber-600":"text-gray-400"}`}>
                <Send size={19}/>
                {inboxUnread > 0 && <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">{inboxUnread}</span>}
                <span className="text-[9px] font-bold">Inbox</span>
              </button>
            </>)}

            {/* Training Center mobile nav */}
            {user.role === "training_center" && (<>
              {([
                ["dashboard", "Home",      <Rocket size={19}/>],
                ["directory", "Directory", <Globe size={19}/>],
                ["work",      "Projects",  <FolderOpen size={19}/>],
                ["jobs",      "Jobs",      <Megaphone size={19}/>],
                ["community", "People",    <Users size={19}/>],
              ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                <button key={id} onClick={()=>setActiveTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition ${activeTab===id?"text-teal-600":"text-gray-400"}`}>
                  {icon}<span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={()=>setActiveTab("inbox")}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition relative ${activeTab==="inbox"?"text-teal-600":"text-gray-400"}`}>
                <Send size={19}/>
                {inboxUnread > 0 && <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">{inboxUnread}</span>}
                <span className="text-[9px] font-bold">Inbox</span>
              </button>
            </>)}

            {/* College mobile nav */}
            {user.role === "college" && (<>
              {([
                ["dashboard", "Home",      <Rocket size={19}/>],
                ["directory", "Directory", <Globe size={19}/>],
                ["jobs",      "Jobs",      <Megaphone size={19}/>],
                ["community", "People",    <Users size={19}/>],
              ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
                <button key={id} onClick={()=>setActiveTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition ${activeTab===id?"text-indigo-600":"text-gray-400"}`}>
                  {icon}<span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={()=>setActiveTab("inbox")}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition relative ${activeTab==="inbox"?"text-indigo-600":"text-gray-400"}`}>
                <Send size={19}/>
                {inboxUnread > 0 && <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">{inboxUnread}</span>}
                <span className="text-[9px] font-bold">Inbox</span>
              </button>
            </>)}

            {/* Recruiter mobile nav */}
            {user.role === "recruiter" && (<>
              {([
                ["talent",   "Talent",  <Users size={19}/>],
                ["sourcing", "Search",  <Zap size={19}/>],
              ] as ["talent"|"sourcing", string, React.ReactNode][]).map(([id, label, icon]) => (
                <button key={id} onClick={()=>setRecruiterTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition ${recruiterTab===id?"text-indigo-600":"text-gray-400"}`}>
                  {icon}<span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
            </>)}

          </div>
        </nav>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 mt-16 py-8 text-center">
        <p className="text-gray-600 text-xs">College360 by 1360Labs · <a href="mailto:college360@nexusos.in" className="text-violet-500 hover:underline">college360@nexusos.in</a></p>
      </footer>

      {/* ── Modals ── */}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={login}/>}
      {showPremium && <PremiumModal user={user} onClose={()=>setShowPremium(false)}/>}
      {showProfile && user && <ProfileBuilderModal user={user} freeAI={freeAI} onClose={()=>setShowProfile(false)} onSave={p=>{setProfile(p);setShowProfile(false);}}/>}
      {showProfileView && user && <ProfileViewModal user={user} onClose={()=>setShowProfileView(false)} onBuild={()=>{ setShowProfileView(false); setShowProfile(true); }}/>}
      {showMentorForm && <BecomeMentorModal user={user} onClose={()=>setShowMentorForm(false)} onSaved={m=>{setCommunityMentors(prev=>[...prev.filter(x=>x.id!==m.id),m]);}}/>}
      {msgTo && user && <MessageModal fromUser={user} toId={msgTo.id} toName={msgTo.name} onClose={()=>setMsgTo(null)} onSent={refreshUnread}/>}
      {applyOpp && <ApplyModal opp={applyOpp} user={user} onClose={()=>setApplyOpp(null)} onNeedAuth={()=>setShowAuth(true)} onNeedPremium={()=>setShowPremium(true)}/>}
      {showInterviewQ && user && <InterviewQModal user={user} onClose={()=>setShowInterviewQ(false)}/>}
      {showResumeBuilder && <ResumeBuilderModal user={user} onClose={()=>setShowResumeBuilder(false)}/>}
      {showChangePw && user && <ChangePasswordModal user={user} onClose={()=>setShowChangePw(false)}/>}
      {showAccountSettings && user && <AccountSettingsModal user={user} onClose={()=>setShowAccountSettings(false)} onUpdate={setUser}/>}
      {showInvite && user && <InviteFriendsModal user={user} onClose={()=>setShowInvite(false)}/>}
      {showStudyPlanner && user && <StudyPlannerModal user={user} onClose={()=>setShowStudyPlanner(false)}/>}
      {showEnquiry && user && <CollegeEnquiryModal user={user} onClose={()=>setShowEnquiry(false)}/>}
      {showOutreach && user && <OutreachAgentModal user={user} onClose={()=>setShowOutreach(false)}/>}
      {showSetup && user && <SetupProfileModal user={user} onClose={()=>setShowSetup(false)}/>}
      {showMockInterview && user && <MockInterviewModal user={user} onClose={()=>setShowMockInterview(false)} onNeedPremium={()=>setShowPremium(true)}/>}
      {showTechHelp && user && <TechnicalHelpModal user={user} onClose={()=>setShowTechHelp(false)} onNeedPremium={()=>setShowPremium(true)}/>}
    </div>
  );
}
