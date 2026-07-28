"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff, Factory, Users, User, ChevronRight } from "lucide-react";
import { apiPost } from "@/lib/api";

const ROLES = [
  { id: "factory_owner",  label: "Factory Owner",   icon: Factory, desc: "Full access — all modules" },
  { id: "tea_maker",      label: "Tea Maker",        icon: Leaf,    desc: "Shift log, batch, intake" },
  { id: "store_keeper",   label: "Store Keeper",     icon: Users,   desc: "Stock, dispatch, tally" },
  { id: "accountant",     label: "Accountant",       icon: User,    desc: "Finance, reports, costs" },
  { id: "agent",          label: "Agent",            icon: Users,   desc: "Grower & collection view" },
  { id: "grower",         label: "Grower",           icon: Leaf,    desc: "My leaf intake & payments" },
];

const inp = "w-full h-12 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none bg-gray-50 transition-all";

export default function FactoryLoginPage() {
  const router = useRouter();
  const [roleId,      setRoleId]    = useState("tea_maker");
  const [identifier,  setIdentifier]= useState("");
  const [password,    setPassword]  = useState("");
  const [showPwd,     setShowPwd]   = useState(false);
  const [error,       setError]     = useState<string | null>(null);
  const [loading,     setLoading]   = useState(false);

  const isPhone = /^\+?\d{7,15}$/.test(identifier.replace(/\s/g, ""));
  const selectedRole = ROLES.find(r => r.id === roleId)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = isPhone
        ? { phone: identifier.trim(), password, role_hint: roleId }
        : { email: identifier.trim().toLowerCase(), password, role_hint: roleId };

      const res = await apiPost<any>("/auth/login", payload);

      if (res.success && res.data?.accessToken) {
        const user = res.data.user;
        /* Validate industry */
        if (user?.industryId && user.industryId !== "tea") {
          setError("This account does not belong to TeaFactory360. Please use your app's own sign-in page.");
          setLoading(false); return;
        }
        /* Persist session */
        localStorage.setItem("token",      res.data.accessToken);
        localStorage.setItem("role",       user?.role     ?? roleId);
        localStorage.setItem("tenantId",   user?.tenantId ?? "");
        localStorage.setItem("storeId",    user?.storeId  ?? "");
        localStorage.setItem("userId",     user?.id       ?? "");
        localStorage.setItem("userEmail",  user?.email    || identifier);
        localStorage.setItem("industryId", "tea");
        localStorage.setItem("userRole",   roleId);
        if (res.data.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);

        /* Role-based redirect */
        const redirectMap: Record<string, string> = {
          factory_owner: "/tea/factory/dashboard",
          tea_maker:     "/tea/factory/shift",
          store_keeper:  "/tea/factory/made-tea",
          accountant:    "/tea/factory/tally",
          agent:         "/tea/growers",
          grower:        "/tea",
        };
        const redirect = new URLSearchParams(window.location.search).get("redirect");
        router.push(redirect || redirectMap[roleId] || "/tea");
      } else {
        setError(res.message ?? res.error ?? "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1F17] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Leaf size={19} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">TeaFactory360</span>
            <p className="text-emerald-400 text-[11px] leading-none">Factory Management System</p>
          </div>
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
                  <button key={role.id} onClick={() => setRoleId(role.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${active ? "bg-emerald-50 border-emerald-400 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-emerald-600" : "bg-gray-100"}`}>
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

          {/* Divider */}
          <div className="border-t border-gray-100 mx-5" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email or Mobile Number
              </label>
              <input
                type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                placeholder="user@factory.com or 9876543210"
                autoComplete="username" required className={inp} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password" required className={inp + " pr-11"} />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !identifier || !password}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-900/20 mt-1">
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <><span>Sign in as {selectedRole.label}</span><ChevronRight size={16} /></>
              )}
            </button>
          </form>

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

        {/* Footer */}
        <p className="text-center text-[11px] text-emerald-900/40 mt-6">
          TeaFactory360 · demandgeniusai.com
        </p>
      </div>
    </div>
  );
}
