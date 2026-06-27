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
        <Link href="/sales" className="hover:text-gray-200">Sales</Link>
        <Link href="/report" className="hover:text-gray-200">AI Report</Link>
        <Link href="/settings" className="hover:text-gray-200">Settings</Link>
        <Link href="/admin" className="hover:text-gray-200">Admin</Link>
        <Link href="/explore" className="hover:text-gray-200 border border-white/30 rounded px-2 py-0.5 text-sm">🔍 Explore</Link>
        <Link href="/tea" className="hover:text-gray-200 border border-green-400/50 rounded px-2 py-0.5 text-sm text-green-300">🍃 Tea</Link>
      </div>
    </nav>
  );
}
