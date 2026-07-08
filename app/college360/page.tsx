"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, Briefcase, Building2, X, Send, Mail, Sparkles, Star,
  Plus, Loader2, Upload, FileText, LogOut, Lock,
  Code2, TestTube2, Database, Palette, Cloud,
  BookOpen, Zap, Award, MapPin, CheckCircle, AlertCircle,
  GraduationCap, Rocket, Brain, Clock, Target, Heart,
  Check, Pencil, ExternalLink, Phone, Globe,
  Bell, BellDot, MessageSquare, ChevronDown,
  Key, Users, Share2, Calendar, Trophy, Copy, MessageCircle,
  Bookmark, Layers, ChevronRight, FolderOpen, Link2, Megaphone,
  Hash, Newspaper, Settings, ArrowRight, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface C360User {
  id: string; name: string; email: string; phone: string;
  role: "student" | "recruiter" | "mentor"; college?: string; year?: string;
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
  linkedin?: string; email?: string; is_community?: boolean;
}
interface LearningTrack {
  id: string; title: string; domain: string; icon: React.ReactNode;
  modules: number; hours: number; level: string; desc: string;
  color: string; bg: string; is_premium: boolean;
}
type Mode = "student" | "recruiter";
type StudentTab = "discover" | "studyplan" | "projects" | "community" | "books";
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

// ── Auth (localStorage) ────────────────────────────────────────────────────────
const SK = "college360_session";
const UK = "college360_users";
const PK = (id: string) => `college360_profile_${id}`;
const RP = (id: string) => `college360_recruiter_${id}`;
const MK = "college360_mentors";
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
const clearSess = () => localStorage.removeItem(SK);

const allUsers = (): Array<C360User & { pw: string }> => {
  try { return JSON.parse(localStorage.getItem(UK) || "[]"); } catch { return []; }
};

const doRegister = (d: { name: string; email: string; phone: string; pw: string; role: "student"|"recruiter"|"mentor"; college?: string; year?: string }): C360User | string => {
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
const BSK = (id: string) => `c360_books_saved_${id}`;
const ICK = (id: string) => `c360_invite_count_${id}`;
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
  const [tab, setTab] = useState<"login"|"register">("register");
  const [role, setRole] = useState<"student"|"recruiter"|"mentor">("student");
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
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900">Join College360</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900"><X size={20}/></button>
        </div>
        <div className="flex bg-gray-50 rounded-lg p-1 mb-5">
          {(["register","login"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition ${tab===t?"bg-violet-600 text-gray-900":"text-gray-600"}`}>{t==="register"?"Create Account":"Sign In"}</button>
          ))}
        </div>
        {tab === "register" && (
          <div className="flex bg-gray-50 rounded-lg p-1 mb-4">
            {([["student","Student"],["recruiter","Recruiter"],["mentor","Expert/Mentor"]] as const).map(([r,l]) => (
              <button key={r} onClick={()=>setRole(r)} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${role===r?"bg-indigo-600 text-white":"text-gray-600"}`}>{l}</button>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {tab === "register" && <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="Full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>}
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
          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="Password" type="password" value={form.pw} onChange={e=>setForm(f=>({...f,pw:e.target.value}))}/>
        </div>
        {err && <p className="text-red-600 text-xs mt-2">{err}</p>}
        <button onClick={submit} className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition text-sm">
          {tab==="register"?"Create Free Account":"Sign In"}
        </button>
        <p className="text-xs text-gray-500 text-center mt-3">
          {tab==="register"?"Already have an account? ":"New here? "}
          <button onClick={()=>setTab(tab==="register"?"login":"register")} className="text-violet-600 hover:underline">{tab==="register"?"Sign in":"Create account"}</button>
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
      <div className="bg-white border border-violet-200 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={20}/>
            <h2 className="text-lg font-bold text-gray-900">Upgrade to Premium</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900"><X size={20}/></button>
        </div>
        <div className="bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200 rounded-xl p-4 mb-4">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-black text-gray-900">₹500</span>
            <span className="text-gray-600 text-sm mb-1">/year</span>
          </div>
          <p className="text-gray-600 text-xs">That's less than ₹42/month. Unlock your full potential.</p>
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
              <div className="text-violet-600 mt-0.5 shrink-0">{f.icon}</div>
              <div><p className="text-sm text-gray-900 font-medium">{f.label}</p><p className="text-xs text-gray-500">{f.sub}</p></div>
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
  const mailto = `mailto:${opp.email}?subject=Application: ${encodeURIComponent(opp.title)}&body=Hi,%0A%0AI am interested in the ${encodeURIComponent(opp.title)} role at ${encodeURIComponent(opp.company)}.%0A%0AName: ${encodeURIComponent(user.name)}%0APhone: ${encodeURIComponent(user.phone)}%0A%0APlease find my profile attached.%0A%0ARegards,%0A${encodeURIComponent(user.name)}`;
  const wa = `https://wa.me/${opp.wa_number}?text=Hi+${encodeURIComponent(opp.company)}+team!+I+am+applying+for+${encodeURIComponent(opp.title)}.+My+name+is+${encodeURIComponent(user.name)},+a+college360+member.+Could+you+share+next+steps?`;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between mb-4"><h3 className="text-gray-900 font-bold">Apply Now</h3><button onClick={onClose}><X size={18} className="text-gray-600"/></button></div>
        <p className="text-sm text-gray-600 mb-1 font-semibold text-gray-900">{opp.title}</p>
        <p className="text-xs text-gray-500 mb-4">{opp.company} · {opp.city}</p>
        <div className="space-y-3">
          <a href={mailto} className="flex items-center gap-3 w-full p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition">
            <Mail size={18} className="text-violet-600"/><div><p className="text-sm font-semibold text-gray-900">Apply via Email</p><p className="text-xs text-gray-500">Opens your email app</p></div>
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition">
            <Send size={18} className="text-emerald-600"/><div><p className="text-sm font-semibold text-gray-900">WhatsApp the Recruiter</p><p className="text-xs text-gray-500">Instant message</p></div>
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
    <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-violet-200 rounded-xl p-4 transition group cursor-pointer" onClick={()=>onApply(opp)}>
      <div className="flex gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${opp.logo_color} flex items-center justify-center text-white font-black text-sm shrink-0`}>{opp.company[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-600 transition leading-snug">{opp.title}</p>
            {opp.is_premium_only && <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 shrink-0 flex items-center gap-1"><Lock size={9}/>PRO</span>}
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{opp.company}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${TYPE_BADGE[opp.type]}`}>{opp.type}</span>
        <span className="text-[11px] bg-gray-50 text-gray-600 rounded px-2 py-0.5 flex items-center gap-1"><MapPin size={9}/>{opp.city}</span>
        {opp.duration && <span className="text-[11px] bg-gray-50 text-gray-600 rounded px-2 py-0.5 flex items-center gap-1"><Clock size={9}/>{opp.duration}</span>}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{opp.desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-600">{sal(opp.stipend_min, opp.stipend_max)}</span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {opp.is_verified && <CheckCircle size={12} className="text-teal-600"/>}
          <span>{opp.spots} spot{opp.spots!==1?"s":""}</span>
          <span>by {new Date(opp.apply_by).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">{opp.skills.slice(0,3).map(s=><span key={s} className="text-[10px] bg-gray-50 text-gray-500 rounded px-1.5 py-0.5">{s}</span>)}</div>
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
    student:   "from-violet-100 via-indigo-100 to-violet-50",
    recruiter: "from-blue-100 via-cyan-100 to-blue-50",
    mentor:    "from-amber-100 via-orange-100 to-amber-50",
  };
  const badges = {
    student:   "bg-violet-100 text-violet-700 border-violet-200",
    recruiter: "bg-blue-100 text-blue-700 border-blue-200",
    mentor:    "bg-amber-100 text-amber-700 border-amber-200",
  };
  const badgeLabel = { student:"Student", recruiter:"Recruiter", mentor:"Industry Mentor" }[role] || role;

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
            <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${badges[role as keyof typeof badges]||badges.student}`}>{badgeLabel}</span>
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
  const [err, setErr] = useState(""); const [ok, setOk] = useState(false);
  function submit() {
    setErr("");
    if (!cur || !next || !conf) { setErr("All fields are required."); return; }
    if (next.length < 6) { setErr("New password must be at least 6 characters."); return; }
    if (next !== conf) { setErr("Passwords do not match."); return; }
    try {
      const users: (C360User & { pw: string })[] = JSON.parse(localStorage.getItem(UK) || "[]");
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1 || users[idx].pw !== cur) { setErr("Current password is incorrect."); return; }
      users[idx].pw = next;
      localStorage.setItem(UK, JSON.stringify(users));
      setOk(true); setTimeout(onClose, 1500);
    } catch { setErr("Failed to update password."); }
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
            <button onClick={submit} className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition mt-1">Update Password</button>
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
  const [year, setYear] = useState(user.year || ""); const [err, setErr] = useState(""); const [ok, setOk] = useState(false);
  function save() {
    setErr(""); if (!name.trim() || !email.trim()) { setErr("Name and email are required."); return; }
    try {
      const users: (C360User & { pw: string })[] = JSON.parse(localStorage.getItem(UK) || "[]");
      const updated = { ...user, name: name.trim(), email: email.trim(), phone: phone.trim(), college: college.trim(), year: year.trim() };
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) { users[idx] = { ...users[idx], ...updated }; localStorage.setItem(UK, JSON.stringify(users)); }
      saveSess(updated); onUpdate(updated); setOk(true); setTimeout(onClose, 1200);
    } catch { setErr("Failed to save."); }
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
          <button onClick={save} className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold text-white transition">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Friends Modal ───────────────────────────────────────────────────────
function InviteFriendsModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const [copied, setCopied] = useState(false); const [emailTo, setEmailTo] = useState(""); const [emailSent, setEmailSent] = useState(false);
  const refLink = `https://dplan-ebon.vercel.app/college360?ref=${user.id}`;
  const inviteCount = (() => { try { return parseInt(localStorage.getItem(ICK(user.id)) || "0"); } catch { return 0; } })();
  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    try { localStorage.setItem(ICK(user.id), String(inviteCount + 1)); } catch {}
    pushNotif(user.id, { type:"info", title:"Invite link copied", body:"Share it with friends to earn credit when they join College360." });
  }
  function shareWhatsApp() {
    const msg = encodeURIComponent(`Hey! I've been using College360 — an AI-powered career platform for college students. Find internships, prep for interviews, connect with mentors. Join free: ${refLink}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }
  function sendEmail() {
    if (!emailTo.trim()) return;
    const s = encodeURIComponent("Join me on College360 — AI Career Platform for Students");
    const b = encodeURIComponent(`Hi!\n\nI've been using College360 — it's an AI-powered platform for college students to find internships, practice interviews with AI, and connect with industry mentors.\n\nJoin free using my link: ${refLink}\n\nSee you there!\n${user.name}`);
    window.open(`mailto:${emailTo}?subject=${s}&body=${b}`, "_blank");
    setEmailSent(true); setTimeout(() => { setEmailSent(false); setEmailTo(""); }, 2000);
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
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-teal-600">{inviteCount}</p>
            <p className="text-xs text-teal-700 mt-0.5">Friends invited so far</p>
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

// ── Study Planner Modal ────────────────────────────────────────────────────────
function StudyPlannerModal({ user, onClose }: { user: C360User; onClose: () => void }) {
  const [savedPlan, setSavedPlan] = useState<C360StudyPlan|null>(() => { try { const s=localStorage.getItem(SPK(user.id)); return s?JSON.parse(s):null; } catch { return null; } });
  const [goal, setGoal] = useState(""); const [tech, setTech] = useState(""); const [level, setLevel] = useState("beginner");
  const [hpw, setHpw] = useState("10"); const [weeks, setWeeks] = useState("4");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const [expandedWeek, setExpandedWeek] = useState<number|null>(0);
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
      setSavedPlan(plan); setExpandedWeek(0);
      pushNotif(user.id, { type:"action", title:"Study Plan Ready!", body:`Your ${weeks}-week ${tech} plan is saved.` });
    } catch (e: any) { setErr(e.message||"Failed to generate. Try again."); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Calendar size={15} className="text-teal-600"/>AI Study Planner</span>
          <div className="flex items-center gap-2">
            {savedPlan && <button onClick={()=>{localStorage.removeItem(SPK(user.id));setSavedPlan(null);}} className="text-xs text-red-400 hover:text-red-600">Reset Plan</button>}
            <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
          </div>
        </div>
        <div className="p-5">
          {!savedPlan ? (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3"><p className="text-xs text-teal-700">Tell the AI your goal and it creates a personalised week-by-week plan with daily topics and resources.</p></div>
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
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700 mb-2">Enhancement Roadmap</p>
                <div className="space-y-1.5">
                  {[["v1 — Now","AI-generated week-by-week plan with daily topics"],["v2 — Next","Progress tracking with checkboxes + streak counter"],["v3 — Premium","Adaptive plan that adjusts based on your pace"],["v4 — Future","Peer accountability groups + mentor check-ins"]].map(([ver,desc]) => (
                    <div key={ver} className="flex gap-2 text-xs"><span className="font-semibold text-teal-600 shrink-0 w-24">{ver}</span><span className="text-gray-500">{desc}</span></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
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
                    <div className="divide-y divide-gray-100">
                      {w.days.map(d => (
                        <div key={d.day} className="px-4 py-2.5 flex gap-3">
                          <span className="text-[10px] font-bold text-teal-600 w-8 shrink-0 pt-0.5">{d.day.slice(0,3).toUpperCase()}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900">{d.topic}</p>
                            <ul className="mt-1 space-y-0.5">{d.tasks.slice(0,3).map((t,i)=><li key={i} className="text-[11px] text-gray-500 flex gap-1"><span className="text-teal-400 shrink-0">·</span>{t}</li>)}</ul>
                            {d.resource && <p className="text-[10px] text-gray-400 mt-1 italic">{d.resource}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={()=>setSavedPlan(null)} className="w-full py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 font-semibold transition flex items-center justify-center gap-1">
                <RefreshCw size={13}/>Regenerate Plan
              </button>
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

// ── Mock Interview Modal ───────────────────────────────────────────────────────
function MockInterviewModal({ user, onClose, onNeedPremium }: { user: C360User; onClose: () => void; onNeedPremium: () => void }) {
  const PLANS = [
    { title:"1-Week Rapid Prep", daily:"2-3 hours", items:["Day 1-2: DSA fundamentals + data structures review","Day 3-4: System design basics + OOPs concepts","Day 5: 20 behavioural questions + STAR method","Day 6: Full timed mock (LeetCode Easy/Medium)","Day 7: Gap analysis + targeted revision"] },
    { title:"2-Week Solid Prep", daily:"1.5-2 hours", items:["Week 1: DSA (arrays, trees, graphs) + SQL + OOPS fundamentals","Week 2: System design patterns + 3 full mocks + resume polish"] },
    { title:"4-Week Full Prep", daily:"1-1.5 hours", items:["Week 1: CS fundamentals + DSA basics + problem patterns","Week 2: Advanced DSA + OOP design + SQL deep dive","Week 3: System design + company-specific past questions","Week 4: Mock sessions daily + offer negotiation prep"] },
  ];
  const [sel, setSel] = useState<number|null>(null);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Trophy size={15} className="text-teal-600"/>Mock Interview Plan</span>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Choose a preparation plan that fits your timeline. Tap to expand the day-by-day breakdown.</p>
          <div className="space-y-3">
            {PLANS.map((p,i)=>(
              <button key={i} onClick={()=>setSel(sel===i?null:i)} className={`w-full text-left border rounded-xl p-4 transition ${sel===i?"border-teal-300 bg-teal-50":"border-gray-200 bg-gray-50 hover:border-teal-200"}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-gray-900">{p.title}</p>
                  <span className="text-[10px] font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{p.daily}/day</span>
                </div>
                {sel===i ? (
                  <ul className="mt-2 space-y-1.5">
                    {p.items.map((item,j)=><li key={j} className="text-xs text-gray-600 flex gap-2"><CheckCircle size={11} className="text-teal-500 shrink-0 mt-0.5"/>{item}</li>)}
                  </ul>
                ) : <p className="text-xs text-gray-500 line-clamp-1">{p.items[0]}{p.items.length>1?" …":""}</p>}
              </button>
            ))}
          </div>
          <div className={`rounded-xl p-4 border ${user.premium?"bg-teal-50 border-teal-200":"bg-amber-50 border-amber-200"}`}>
            {user.premium ? (<>
              <p className="text-sm font-bold text-teal-800 mb-1">Book a 1-on-1 Mock Session</p>
              <p className="text-xs text-teal-600 mb-3">Premium members can book 45-minute mock interview sessions with industry mentors — recorded, with detailed feedback.</p>
              <a href="mailto:college360@nexusos.in?subject=Mock Interview Booking Request&body=Hi, I'd like to book a mock interview. My name is [Name], target role: [Role], preferred date: [Date]." className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-xs font-bold text-white transition"><Mail size={12}/>Book via Email</a>
            </>) : (<>
              <p className="text-sm font-bold text-amber-800 mb-1">Book 1-on-1 Mock Interview</p>
              <p className="text-xs text-amber-600 mb-3">Upgrade to Premium for live 45-minute mock sessions with industry experts — recorded, with personalised feedback report.</p>
              <button onClick={()=>{onClose();onNeedPremium();}} className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-xs font-bold text-white transition"><Sparkles size={12}/>Upgrade to Premium</button>
            </>)}
          </div>
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

// ── Books Feed Section ─────────────────────────────────────────────────────────
function BooksFeedSection({ user }: { user: C360User | null }) {
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState<string[]>(() => user ? loadSavedBooks(user.id) : []);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const domains = ["all","programming","ai","data","design","cloud","testing"];
  const filtered = C360_BOOKS.filter(b => (filter==="all"||b.domain===filter||b.domain==="all") && (!showSavedOnly||saved.includes(b.id)));
  function toggleSave(bookId: string) {
    if (!user) return;
    const next = saved.includes(bookId) ? saved.filter(id=>id!==bookId) : [...saved, bookId];
    setSaved(next);
    try { localStorage.setItem(BSK(user.id), JSON.stringify(next)); } catch {}
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Newspaper size={20} className="text-violet-600"/>Books & Resources</h2><p className="text-xs text-gray-500 mt-0.5">Curated reading list to accelerate your career</p></div>
        {user && <button onClick={()=>setShowSavedOnly(v=>!v)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${showSavedOnly?"bg-violet-100 border-violet-200 text-violet-700":"bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
          <Bookmark size={11} className="inline mr-1"/>{showSavedOnly?"All Books":"Saved Only"}
        </button>}
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {domains.map(d=>(
          <button key={d} onClick={()=>setFilter(d)} className={`shrink-0 capitalize px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filter===d?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>{d}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(b=>(
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
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-semibold transition">
                <ExternalLink size={11}/>View / Read
              </a>
            </div>
          </div>
        ))}
        {filtered.length===0 && <div className="col-span-3 text-center py-12 text-gray-400"><Bookmark size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No books in this category yet.</p></div>}
      </div>
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

// ── Community & Threads Section ────────────────────────────────────────────────
function CommunitySection({ user, onEnquiry, onOutreach, onMockInterview }: { user: C360User|null; onEnquiry: ()=>void; onOutreach: ()=>void; onMockInterview: ()=>void }) {
  const [threads, setThreads] = useState<C360Thread[]>(() => user ? loadThreads(user.id) : []);
  const STATUS_COLORS = { sent:"bg-blue-100 text-blue-700", replied:"bg-emerald-100 text-emerald-700", closed:"bg-gray-100 text-gray-500" };
  const TYPE_ICONS = { enquiry:<MessageCircle size={12}/>, outreach:<Megaphone size={12}/> };
  function closeThread(id: string) {
    if (!user) return;
    const next = threads.map(t=>t.id===id?{...t,status:"closed" as const}:t);
    setThreads(next); saveThreads(user.id, next);
  }
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-1 flex items-center gap-2"><MessageCircle size={20} className="text-violet-600"/>Community Hub</h2>
        <p className="text-xs text-gray-500 mb-4">Draft outreach, enquire to colleges, and track your communication threads</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label:"College Enquiry", desc:"AI drafts a professional enquiry email to any college's admissions team", icon:<MessageCircle size={20} className="text-teal-600"/>, color:"border-teal-200 bg-teal-50", action: onEnquiry, cta:"Start Enquiry" },
            { label:"Outreach Agent", desc:"AI writes recruiter outreach, mentor request, or collaboration messages", icon:<Megaphone size={20} className="text-indigo-600"/>, color:"border-indigo-200 bg-indigo-50", action: onOutreach, cta:"Draft Message" },
            { label:"Mock Interview Plan", desc:"Pick a 1/2/4-week prep plan and optionally book a 1-on-1 session", icon:<Trophy size={20} className="text-amber-600"/>, color:"border-amber-200 bg-amber-50", action: onMockInterview, cta:"View Plans" },
          ].map(c=>(
            <div key={c.label} className={`border rounded-xl p-4 ${c.color}`}>
              <div className="mb-3">{c.icon}</div>
              <p className="text-sm font-bold text-gray-900 mb-1">{c.label}</p>
              <p className="text-xs text-gray-600 mb-3">{c.desc}</p>
              <button onClick={user?c.action:()=>{}} className="text-xs font-semibold text-gray-700 flex items-center gap-1 hover:gap-2 transition-all">
                {c.cta}<ArrowRight size={11}/>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Hash size={14} className="text-gray-400"/>Threads</h3>
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

// ── Advertisement Banner ───────────────────────────────────────────────────────
function AdvertisementBanner() {
  const [visible, setVisible] = useState(true);
  const ad: { title:string; body:string; cta:string; ctaUrl:string; color:string } | null = (() => {
    try {
      if (!localStorage.getItem("c360_ads_enabled")) return null;
      const d = localStorage.getItem("c360_ad_data");
      return d ? JSON.parse(d) : null;
    } catch { return null; }
  })();
  if (!ad || !visible) return null;
  return (
    <div className={`relative rounded-xl border px-5 py-4 flex items-center gap-4 mb-6 ${ad.color||"bg-amber-50 border-amber-200"}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900">{ad.title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{ad.body}</p>
      </div>
      {ad.cta && ad.ctaUrl && <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-xs font-bold text-white transition">{ad.cta}</a>}
      <button onClick={()=>setVisible(false)} className="shrink-0 text-gray-400 hover:text-gray-600 transition"><X size={14}/></button>
      <span className="absolute top-1 right-8 text-[9px] text-gray-400 uppercase tracking-wider">Sponsored</span>
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
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [showTechHelp, setShowTechHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTab>("discover");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const acctMenuRef = useRef<HTMLDivElement>(null);

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
    setCommunityMentors(loadMentors());
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
              <span className="hidden sm:inline text-gray-600 text-xs ml-2">by NexusOS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 via-indigo-50/30 to-transparent"/>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-400/10 blur-[100px] rounded-full pointer-events-none"/>
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={13} className="text-violet-600"/>
            <span className="text-xs text-violet-700 font-semibold">AI-powered career launch for college students</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 leading-tight">
            Your Career,<br/>
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-transparent bg-clip-text">Launched Right.</span>
          </h1>
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
      </section>

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

      {/* ── Interest / Domain Picker ── */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {DOMAINS.map(d => (
              <button key={d.id} onClick={()=>setDomain(d.id)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition border ${domain===d.id?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"}`}>{d.label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mode Toggle ── */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 w-fit">
          <button onClick={()=>setMode("student")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${mode==="student"?"bg-violet-600 text-white":"text-gray-600 hover:text-gray-900"}`}><GraduationCap size={15}/>I am a Student</button>
          <button onClick={()=>setMode("recruiter")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${mode==="recruiter"?"bg-indigo-600 text-white":"text-gray-600 hover:text-gray-900"}`}><Building2 size={15}/>I am a Recruiter</button>
        </div>
      </div>

      {mode === "student" && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* ── Student Tab Bar ── */}
          <div className="flex gap-1 mb-6 bg-gray-100 border border-gray-200 rounded-xl p-1 overflow-x-auto scrollbar-hide">
            {([
              ["discover",  "Discover",    <Search size={13}/>],
              ["studyplan", "Study Plan",  <Calendar size={13}/>],
              ["projects",  "Projects",    <Layers size={13}/>],
              ["community", "Community",   <MessageCircle size={13}/>],
              ["books",     "Books",       <Newspaper size={13}/>],
            ] as [StudentTab, string, React.ReactNode][]).map(([id, label, icon]) => (
              <button key={id} onClick={()=>setActiveTab(id)} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab===id?"bg-white text-gray-900 shadow-sm border border-gray-200":"text-gray-500 hover:text-gray-700"}`}>
                {icon}{label}
              </button>
            ))}
          </div>
          <AdvertisementBanner/>

          {activeTab === "discover" && <>
          <div id="opportunities" className="flex gap-6">
            {/* Sidebar */}
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

            {/* Main */}
            <div className="flex-1 min-w-0">
              {/* Search + profile CTA */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500" placeholder="Search opportunities, companies..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                {user && !profile && (
                  <button onClick={()=>setShowProfile(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 border border-violet-200 rounded-xl text-sm font-semibold text-violet-700 transition">
                    <Plus size={15}/>Build Profile
                  </button>
                )}
              </div>

              {profile && (
                <div className="mb-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${clr(profile.name)} flex items-center justify-center text-white font-black shrink-0`}>{profile.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{profile.name}</p>
                    <p className="text-xs text-gray-600">{profile.headline || `${profile.college} · ${profile.year}`}</p>
                  </div>
                  <button onClick={()=>setShowProfile(true)} className="text-xs text-violet-600 hover:text-violet-700 shrink-0">Edit</button>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{filteredOpps.length} opportunities {domain!=="all"?`in ${DOMAINS.find(d=>d.id===domain)?.label}`:""}</p>
                <div className="flex lg:hidden gap-1">
                  {[["internship","Int."],["placement","Plmt"],["job","Job"],["freelance","Free"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setTypeFilter(typeFilter===v?"all":v)} className={`text-[10px] px-2 py-1 rounded ${typeFilter===v?"bg-violet-600 text-white":"bg-gray-50 text-gray-600"}`}>{l}</button>
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
                <h2 className="text-xl font-black text-gray-900">Industry Mentors</h2>
                <p className="text-xs text-gray-500 mt-0.5">1-on-1 sessions with professionals from top companies</p>
              </div>
              <div className="flex items-center gap-2">
                {!user?.premium && <button onClick={()=>setShowPremium(true)} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"><Lock size={11}/>Unlock all</button>}
                <button onClick={()=>setShowMentorForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 border border-violet-200 rounded-lg text-xs font-semibold text-violet-700 transition"><Plus size={12}/>Become a Mentor</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMentors.filter(m => domain === "all" || m.domain === domain).map(mentor => (
                <div key={mentor.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-violet-200 transition">
                  <div className="flex gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl ${mentor.avatar_color} flex items-center justify-center text-white font-black text-lg shrink-0`}>{mentor.name[0]}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{mentor.name}</p>
                      <p className="text-xs text-gray-600">{mentor.role} · {mentor.company}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={11} className="text-yellow-400 fill-yellow-400"/>
                        <span className="text-xs text-gray-600">{mentor.rating} · {mentor.sessions} sessions</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-3">{mentor.skills.slice(0,3).map(s=><span key={s} className="text-[10px] bg-gray-50 text-gray-500 rounded px-1.5 py-0.5">{s}</span>)}</div>
                  {mentor.is_community && <span className="text-[10px] text-violet-700 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 mb-2 inline-block">Community Expert</span>}
                  {mentor.is_premium && !user?.premium ? (
                    <button onClick={()=>setShowPremium(true)} className="w-full py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-xs text-violet-700 font-semibold flex items-center justify-center gap-1 transition"><Lock size={11}/>Book Session (Premium)</button>
                  ) : mentor.email && !mentor.wa_number ? (
                    <a href={user ? `mailto:${mentor.email}?subject=Mentorship Request via College360&body=Hi ${mentor.name},%0A%0AI found your profile on College360 and would love a mentorship session.%0A%0ARegards,%0A${user?.name || "Student"}` : "#"}
                       onClick={!user ? ()=>setShowAuth(true) : undefined}
                       className="block w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs text-indigo-700 font-semibold text-center transition">Connect via Email</a>
                  ) : (
                    <a href={user ? `https://wa.me/${mentor.wa_number}?text=Hi+${encodeURIComponent(mentor.name)}!+I+found+you+on+College360+and+would+love+a+mentorship+session.+I+am+a+${encodeURIComponent(user?.college||"college")}+student.` : "#"}
                       onClick={!user ? ()=>setShowAuth(true) : undefined}
                       target="_blank" rel="noopener noreferrer"
                       className="block w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-600 font-semibold text-center transition">Book via WhatsApp</a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Learning Tracks ── */}
          <div className="mt-14">
            <div className="flex items-center justify-between mb-4">
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
            <ProjectsBoardSection user={user}/>
          )}
          {activeTab === "community" && (
            <CommunitySection user={user} onEnquiry={()=>setShowEnquiry(true)} onOutreach={()=>setShowOutreach(true)} onMockInterview={()=>setShowMockInterview(true)}/>
          )}
          {activeTab === "books" && (
            <BooksFeedSection user={user}/>
          )}
        </div>
      )}

      {/* ── Recruiter View ── */}
      {mode === "recruiter" && (
        <div className="max-w-7xl mx-auto px-4 py-6">
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
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 mt-16 py-8 text-center">
        <p className="text-gray-600 text-xs">College360 by NexusOS · Built with Claude AI · <a href="mailto:college360@nexusos.in" className="text-violet-500 hover:underline">college360@nexusos.in</a></p>
      </footer>

      {/* ── Modals ── */}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={login}/>}
      {showPremium && <PremiumModal user={user} onClose={()=>setShowPremium(false)} onUpgrade={upgradeDone}/>}
      {showProfile && user && <ProfileBuilderModal user={user} freeAI={freeAI} onClose={()=>setShowProfile(false)} onSave={p=>{setProfile(p);setShowProfile(false);}}/>}
      {showProfileView && user && <ProfileViewModal user={user} onClose={()=>setShowProfileView(false)} onBuild={()=>{ setShowProfileView(false); setShowProfile(true); }}/>}
      {showMentorForm && <BecomeMentorModal user={user} onClose={()=>setShowMentorForm(false)} onSaved={m=>{setCommunityMentors(prev=>[...prev.filter(x=>x.id!==m.id),m]);}}/>}
      {applyOpp && <ApplyModal opp={applyOpp} user={user} onClose={()=>setApplyOpp(null)} onNeedAuth={()=>setShowAuth(true)} onNeedPremium={()=>setShowPremium(true)}/>}
      {showInterviewQ && user && <InterviewQModal user={user} onClose={()=>setShowInterviewQ(false)}/>}
      {showChangePw && user && <ChangePasswordModal user={user} onClose={()=>setShowChangePw(false)}/>}
      {showAccountSettings && user && <AccountSettingsModal user={user} onClose={()=>setShowAccountSettings(false)} onUpdate={setUser}/>}
      {showInvite && user && <InviteFriendsModal user={user} onClose={()=>setShowInvite(false)}/>}
      {showStudyPlanner && user && <StudyPlannerModal user={user} onClose={()=>setShowStudyPlanner(false)}/>}
      {showEnquiry && user && <CollegeEnquiryModal user={user} onClose={()=>setShowEnquiry(false)}/>}
      {showOutreach && user && <OutreachAgentModal user={user} onClose={()=>setShowOutreach(false)}/>}
      {showMockInterview && user && <MockInterviewModal user={user} onClose={()=>setShowMockInterview(false)} onNeedPremium={()=>setShowPremium(true)}/>}
      {showTechHelp && user && <TechnicalHelpModal user={user} onClose={()=>setShowTechHelp(false)} onNeedPremium={()=>setShowPremium(true)}/>}
    </div>
  );
}
