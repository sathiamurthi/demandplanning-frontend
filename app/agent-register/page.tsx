"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Phone, Mail, Building2, CheckCircle2 } from "lucide-react";
import { apiPost } from "@/lib/api";

export default function AgentRegisterPage() {
  const [companyCode, setCompanyCode] = useState("");
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [identifier, setIdentifier]   = useState("");
  const [password, setPassword]       = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState<string | null>(null);

  const isPhone = /^\+?\d{7,15}$/.test(identifier.replace(/\s/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        companyCode: companyCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        password,
        ...(isPhone ? { phone: identifier.trim() } : { email: identifier.trim().toLowerCase() }),
      };
      const res = await apiPost<any>("/tea-agent/register", payload);
      if (res.success) {
        setSubmitted(res.data?.message || "Registration submitted — waiting for approval.");
      } else {
        setError(res.message ?? res.error ?? "Registration failed.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-emerald-600" size={26} />
          </div>
          <h1 className="text-base font-bold text-gray-900">Registration submitted</h1>
          <p className="text-sm text-gray-500">{submitted}</p>
          <Link href="/agent-login" className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 mt-2">
            Back to Agent Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">TeaFactory360</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-900">Register as Agent</h1>
            <p className="text-xs text-gray-500 mt-1">
              Your factory owner/manager must approve your account before you can sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Company Code
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={companyCode}
                  onChange={e => setCompanyCode(e.target.value)}
                  placeholder="abc-tea-agency"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Ask your factory owner for this code.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="First name" required
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <input
                type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email or Phone
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  {isPhone ? <Phone className="h-4 w-4 text-gray-400" /> : <Mail className="h-4 w-4 text-gray-400" />}
                </div>
                <input
                  type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="agent@example.com" required
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 shadow-sm py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Register as Agent"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/agent-login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Already have an approved account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
