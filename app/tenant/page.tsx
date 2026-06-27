"use client";
import { useEffect, useState } from "react";
import { getTenantDashboard } from "@/lib/tenants";
import { DashboardData } from "@/lib/types";

export default function TenantDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getTenantDashboard();
        if (res.success) setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-gray-400">Loading dashboard...</p>;

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <DashboardCard title="Total Items" value={data?.summary.totalItems} />
        <DashboardCard title="Low Stock" value={data?.summary.lowStock} />
        <DashboardCard title="Out of Stock" value={data?.summary.ordersNeeded} />
        <DashboardCard title="Over Stock" value={data?.summary.criticalAlerts} />
      </div>

      {/* Recent Sales */}
      <div className="bg-[#161a23] p-4 rounded mb-6">
        <h2 className="text-lg font-bold mb-2">Recent Sales</h2>
        <ul>
          {data?.recentSales.map((s, idx) => (
            <li key={`${s.sale_id}-${s.itemId}-${idx}`}>
              {s.item}: {s.quantity}
            </li>
          ))}
        </ul>
      </div>

      {/* Active Alerts */}
      <div className="bg-[#161a23] p-4 rounded mb-6">
        <h2 className="text-lg font-bold mb-2">Active Alerts</h2>
        <ul>
          {data?.alerts.map((a, idx) => (
            <li key={`${a.id}-${idx}`} className="text-red-400">
              {a.message}
            </li>
          ))}
        </ul>
      </div>

      {/* Forecasts */}
      <div className="bg-[#161a23] p-4 rounded">
        <h2 className="text-lg font-bold mb-2">Forecasts</h2>
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-[#1f2430]">
              <th className="px-4 py-2 border">Item</th>
              <th className="px-4 py-2 border">Predicted</th>
              <th className="px-4 py-2 border">Confidence</th>
              <th className="px-4 py-2 border">Order Qty</th>
              <th className="px-4 py-2 border">Note</th>
            </tr>
          </thead>
          <tbody>
            {data?.forecasts.map((f, idx) => (
              <tr key={`${f.item}-${idx}`} className="hover:bg-[#1f2430]">
                <td className="px-4 py-2 border">{f.item}</td>
                <td className="px-4 py-2 border">{f.predicted_qty_30d}</td>
                <td className="px-4 py-2 border">{f.confidence}%</td>
                <td className="px-4 py-2 border">{f.orderQty}</td>
                <td className="px-4 py-2 border">{f.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value?: number }) {
  return (
    <div className="bg-[#161a23] p-4 rounded text-center">
      <h3 className="text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-white">{value ?? 0}</p>
    </div>
  );
}
