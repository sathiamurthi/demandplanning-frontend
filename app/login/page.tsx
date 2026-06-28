"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store, Leaf, Search, ArrowRight, ArrowLeft, BarChart3,
} from "lucide-react";
import UserLoginForm from "@/components/UserLoginForm";

const JOURNEYS = [
  {
    key: "store",
    icon: Store,
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100 hover:border-indigo-300",
    activeBorder: "border-indigo-500",
    badge: "Business",
    badgeColor: "bg-indigo-100 text-indigo-700",
    title: "Store Manager",
    description: "Sign in to manage your inventory, process sales, track orders, and get AI-powered demand insights for your store.",
    features: ["Inventory management", "Sales & billing", "AI demand reports"],
    cta: "Sign in to store",
    action: "form",
  },
  {
    key: "grower",
    icon: Leaf,
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100 hover:border-emerald-300",
    activeBorder: "border-emerald-500",
    badge: "Tea Industry",
    badgeColor: "bg-emerald-100 text-emerald-700",
    title: "Tea Grower",
    description: "Access your grower portal to record leaf collections, view plucking summaries, track settlements, and manage field workers.",
    features: ["Daily collections", "Worker records", "Settlement history"],
    cta: "Sign in to grower portal",
    action: "/grower/login",
  },
  {
    key: "explore",
    icon: Search,
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-50",
    border: "border-purple-100 hover:border-purple-300",
    activeBorder: "border-purple-500",
    badge: "No login needed",
    badgeColor: "bg-purple-100 text-purple-700",
    title: "Explore Stores",
    description: "Browse stores, search products, and check availability across Grocery, Pharma, Auto Parts & Tea â€” no account required.",
    features: ["Search any product", "Browse all stores", "Check stock availability"],
    cta: "Explore now",
    action: "/explore",
  },
];

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
          <div className="flex justify-center gap-4 text-[10px] text-white/20">
            <Link href="/grower/login" className="hover:text-white/55 transition-colors">Grower Portal Login</Link>
            <span>•</span>
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
