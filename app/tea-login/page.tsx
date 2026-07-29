"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Phone, Mail, Eye, EyeOff, Wifi, WifiOff } from "lucide-react";

const BACKEND = "https://demandplanning-backend.onrender.com";

async function loginDirect(payload: Record<string, unknown>) {
  const res = await fetch(`${BACKEND}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function warmBackend() {
  try {
    await fetch(`${BACKEND}/v1/health`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch { /* silence */ }
}

export default function TeaLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [backendOk,  setBackendOk]  = useState<boolean | null>(null);
  const [retryIn,    setRetryIn]    = useState(0);
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPhone = /^\+?\d{7,15}$/.test(identifier.replace(/\s/g, ""));

  /* warm backend on mount */
  useEffect(() => {
    warmBackend().then(() => setBackendOk(true)).catch(() => setBackendOk(false));
  }, []);

  const startCountdown = (seconds: number) => {
    setRetryIn(seconds);
    if (retryTimer.current) clearInterval(retryTimer.current);
    retryTimer.current = setInterval(() => {
      setRetryIn(s => {
        if (s <= 1) { clearInterval(retryTimer.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryIn > 0) return;
    setError(null);
    setLoading(true);

    try {
      const payload = isPhone
        ? { phone: identifier.trim(), password }
        : { email: identifier.trim().toLowerCase(), password };

      const { status, data } = await loginDirect(payload);

      if (status === 429) {
        startCountdown(30);
        setError("Server is busy — please wait a moment.");
        setLoading(false);
        return;
      }

      if (status === 401 || status === 403) {
        setError("Invalid email/phone or password. Please try again.");
        setLoading(false);
        return;
      }

      if (status >= 500) {
        setError("Server error — backend may be starting. Please retry in 10 seconds.");
        setLoading(false);
        return;
      }

      /* unwrap token — support both flat and nested shapes */
      const token = data?.accessToken ?? data?.data?.accessToken;
      const user  = data?.user        ?? data?.data?.user;

      if (token) {
        if (user?.industryId && user.industryId !== "tea") {
          setError("This account isn't a TeaFactory360 account.");
          setLoading(false);
          return;
        }
        localStorage.setItem("token",        token);
        localStorage.setItem("role",         user?.role     ?? "owner");
        localStorage.setItem("tenantId",     user?.tenantId ?? "");
        localStorage.setItem("storeId",      user?.storeId  ?? "");
        localStorage.setItem("userId",       user?.id       ?? "");
        localStorage.setItem("userEmail",    user?.email    ?? identifier);
        localStorage.setItem("industryId",   "tea");
        if (data?.refreshToken || data?.data?.refreshToken)
          localStorage.setItem("refreshToken", data?.refreshToken ?? data?.data?.refreshToken);

        const redirect = new URLSearchParams(window.location.search).get("redirect");
        router.push(redirect || "/tea");
        return;
      }

      setError(data?.message ?? data?.error ?? "Login failed. Check your credentials.");
    } catch (err: any) {
      if (err?.name === "TimeoutError" || err?.message?.includes("timeout")) {
        setError("Backend is waking up (free tier). Please try again in 10 seconds.");
      } else {
        setError(err?.message ?? "Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1F17] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Leaf size={17} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TeaFactory360</span>
        </div>

        {/* Server status */}
        <div className="flex justify-center mb-4">
          {backendOk === null && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full">
              <Wifi size={11} className="animate-pulse" /> Connecting…
            </span>
          )}
          {backendOk === true && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full">
              <Wifi size={11} /> Server ready
            </span>
          )}
          {backendOk === false && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full">
              <WifiOff size={11} /> Server warming up — login may take a moment
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-900">Factory Owner Sign In</h1>
            <p className="text-xs text-gray-500 mt-0.5">For factory owners and managers</p>
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
                {retryIn > 0 && <span className="ml-2 font-bold"> Retry in {retryIn}s…</span>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || retryIn > 0}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white
                         hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading ? "Signing in…" : retryIn > 0 ? `Retry in ${retryIn}s` : "Sign in"}
            </button>

            {/* Demo hint */}
            <div className="bg-emerald-50 rounded-xl px-4 py-3 text-xs text-emerald-800">
              <p className="font-semibold mb-1">Demo Account</p>
              <p className="font-mono">dnmsathia@hotmail.com</p>
              <p className="font-mono">Qasd!@#45</p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-1">
              New factory?{" "}
              <Link href="/tea-register" className="text-gray-600 font-semibold hover:text-gray-800 underline">
                Register your factory
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-white/30 mb-2">Staff login?</p>
          <a href="/tea-factory-login"
            className="inline-block text-xs text-emerald-400 font-semibold hover:text-emerald-300">
            → TeaMaker / Agent / Grower Sign In
          </a>
        </div>

        <p className="text-center text-xs text-white/10 mt-8">
          TeaFactory360 · Growers to grading to sales, end to end
        </p>
      </div>
    </div>
  );
}
