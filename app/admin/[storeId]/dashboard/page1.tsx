"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { getTenantId } from "@/lib/utils";

type DashboardData = {
  totalItems: number;
  stockValue: number;
  lowStock: number;
  todaySales: number;
  salesTrend: { day: string; total: number }[];
  lowStockItems: { name: string; current_stock: number }[];
  alerts: { message: string; severity: string }[];
  forecast: { name: string; predicted_qty_30d: number }[];
};

type DashboardApiResponse = {
  success: boolean;
  data: Partial<DashboardData>;
};

const emptyDashboard: DashboardData = {
  totalItems: 0,
  stockValue: 0,
  lowStock: 0,
  todaySales: 0,
  salesTrend: [],
  lowStockItems: [],
  alerts: [],
  forecast: [],
};

export default function DashboardPage1({ storeId }: { storeId: string }){
  const params = useParams();
  storeId = storeId || params.storeId as string;
  const tenantId = getTenantId();

  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId || !tenantId) return;

    async function load() {
      setLoading(true);

      try {
        const res = await apiGet<DashboardApiResponse>(
          `/tenants/${tenantId}/stores/${storeId}/dashboard`
        );

        setData({
          totalItems: Number(res?.data?.totalItems ?? 0),
          stockValue: Number(res?.data?.stockValue ?? 0),
          lowStock: Number(res?.data?.lowStock ?? 0),
          todaySales: Number(res?.data?.todaySales ?? 0),
          salesTrend: res?.data?.salesTrend ?? [],
          lowStockItems: res?.data?.lowStockItems ?? [],
          alerts: res?.data?.alerts ?? [],
          forecast: res?.data?.forecast ?? [],
        });
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setData(emptyDashboard);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [storeId, tenantId]);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Store Dashboard</h1>
        <p className="text-sm text-gray-500">
          Real-time insights for store: {storeId}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Items" value={data.totalItems} />
        <Card title="Stock Value" value={`₹ ${data.stockValue}`} />
        <Card title="Low Stock" value={data.lowStock} />
        <Card title="Today Sales" value={`₹ ${data.todaySales}`} />
      </div>

      {/* ALERTS */}
      <Section title="AI Alerts">
        {(data?.alerts ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No alerts 🎉</p>
        ) : (
          <div className="space-y-2">
            {(data?.alerts ?? []).map((a, i) => (
              <div
                key={i}
                className={`p-2 rounded border text-sm ${
                  a.severity === "critical"
                    ? "border-red-500 text-red-600"
                    : a.severity === "warning"
                    ? "border-yellow-500 text-yellow-600"
                    : "border-gray-300"
                }`}
              >
                {a.message}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* LOW STOCK */}
      <Section title="Low Stock Items">
        {(data?.lowStockItems ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">All items are healthy 🎉</p>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {(data?.lowStockItems ?? []).map((item, i) => (
              <li key={i}>
                {item.name} — <b>{item.current_stock}</b>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* FORECAST */}
      <Section title="AI Forecast (30 Days)">
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          {(data?.forecast ?? []).map((f, i) => (
            <div key={i} className="p-2 border rounded">
              <div className="font-medium">{f.name}</div>
              <div className="text-gray-500">
                Predicted: {f.predicted_qty_30d} units
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SALES TREND */}
      <Section title="Sales Trend">
        <div className="space-y-1 text-sm">
          {(data?.salesTrend ?? []).map((s, i) => (
            <div key={i} className="flex justify-between border-b py-1">
              <span>{s.day}</span>
              <span>₹ {s.total}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="p-4 bg-white border rounded shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-white border rounded">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}