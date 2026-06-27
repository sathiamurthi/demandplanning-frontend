"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { Phone, Mail } from "lucide-react";

export default function UserLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]       = useState<string | null>(null);
  const [loading,    setLoading]     = useState(false);

  // Detect if input looks like a phone number
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
        localStorage.setItem("token",    res.data.accessToken);
        localStorage.setItem("role",     res.data.user?.role     ?? "staff");
        localStorage.setItem("tenantId", res.data.user?.tenantId ?? "");
        localStorage.setItem("storeId",  res.data.user?.storeId  ?? "");
        localStorage.setItem("userId",   res.data.user?.id       ?? "");
        localStorage.setItem("userEmail",
          res.data.user?.email || identifier);
        if (res.data.user?.industryId) {
          localStorage.setItem("industryId", res.data.user.industryId);
        }
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }

        const industryId = res.data.user?.industryId;
        const role = res.data.user?.role ?? "staff";
        const redirect = new URLSearchParams(window.location.search).get("redirect");

        if (redirect) {
          router.push(redirect);
        } else if (role === "superadmin") {
          router.push("/superadmin");
        } else if (industryId === "tea") {
          router.push("/tea");
        } else {
          router.push("/admin/dynamic/dashboard");
        }
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Email or Phone
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {isPhone
              ? <Phone className="h-4 w-4 text-gray-400" />
              : <Mail  className="h-4 w-4 text-gray-400" />}
          </div>
          <input
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="owner@apollo.com or +91 9876543210"
            required
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm
                       text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-gold-400 focus:border-transparent transition-shadow"
          />
        </div>
        {identifier && (
          <p className="mt-1 text-xs text-gray-400">
            Logging in with: <span className="font-medium text-gray-600">{isPhone ? "phone number" : "email"}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm
                     text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-gold-400 focus:border-transparent transition-shadow"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white
                   hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div className="flex items-center justify-end text-xs text-gray-400">
        <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700 underline">
          Forgot password?
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400 mt-1">
        New here?{" "}
        <Link href="/register" className="text-gray-600 font-semibold hover:text-gray-800 underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
