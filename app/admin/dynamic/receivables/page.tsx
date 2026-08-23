"use client";
import React, { useState, useEffect, useMemo } from "react";
import { getTenantId, getStoreId } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { Search, FileText } from "lucide-react";

export default function ReceivablesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"pending">("pending");

  useEffect(() => {
    const tId = getTenantId();
    const sId = getStoreId();
    if (!tId || !sId) return;

    apiGet<any>(`/tenants/${tId}/stores/${sId}/sales?limit=5000`)
      .then(res => {
        const data = res.data || res || [];
        setSales(Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const customerBalances = useMemo(() => {
    const map = new Map<string, { customerName: string, totalInvoices: number, pendingBalance: number }>();
    
    for (const sale of sales) {
      const cName = sale.customer_name || sale.customerName || "Unknown Customer";
      if (!map.has(cName)) {
        map.set(cName, { customerName: cName, totalInvoices: 0, pendingBalance: 0 });
      }
      
      const stat = map.get(cName)!;
      stat.totalInvoices++;
      
      if (sale.status && sale.status.toLowerCase() !== "paid") {
        stat.pendingBalance += Number(sale.total_amount || sale.totalAmount || 0);
      }
    }
    
    let result = Array.from(map.values());
    if (filter === "pending") result = result.filter(c => c.pendingBalance > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.customerName.toLowerCase().includes(q));
    }
    result.sort((a, b) => b.pendingBalance - a.pendingBalance);
    return result;
  }, [sales, search, filter]);

  return (
    <div className="flex h-full flex-col theme-content bg-gray-50 p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Balances</h1>
          <p className="text-sm text-gray-500">Track pending payments against sales.</p>
        </div>
        <div className="flex bg-white rounded border">
          <button onClick={() => setFilter("pending")} className={`px-4 py-1.5 text-sm ${filter === "pending" ? "bg-gray-100 font-bold" : "text-gray-500"}`}>Has Pending</button>
          <button onClick={() => setFilter("all")} className={`px-4 py-1.5 text-sm ${filter === "all" ? "bg-gray-100 font-bold" : "text-gray-500"}`}>All</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col flex-1">
        <input type="text" placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border p-2 rounded mb-4 max-w-sm"/>
        <div className="flex-1 overflow-auto">
          {loading ? <div>Loading...</div> : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr><th className="p-4">Customer</th><th className="p-4 text-right">Invoices</th><th className="p-4 text-right">Pending Balance</th></tr>
              </thead>
              <tbody>
                {customerBalances.map(c => (
                  <tr key={c.customerName} className="border-b">
                    <td className="p-4">{c.customerName}</td>
                    <td className="p-4 text-right">{c.totalInvoices}</td>
                    <td className="p-4 text-right text-red-600 font-bold">₹{c.pendingBalance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
