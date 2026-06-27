"use client";

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Download, Calendar, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const monthlyData = [
  { month: "Jan", revenue: 42000, cost: 28000, profit: 14000 },
  { month: "Feb", revenue: 51000, cost: 32000, profit: 19000 },
  { month: "Mar", revenue: 47000, cost: 30000, profit: 17000 },
  { month: "Apr", revenue: 63000, cost: 38000, profit: 25000 },
  { month: "May", revenue: 58000, cost: 35000, profit: 23000 },
  { month: "Jun", revenue: 72000, cost: 42000, profit: 30000 },
];

const forecastData = [
  { month: "Jul", actual: 68000, forecast: 70000 },
  { month: "Aug", actual: null, forecast: 75000 },
  { month: "Sep", actual: null, forecast: 80000 },
  { month: "Oct", actual: null, forecast: 85000 },
];

const reports = [
  { name: "Q2 2026 Revenue Report", date: "Jun 30, 2026", size: "2.4 MB", type: "PDF" },
  { name: "Inventory Audit — June", date: "Jun 28, 2026", size: "1.1 MB", type: "XLSX" },
  { name: "Sales Performance H1", date: "Jun 25, 2026", size: "3.8 MB", type: "PDF" },
  { name: "Demand Forecast Q3", date: "Jun 20, 2026", size: "0.9 MB", type: "PDF" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("6m");

  return (
    <DashboardLayout
      title="Reports"
      subtitle="Financial reports, forecasts, and downloadable exports."
    >
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-white/40" />

          {["1m", "3m", "6m", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-all duration-200 ${
                period === p
                  ? "bg-[#6c63ff] text-white"
                  : "bg-[#161a23] border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Cost vs Profit */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#161a23] border border-white/8 rounded-xl p-6"
          >
            <h2 className="text-white font-semibold">
              Revenue vs Cost vs Profit
            </h2>
            <p className="text-white/40 text-xs mb-6">Monthly breakdown</p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#6c63ff" />
                <Bar dataKey="cost" fill="#ff6b6b" />
                <Bar dataKey="profit" fill="#4ecdc4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#161a23] border border-white/8 rounded-xl p-6"
          >
            <h2 className="text-white font-semibold">Demand Forecast</h2>
            <p className="text-white/40 text-xs mb-6">
              Actual vs projected revenue
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#4ecdc4"
                  strokeDasharray="5 5"
                  fill="url(#forecastGrad)"
                />
                <Area type="monotone" dataKey="actual" stroke="#6c63ff" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Reports */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#161a23] border border-white/8 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Saved Reports</h2>

            <button className="flex items-center gap-2 bg-[#6c63ff] text-white px-4 py-2 rounded-lg text-xs font-semibold">
              <BarChart3 size={14} />
              Generate Report
            </button>
          </div>

          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between p-4 bg-[#0d0f14] rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#6c63ff]/15 rounded-lg flex items-center justify-center">
                    <span className="text-[#6c63ff] text-xs font-bold">
                      {r.type}
                    </span>
                  </div>

                  <div>
                    <p className="text-white text-sm font-medium">{r.name}</p>
                    <p className="text-white/30 text-xs">
                      {r.date} · {r.size}
                    </p>
                  </div>
                </div>

                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#6c63ff]/20 flex items-center justify-center">
                  <Download size={14} className="text-white/50" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}