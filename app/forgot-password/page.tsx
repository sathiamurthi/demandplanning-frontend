"use client";

import { useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ resetUrl?: string; token?: string; message?: string } | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>("/auth/forgot-password", { email });
      setSuccess(res.data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1729] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl
                           bg-gold-400 text-sm font-black text-gray-950">
            DP
          </span>
          <span className="text-xl font-bold text-white tracking-tight">DemandPlan</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 mx-auto">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Check your email</h1>
              <p className="text-sm text-gray-500">{success.message ?? "Password reset link has been sent."}</p>

              {/* Dev mode: show token */}
              {success.resetUrl && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-left">
                  <p className="text-xs font-bold text-amber-700 mb-2">Development mode</p>
                  <p className="text-xs text-amber-600 mb-2">Token (would be emailed in production):</p>
                  <code className="block text-[11px] text-gray-700 break-all bg-white rounded-lg p-2 border">
                    {success.token}
                  </code>
                  <Link
                    href={success.resetUrl}
                    className="mt-3 flex items-center justify-center rounded-xl bg-amber-600
                               px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    Open reset link →
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 mb-5">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Forgot password?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm
                               text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                               focus:ring-gold-400 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white
                             hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Powered by GenericDemandAI · v2.0
        </p>
      </div>
    </div>
  );
}
