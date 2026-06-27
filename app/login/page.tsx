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
    description: "Browse stores, search products, and check availability across Grocery, Pharma, Auto Parts & Tea — no account required.",
    features: ["Search any product", "Browse all stores", "Check stock availability"],
    cta: "Explore now",
    action: "/explore",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const activeJourney = JOURNEYS.find(x => x.key === selected) || JOURNEYS[0];
  const ActiveIcon = activeJourney.icon;

  const handleCta = (journey: typeof JOURNEYS[0]) => {
    if (journey.action === "form") {
      setSelected(journey.key);
      setShowForm(true);
    } else {
      router.push(journey.action);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1729] flex items-center justify-center px-4 py-10">
      <div className={`w-full transition-all duration-300 ${showForm ? "max-w-sm" : "max-w-3xl"}`}>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">DemandPlan</span>
        </div>

        {/* Login form */}
        {showForm ? (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All sign-in options
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeJourney.color} flex items-center justify-center shrink-0`}>
                  <ActiveIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900">{activeJourney.title} Sign In</h1>
                  <p className="text-xs text-gray-500">{activeJourney.description.split(".")[0]}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <UserLoginForm />
            </div>
          </div>

        ) : (
          <>
            {/* Journey selector */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-sm text-white/50">Choose how you'd like to sign in</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {JOURNEYS.map((j) => {
                const Icon = j.icon;
                return (
                  <div
                    key={j.key}
                    className={`group relative bg-white rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer
                      flex flex-col ${selected === j.key ? j.activeBorder : j.border}`}
                    onClick={() => setSelected(j.key === selected ? null : j.key)}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${j.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Badge */}
                    <span className={`self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${j.badgeColor}`}>
                      {j.badge}
                    </span>

                    {/* Title */}
                    <h2 className="text-base font-bold text-gray-900 mb-1.5">{j.title}</h2>

                    {/* Description */}
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{j.description}</p>

                    {/* Features */}
                    <ul className="space-y-1 mb-5">
                      {j.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                          <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${j.color}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCta(j); }}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${j.color}
                        py-2.5 text-xs font-semibold text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all`}
                    >
                      {j.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-white/30">
              New to DemandPlan?{" "}
              <Link href="/register" className="text-white/60 font-semibold hover:text-white underline transition-colors">
                Create an account
              </Link>
            </p>
          </>
        )}

        <p className="text-center text-xs text-white/20 mt-6">
          Powered by GenericDemandAI · v2.0
        </p>
      </div>
    </div>
  );
}
