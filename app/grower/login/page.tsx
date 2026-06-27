"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Phone, Mail, Lock, AlertTriangle } from "lucide-react";

const API = "/v1";

export default function GrowerLoginPage() {
  const router = useRouter();

  const [tenantId,  setTenantId]  = useState<string>("");
  const [identity,  setIdentity]  = useState("");   // phone or email
  const [pin,       setPin]       = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [noTenant,  setNoTenant]  = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") || "";
    setTenantId(t);
    if (!t) setNoTenant(true);
  }, []);

  const isPhone = /^[+\d]/.test(identity.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError("Missing store link. Use the URL your manager sent you.");
      return;
    }
    if (!identity.trim() || !pin) {
      setError("Enter your phone / email and PIN.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const body = isPhone
        ? { phone: identity.trim(), pin }
        : { email: identity.trim(), pin };

      const res  = await fetch(`${API}/tenants/${tenantId}/tea/grower-login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("grower_token",  data.data.token);
        localStorage.setItem("grower_id",     data.data.grower.id);
        localStorage.setItem("grower_name",   data.data.grower.name);
        localStorage.setItem("grower_tenant", tenantId);
        router.push("/grower");
      } else {
        setError(data.error || "Login failed. Check your credentials.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07120a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-green-600/20 rounded-2xl flex items-center justify-center border border-green-600/20">
            <Leaf size={26} className="text-green-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Grower Portal</h1>
            <p className="text-green-400/50 text-sm mt-0.5">Tea Collection Dashboard</p>
          </div>
        </div>

        {/* No-tenant warning */}
        {noTenant && (
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
            <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-300 text-xs leading-relaxed">
              No store link detected. Please open the login link sent by your tea estate manager.
            </p>
          </div>
        )}

        {/* Form card */}
        <div className="bg-[#0d1f12] border border-white/8 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Phone / Email */}
            <div>
              <label className="text-white/40 text-xs block mb-1.5">Phone number or Email</label>
              <div className="relative">
                {isPhone || !identity
                  ? <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  : <Mail  size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                }
                <input
                  type="text"
                  value={identity}
                  onChange={e => setIdentity(e.target.value)}
                  placeholder="+91 9876543210 or email"
                  required
                  autoComplete="username"
                  className="w-full bg-[#071009] border border-white/10 rounded-xl pl-9 pr-3 py-2.5
                             text-sm text-white placeholder-white/20
                             focus:outline-none focus:border-green-600/50 transition-colors"
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="text-white/40 text-xs block mb-1.5">PIN</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  required
                  inputMode="numeric"
                  maxLength={8}
                  autoComplete="current-password"
                  className="w-full bg-[#071009] border border-white/10 rounded-xl pl-9 pr-3 py-2.5
                             text-sm text-white placeholder-white/20
                             focus:outline-none focus:border-green-600/50 transition-colors"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || noTenant}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed
                         text-white py-2.5 rounded-xl text-sm font-semibold transition-colors mt-1"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/15 text-xs mt-6">
          Contact your tea estate manager to get access
        </p>
      </div>
    </div>
  );
}
