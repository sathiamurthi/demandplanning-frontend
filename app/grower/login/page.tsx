"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Phone, AlertTriangle } from "lucide-react";

const API = "/v1";

export default function GrowerLoginPage() {
  const router = useRouter();

  const [tenantId,  setTenantId]  = useState<string>("");
  const [phone,     setPhone]     = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [noTenant,  setNoTenant]  = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") || "";
    setTenantId(t);
    if (!t) setNoTenant(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError("Missing store link. Use the URL your agent or factory sent you.");
      return;
    }
    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/tenants/${tenantId}/tea/grower-auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("grower_token",  data.data.token);
        localStorage.setItem("grower_id",     data.data.grower.id);
        localStorage.setItem("grower_name",   data.data.grower.name);
        localStorage.setItem("grower_tenant", tenantId);
        router.push("/grower");
      } else {
        setError(data.error || "Login failed. Check your phone number.");
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
          <h2 className="text-white font-semibold mb-2">Sign in</h2>
          <p className="text-white/40 text-xs mb-5">
            Just your phone number — no password needed, as long as your agent or factory has already added you as a grower.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Phone */}
            <div>
              <label className="text-white/40 text-xs block mb-1.5">Phone number</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  autoComplete="tel"
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
          Not added yet? Contact your agent or tea factory to get added first.
        </p>
      </div>
    </div>
  );
}
