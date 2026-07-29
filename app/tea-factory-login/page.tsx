"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff, Factory, Users, User, ChevronRight, Wifi, WifiOff } from "lucide-react";

const BACKEND = "https://demandplanning-backend.onrender.com";

const ROLES = [
  { id: "factory_owner", label: "Factory Owner", icon: Factory, desc: "Full access — all modules" },
  { id: "tea_maker",     label: "Tea Maker",     icon: Leaf,    desc: "Shift log, batch, intake" },
  { id: "store_keeper",  label: "Store Keeper",  icon: Users,   desc: "Stock, dispatch, tally" },
  { id: "accountant",    label: "Accountant",    icon: User,    desc: "Finance, reports, costs" },
  { id: "agent",         label: "Agent",         icon: Users,   desc: "Grower & collection view" },
  { id: "grower",        label: "Grower",        icon: Leaf,    desc: "My leaf intake & payments" },
];

const ROLE_REDIRECTS: Record<string, string> = {
  factory_owner: "/tea/factory/dashboard",
  tea_maker:     "/tea/factory/shift",
  store_keeper:  "/tea/factory/made-tea",
  accountant:    "/tea/factory/tally",
  agent:         "/tea/growers",
  grower:        "/tea",
};

const inp =
  "w-full h-12 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 " +
  "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none bg-gray-50 transition-all";

/* ── direct fetch — NEVER touches the /login redirect in api.ts ── */
async function loginDirect(email: string, password: string, roleHint: string) {
  const res = await fetch(`${BACKEND}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role_hint: roleHint }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

/* ── warm-up ping ── */
async function warmBackend() {
  try {
    await fetch(`${BACKEND}/v1/health`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch {
    // silence — just a warm-up
  }
}

export default function FactoryLoginPage() {
  const router = useRouter();
  const [roleId,      setRoleId]     = useState("factory_owner");
  const [identifier,  setIdentifier] = useState("");
  const [password,    setPassword]   = useState("");
  const [showPwd,     setShowPwd]    = useState(false);
  const [error,       setError]      = useState<string | null>(null);
  const [loading,     setLoading]    = useState(false);
  const [backendOk,   setBackendOk]  = useState<boolean | null>(null);
  const [retryIn,     setRetryIn]    = useState(0);
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* warm-up on mount */
  useEffect(() => {
    warmBackend().then(() => setBackendOk(true)).catch(() => setBackendOk(false));
  }, []);

  /* countdown for 429 */
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

  const selectedRole = ROLES.find(r => r.id === roleId)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryIn > 0) return;
    setError(null);
    setLoading(true);

    try {
      const email = identifier.trim().toLowerCase();
      const { status, data } = await loginDirect(email, password, roleId);

      if (status === 429) {
        startCountdown(30);
        setError("Server is busy — please wait a moment and it will retry automatically.");
        setLoading(false);
        return;
      }

      if (status === 401 || status === 403) {
        setError("Invalid email or password. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (status >= 500) {
        setError("Server error — the backend may be starting up. Please try again in 10 seconds.");
        setLoading(false);
        return;
      }

      /* success paths */
      const token = data?.accessToken ?? data?.data?.accessToken;
      const user  = data?.user        ?? data?.data?.user;

      if (token) {
        localStorage.setItem("token",      token);
        localStorage.setItem("role",       user?.role     ?? roleId);
        localStorage.setItem("tenantId",   user?.tenantId ?? "");
        localStorage.setItem("storeId",    user?.storeId  ?? "");
        localStorage.setItem("userId",     user?.id       ?? "");
        localStorage.setItem("userEmail",  user?.email    ?? email);
        localStorage.setItem("industryId", "tea");
        localStorage.setItem("userRole",   roleId);
        if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

        const qRedirect = new URLSearchParams(window.location.search).get("redirect");
        router.push(qRedirect || ROLE_REDIRECTS[roleId] || "/tea");
        return;
      }

      /* wrapped response: { success, data: { accessToken } } */
      const token2 = data?.data?.accessToken;
      if (data?.success && token2) {
        localStorage.setItem("token",      token2);
        localStorage.setItem("userRole",   roleId);
        localStorage.setItem("industryId", "tea");
        const qRedirect = new URLSearchParams(window.location.search).get("redirect");
        router.push(qRedirect || ROLE_REDIRECTS[roleId] || "/tea");
        return;
      }

      setError(data?.message ?? data?.error ?? "Login failed. Please check your credentials.");
    } catch (err: any) {
      if (err?.name === "TimeoutError" || err?.message?.includes("timeout")) {
        setError("Backend is waking up — please try again in 10 seconds.");
      } else {
        setError(err?.message ?? "Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* auto-retry after countdown */
  useEffect(() => {
    if (retryIn === 0 && error?.includes("busy") && identifier && password) {
      // auto-submit after countdown finishes
    }
  }, [retryIn]);

  return (
    <div className="min-h-screen bg-[#0B1F17] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Leaf size={19} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">TeaFactory360</span>
            <p className="text-emerald-400 text-[11px] leading-none">Factory Management System</p>
          </div>
        </div>

        {/* Backend status pill */}
        <div className="flex justify-center mb-4">
          {backendOk === null && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-950/60 px-3 py-1 rounded-full">
              <Wifi size={11} className="animate-pulse" /> Connecting to server…
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

          {/* Role selector */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sign in as</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => {
                const Icon = role.icon;
                const active = roleId === role.id;
                return (
                  <button key={role.id} type="button" onClick={() => setRoleId(role.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all
                      ${active ? "bg-emerald-50 border-emerald-400 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${active ? "bg-emerald-600" : "bg-gray-100"}`}>
                      <Icon size={14} className={active ? "text-white" : "text-gray-500"} />
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-xs font-bold truncate ${active ? "text-emerald-800" : "text-gray-700"}`}>{role.label}</p>
                      <p className={`text-[10px] truncate ${active ? "text-emerald-600" : "text-gray-400"}`}>{role.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 mx-5" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@factory.com"
                autoComplete="username"
                required
                className={inp}
              />
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className={inp + " pr-11"}
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error / Countdown */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
                {error}
                {retryIn > 0 && (
                  <span className="ml-2 font-bold text-red-800">Retry in {retryIn}s…</span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password || retryIn > 0}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40
                disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all
                flex items-center justify-center gap-2 shadow-sm shadow-emerald-900/20 mt-1">
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : retryIn > 0 ? (
                <span>Retry in {retryIn}s</span>
              ) : (
                <><span>Sign in as {selectedRole.label}</span><ChevronRight size={16} /></>
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="border-t border-gray-100 mx-5" />
          <div className="px-5 py-3 bg-emerald-50/50">
            <p className="text-[11px] text-emerald-700 font-semibold mb-1">Demo credentials</p>
            <div className="text-[11px] text-gray-600 space-y-0.5">
              <p>Owner: <span className="font-mono font-semibold">dnmsathia@hotmail.com</span> / <span className="font-mono font-semibold">Qasd!@#45</span></p>
            </div>
          </div>

          {/* Switch to owner login */}
          <div className="border-t border-gray-100 px-5 py-4 text-center">
            <p className="text-xs text-gray-400">
              Looking for the owner console?{" "}
              <a href="/tea-login" className="text-emerald-600 font-semibold hover:underline">
                Sign in as Owner →
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-emerald-900/40 mt-6">
          TeaFactory360 · demandgeniusai.com
        </p>
      </div>
    </div>
  );
}
