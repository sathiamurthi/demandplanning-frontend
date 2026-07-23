"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store, Search, BarChart3,
} from "lucide-react";
import UserLoginForm from "@/components/UserLoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0F1729] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">DemandGenius</span>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Store Sign In</h1>
              <p className="text-xs text-gray-500">Access your store dashboard or administration panel</p>
            </div>
          </div>
          <div className="p-6">
            <UserLoginForm />
          </div>
        </div>

        <div className="mt-6 space-y-2.5 text-center">
          <p className="text-xs text-white/30">
            New to DemandGenius?{" "}
            <Link href="/register" className="text-white/60 font-semibold hover:text-white underline transition-colors">
              Create an account
            </Link>
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] text-white/20">
            <Link href="/explore" className="hover:text-white/55 transition-colors">PigeonSearch AI</Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/10 mt-10">
          Powered by DemandGenius · v2.0
        </p>
      </div>
    </div>
  );
}
