"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
      <Link href="/" className="text-lg font-bold">
        Demand Genius
      </Link>
      <div className="space-x-4 hidden md:flex">
        <Link href="/dashboard" className="hover:text-gray-200">Dashboard</Link>
        <Link href="/inventory" className="hover:text-gray-200">Inventory</Link>
        <Link href="/orders" className="hover:text-gray-200">Orders</Link>
        <Link href="/ai-order" className="hover:text-gray-200 border border-indigo-400/50 rounded px-2 py-0.5 text-sm text-indigo-300">✨ AI Order</Link>
        <Link href="/sales" className="hover:text-gray-200">Sales</Link>
        <Link href="/report" className="hover:text-gray-200">AI Report</Link>
        <Link href="/settings" className="hover:text-gray-200">Settings</Link>
        <Link href="/admin" className="hover:text-gray-200">Admin</Link>
        <Link href="/explore" className="hover:text-gray-200 border border-white/30 rounded px-2 py-0.5 text-sm">🔍 Explore</Link>
        <Link href="/tea" className="hover:text-gray-200 border border-green-400/50 rounded px-2 py-0.5 text-sm text-green-300">🍃 Tea</Link>
        <Link href="/route360" className="hover:text-gray-200 border border-orange-400/50 rounded px-2 py-0.5 text-sm text-orange-300">🚛 Route360</Link>
        <Link href="/jobs" className="hover:text-gray-200 border border-teal-400/50 rounded px-2 py-0.5 text-sm text-teal-300">💼 Jobs</Link>
        <Link href="/edu360" className="hover:text-gray-200 border border-sky-400/50 rounded px-2 py-0.5 text-sm text-sky-300">🎓 Edu360</Link>
        <Link href="/college360" className="hover:text-gray-200 border border-violet-400/50 rounded px-2 py-0.5 text-sm text-violet-300">🏫 College360</Link>
        <Link href="/enterprise360" className="hover:text-gray-200 border border-teal-400/50 rounded px-2 py-0.5 text-sm text-teal-300">🤖 Enterprise360</Link>
        <Link href="/lex360" className="hover:text-gray-200 border border-sky-400/50 rounded px-2 py-0.5 text-sm text-sky-300">📊 Lex360</Link>
        <Link href="/data360" className="hover:text-gray-200 border border-emerald-400/50 rounded px-2 py-0.5 text-sm text-emerald-300">🗃️ Data360</Link>
      </div>
    </nav>
  );
}
