"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Please request a new one.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }
    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)             s++;
    if (/[A-Z]/.test(password))           s++;
    if (/[0-9]/.test(password))           s++;
    if (/[^a-zA-Z0-9]/.test(password))   s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-500"][strength];

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
              <h1 className="text-lg font-bold text-gray-900">Password reset!</h1>
              <p className="text-sm text-gray-500">Your password has been updated. Redirecting to loginâ€¦</p>
              <Link href="/login"
                className="flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5
                           text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
                Go to login â†’
              </Link>
            </div>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-5">
                <Lock className="h-5 w-5 text-indigo-500" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Set new password</h1>
              <p className="text-sm text-gray-500 mb-6">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 characters"
                      disabled={!token}
                      className="w-full rounded-xl border border-gray-200 bg-white pl-4 pr-10 py-2.5 text-sm
                                 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                                 focus:ring-gold-400 disabled:bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i}
                            className={`h-1 flex-1 rounded-full transition-all
                              ${i <= strength ? strengthColor : "bg-gray-100"}`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-medium
                        ${strength <= 1 ? "text-red-500" : strength === 2 ? "text-orange-500" :
                          strength === 3 ? "text-amber-500" : "text-emerald-600"}`}>
                        {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Re-enter password"
                    disabled={!token}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm
                               text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                               focus:ring-gold-400 disabled:bg-gray-50"
                  />
                  {confirm && password !== confirm && (
                    <p className="mt-1 text-[11px] text-red-500">Passwords don't match</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white
                             hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Savingâ€¦" : "Reset password"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/forgot-password"
                  className="text-sm text-gray-500 hover:text-gray-700">
                  Need a new link? Request again
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Powered by DemandGenius Â· v2.0
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F1729] flex items-center justify-center">
        <div className="text-white/50 text-sm">Loadingâ€¦</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
