"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import {
  Leaf, CheckCircle2, ArrowRight, Eye, EyeOff, AlertCircle, Phone, Mail,
} from "lucide-react";

type ContactType = "email" | "phone";

export default function TeaRegisterPage() {
  const router = useRouter();
  const [contactType, setContactType] = useState<ContactType>("email");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", companyName: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName) { setError("First name is required"); return; }
    if (!form.companyName) { setError("Factory / business name is required"); return; }
    if (contactType === "email" && !form.email) { setError("Email is required"); return; }
    if (contactType === "phone" && !form.phone) { setError("Phone number is required"); return; }
    if (!form.password || form.password.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost("/ext/tenant/register", {
        firstName: form.firstName,
        lastName:  form.lastName,
        password:  form.password,
        ...(contactType === "email" ? { email: form.email } : { phone: form.phone }),
        companyName: form.companyName,
        industry_id: "tea",
        source: "tea-standalone",
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1F17] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Registration submitted!</h1>
              <p className="text-sm text-gray-500 mt-2">
                Welcome to TeaFactory360. A superadmin needs to approve your factory account
                before you can sign in — we'll be in touch shortly.
              </p>
            </div>
            <button
              onClick={() => router.push("/tea-login")}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white
                         hover:bg-emerald-700 transition-colors"
            >
              Continue to sign in →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1F17] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Leaf size={17} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TeaFactory360</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900">Register your tea factory</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create your TeaFactory360 account to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Factory / business name *
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={e => setF("companyName", e.target.value)}
                placeholder="Nilgiri Tea Factory"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

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
                             focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                             focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Register with
              </label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <button type="button" onClick={() => setContactType("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    contactType === "email" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  <Mail className="h-4 w-4" /> Email
                </button>
                <button type="button" onClick={() => setContactType("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    contactType === "phone" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  <Phone className="h-4 w-4" /> Phone
                </button>
              </div>
            </div>

            {contactType === "email" ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setF("email", e.target.value)}
                  placeholder="arjun@teafactory.com"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                             focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            )}

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
                             focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    form.password.length < 8 ? "w-1/4 bg-rose-400"
                    : form.password.length < 12 ? "w-2/4 bg-amber-400"
                    : "w-full bg-emerald-400"}`} />
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600
                         py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
            >
              {loading ? "Creating account…" : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
            Already have a factory account?{" "}
            <Link href="/tea-login" className="font-semibold text-gray-700 hover:text-gray-900 underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] text-white/30">
            <Link href="/agent-register" className="hover:text-white/60 transition-colors">Register as Field Agent</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
