"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { Leaf, Phone, Mail, Eye, EyeOff } from "lucide-react";

export default function TeaLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  const isPhone = /^\+?\d{7,15}$/.test(identifier.replace(/\s/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = isPhone
        ? { phone: identifier.trim(), password }
        : { email: identifier.trim().toLowerCase(), password };

      const res = await apiPost<any>("/auth/login", payload);

      if (res.success && res.data?.accessToken) {
        if (res.data.user?.industryId && res.data.user.industryId !== "tea") {
          setError("This account isn't a TeaFactory360 account. Use your app's own sign-in page.");
          setLoading(false);
          return;
        }
        localStorage.setItem("token",    res.data.accessToken);
        localStorage.setItem("role",     res.data.user?.role     ?? "staff");
        localStorage.setItem("tenantId", res.data.user?.tenantId ?? "");
        localStorage.setItem("storeId",  res.data.user?.storeId  ?? "");
        localStorage.setItem("userId",   res.data.user?.id       ?? "");
        localStorage.setItem("userEmail", res.data.user?.email || identifier);
        localStorage.setItem("industryId", "tea");
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }

        const redirect = new URLSearchParams(window.location.search).get("redirect");
        router.push(redirect || "/tea");
      } else {
        setError(res.message ?? res.error ?? "Login failed. Check your credentials.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1F17] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Leaf size={17} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TeaFactory360</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-900">Factory Sign In</h1>
            <p className="text-xs text-gray-500 mt-0.5">For factory owners, managers, and staff</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email or Phone
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  {isPhone ? <Phone className="h-4 w-4 text-gray-400" /> : <Mail className="h-4 w-4 text-gray-400" />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="owner@teafactory.com or +91 9876543210"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm
                             text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-emerald-400 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm
                             text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-emerald-400 focus:border-transparent transition-shadow"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white
                         hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <p className="text-center text-xs text-gray-400 mt-1">
              New factory?{" "}
              <Link href="/tea-register" className="text-gray-600 font-semibold hover:text-gray-800 underline">
                Register your factory
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-6 space-y-2.5 text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] text-white/30">
            <Link href="/grower/login" className="hover:text-white/60 transition-colors">Grower Portal Login</Link>
            <span>•</span>
            <Link href="/agent-login" className="hover:text-white/60 transition-colors">Field Agent Login</Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/10 mt-10">
          TeaFactory360 · Growers to grading to sales, end to end
        </p>
      </div>
    </div>
  );
}
