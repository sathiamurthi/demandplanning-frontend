"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import {
  Building2, User, ShoppingBag, Stethoscope, Wrench,
  Utensils, Store, CheckCircle2, ArrowRight, ArrowLeft,
  Eye, EyeOff, AlertCircle, Users, Package, Sparkles,
  UserCheck, Phone, Mail, Wheat, Car,
} from "lucide-react";

/* ── Types ── */
interface Industry { id: string; industry_id: string; display_name: string; }

/* ── Role options ── */
const ROLES = [
  {
    key: "owner",
    label: "Business Owner",
    description: "Create and manage your company account, stores, and team.",
    icon: Building2,
    badge: "Full access",
    badgeColor: "bg-gold-100 text-gold-700",
  },
  {
    key: "manager",
    label: "Store Manager",
    description: "Manage inventory, staff, and orders for a specific store.",
    icon: Store,
    badge: "Store-level",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    key: "staff",
    label: "Staff Member",
    description: "View and update inventory, process sales.",
    icon: Users,
    badge: "Limited",
    badgeColor: "bg-gray-100 text-gray-600",
  },
  {
    key: "guest",
    label: "Guest / Customer",
    description: "Browse products, place orders without full account.",
    icon: UserCheck,
    badge: "View only",
    badgeColor: "bg-purple-100 text-purple-700",
  },
];

/* ── Domain options (static fallback + dynamic) ── */
const DOMAIN_ICONS: Record<string, React.ElementType> = {
  pharma:    Stethoscope,
  medical:   Stethoscope,
  grocery:   ShoppingBag,
  restaurant:Utensils,
  retail:    Package,
  auto_parts:Car,
  auto:      Car,
  parts:     Wrench,
  tea:       Wheat,
  general:   Store,
};

const STATIC_INDUSTRIES = [
  { id: "grocery",   industry_id: "grocery",   display_name: "Grocery" },
  { id: "pharma",    industry_id: "pharma",     display_name: "Medical / Pharma" },
  { id: "auto",      industry_id: "auto",       display_name: "Auto Parts" },
  { id: "tea",       industry_id: "tea",        display_name: "Tea Agency" },
  { id: "retail",    industry_id: "retail",     display_name: "General Retail" },
  { id: "restaurant",industry_id: "restaurant", display_name: "Restaurant" },
];

/* ── Helper: step indicator ── */
function StepDot({ active, done, n }: { active: boolean; done: boolean; n: number }) {
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all
      ${done ? "bg-emerald-500 text-white" : active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : n}
    </div>
  );
}

type ContactType = "email" | "phone";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step,        setStep]        = useState(1); // 1=role, 2=industry(owner), 3=details
  const [role,        setRole]        = useState<string | null>(null);
  const [industries,  setIndustries]  = useState<Industry[]>(STATIC_INDUSTRIES);
  const [industryId,  setIndustryId]  = useState<string | null>(null);
  const [contactType, setContactType] = useState<ContactType>("email");
  const [form,        setForm]        = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", companyName: "",
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  const totalSteps = role === "owner" ? 3 : 2;

  useEffect(() => {
    const ind = searchParams.get("industry");
    if (ind) {
      setRole("owner");
      setIndustryId(ind);
      setStep(3);
    }
  }, [searchParams]);

  useEffect(() => {
    apiGet<{ success: boolean; data: Industry[] }>("/industries")
      .then(r => { if (r.data?.length) setIndustries(r.data); })
      .catch(() => {});
  }, []);

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = () => {
    if (step === 1 && !role) return;
    if (step === 2 && role === "owner" && !industryId) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName) { setError("First name is required"); return; }
    if (contactType === "email" && !form.email) { setError("Email is required"); return; }
    if (contactType === "phone" && !form.phone) { setError("Phone number is required"); return; }
    if (!form.password || form.password.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    setError(null);
    setLoading(true);
    try {
      const basePayload = {
        firstName:   form.firstName,
        lastName:    form.lastName,
        password:    form.password,
        ...(contactType === "email" ? { email: form.email } : { phone: form.phone }),
      };

      if (role === "owner") {
        await apiPost("/ext/tenant/register", {
          ...basePayload,
          companyName: form.companyName || `${form.firstName}'s Business`,
          industry_id: industryId,
          source: searchParams.get("source") || searchParams.get("industry") || "direct",
        });
      } else {
        await apiPost("/auth/register", { ...basePayload, role });
      }
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen bg-[#0F1729] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Account created!</h1>
              <p className="text-sm text-gray-500 mt-2">
                Welcome to DemandPlan. You can now sign in with your {contactType}.
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white
                         hover:bg-gray-800 transition-colors"
            >
              Continue to login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1729] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl
                           bg-gold-400 text-sm font-black text-gray-950">DP</span>
          <span className="text-xl font-bold text-white tracking-tight">DemandPlan</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Step header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <StepDot n={i+1} active={step === i+1} done={step > i+1} />
                  {i < totalSteps - 1 && (
                    <div className={`h-0.5 w-8 rounded-full transition-all ${step > i+1 ? "bg-emerald-400" : "bg-gray-100"}`} />
                  )}
                </div>
              ))}
              <span className="ml-2 text-xs text-gray-400">Step {step} of {totalSteps}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">
              {step === 1 ? "Choose your role"
               : step === 2 && role === "owner" ? "Select your industry"
               : "Your details"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 1 ? "How will you use DemandPlan?"
               : step === 2 && role === "owner" ? "We'll customize your experience."
               : "Create your account to get started."}
            </p>
          </div>

          <div className="p-6">
            {/* Step 1: Role */}
            {step === 1 && (
              <div className="space-y-3">
                {ROLES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all
                      ${role === r.key ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                      ${role === r.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                      <r.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.badgeColor}`}>
                          {r.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.description}</p>
                    </div>
                    <div className={`mt-1 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center
                      ${role === r.key ? "border-gray-900 bg-gray-900" : "border-gray-200"}`}>
                      {role === r.key && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
                <button
                  onClick={nextStep}
                  disabled={!role}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gray-900
                             py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Step 2: Industry (owner only) */}
            {step === 2 && role === "owner" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {industries.map(ind => {
                    const Icon = DOMAIN_ICONS[ind.industry_id] ?? Store;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => setIndustryId(ind.industry_id)}
                        className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-center transition-all
                          ${industryId === ind.industry_id
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-100 hover:border-gray-200 bg-white"}`}
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl
                          ${industryId === ind.industry_id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{ind.display_name}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-3
                               text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!industryId}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-900
                               py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Final step: Details */}
            {((step === 2 && role !== "owner") || step === 3) && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>

                {/* Business name (owner only) */}
                {role === "owner" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Business name *
                    </label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={e => setF("companyName", e.target.value)}
                      placeholder="Apollo Pharmacy Bangalore"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />
                  </div>
                )}

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      First name *
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={e => setF("firstName", e.target.value)}
                      required
                      placeholder="Arjun"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={e => setF("lastName", e.target.value)}
                      placeholder="Kumar"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />
                  </div>
                </div>

                {/* Contact type toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Register with
                  </label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setContactType("email")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors
                        ${contactType === "email" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      <Mail className="h-4 w-4" /> Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactType("phone")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors
                        ${contactType === "phone" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      <Phone className="h-4 w-4" /> Phone
                    </button>
                  </div>
                </div>

                {/* Email or Phone */}
                {contactType === "email" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setF("email", e.target.value)}
                      placeholder="arjun@pharmacy.com"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Mobile number *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setF("phone", e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={form.password}
                      onChange={e => setF("password", e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          form.password.length < 8 ? "w-1/4 bg-rose-400"
                          : form.password.length < 12 ? "w-2/4 bg-amber-400"
                          : "w-full bg-emerald-400"}`}
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900
                             py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {loading ? "Creating account…" : <>Create account <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-gray-700 hover:text-gray-900 underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-sm font-semibold text-gray-500 animate-pulse">Loading onboarding...</div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
