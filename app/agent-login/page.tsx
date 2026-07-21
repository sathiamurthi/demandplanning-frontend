"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Phone, Mail } from "lucide-react";
import { apiPost } from "@/lib/api";

export default function AgentLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        const role = res.data.user?.role ?? "";
        const industryId = res.data.user?.industryId;

        if (industryId !== "tea") {
          setError("This login is only for TeaFactory360 agents.");
          setLoading(false);
          return;
        }
        if (role !== "agent") {
          setError("This account isn't set up as a field agent. Use the main TeaFactory360 login instead.");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("role", role);
        localStorage.setItem("tenantId", res.data.user?.tenantId ?? "");
        localStorage.setItem("storeId", res.data.user?.storeId ?? "");
        localStorage.setItem("userId", res.data.user?.id ?? "");
        localStorage.setItem("userEmail", res.data.user?.email || identifier);
        localStorage.setItem("industryId", industryId);
        if (res.data.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);

        router.push("/tea");
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
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-950/40 ring-1 ring-white/10">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TeaFactory360</span>
        </div>

        <div className="bg-gradient-to-b from-[#1b1f2a] to-[#14171f] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/8">
            <h1 className="text-base font-bold text-white">Agent Login</h1>
            <p className="text-xs text-white/40 mt-1">
              Growers, tea collection, dispatch, payments &amp; vehicle management — for field collection agents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1.5">
                Email or Phone
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  {isPhone ? <Phone className="h-4 w-4 text-white/30" /> : <Mail className="h-4 w-4 text-white/30" />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="agent@abcteaagency.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f14] pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-950/40 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in as Agent"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Not an agent? Go to the full TeaFactory360 login
          </Link>
        </div>
      </div>
    </div>
  );
}
