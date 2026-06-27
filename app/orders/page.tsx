"use client";

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, Eye } from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";

const orders = [
  { id: "#ORD-8821", customer: "Alice Johnson", email: "alice@example.com", items: 2, total: "$249.98", date: "Jul 1, 2026", status: "completed" },
  { id: "#ORD-8820", customer: "Bob Martinez", email: "bob@example.com", items: 1, total: "$49.99", date: "Jul 1, 2026", status: "completed" },
  { id: "#ORD-8819", customer: "Carol White", email: "carol@example.com", items: 5, total: "$149.95", date: "Jul 1, 2026", status: "pending" },
  { id: "#ORD-8818", customer: "David Kim", email: "david@example.com", items: 1, total: "$89.99", date: "Jun 30, 2026", status: "completed" },
  { id: "#ORD-8817", customer: "Eva Chen", email: "eva@example.com", items: 1, total: "$79.99", date: "Jun 30, 2026", status: "refunded" },
  { id: "#ORD-8816", customer: "Frank Lee", email: "frank@example.com", items: 3, total: "$189.97", date: "Jun 29, 2026", status: "shipped" },
  { id: "#ORD-8815", customer: "Grace Park", email: "grace@example.com", items: 2, total: "$129.98", date: "Jun 29, 2026", status: "processing" },
  { id: "#ORD-8814", customer: "Henry Wu", email: "henry@example.com", items: 4, total: "$319.96", date: "Jun 28, 2026", status: "completed" },
];

const statusStyle: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  refunded: "bg-red-500/15 text-red-400",
  shipped: "bg-blue-500/15 text-blue-400",
  processing: "bg-purple-500/15 text-purple-400",
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" || o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout
      title="Orders"
      subtitle="View and manage all customer orders."
    >
      <div className="space-y-5">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search orders or customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161a23] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white"
            />
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "completed",
              "pending",
              "shipped",
              "processing",
              "refunded",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                  statusFilter === s
                    ? "bg-[#6c63ff] text-white"
                    : "bg-[#161a23] border border-white/10 text-white/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-5 py-3 text-left text-white/40 text-xs">Order ID</th>
                  <th className="px-5 py-3 hidden sm:table-cell text-left text-white/40 text-xs">Customer</th>
                  <th className="px-5 py-3 hidden md:table-cell text-left text-white/40 text-xs">Items</th>
                  <th className="px-5 py-3 text-left text-white/40 text-xs">Total</th>
                  <th className="px-5 py-3 hidden lg:table-cell text-left text-white/40 text-xs">Date</th>
                  <th className="px-5 py-3 text-left text-white/40 text-xs">Status</th>
                  <th className="px-5 py-3 text-right text-white/40 text-xs">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >

                    <td className="px-5 py-4 flex items-center gap-2">
                      <ClipboardList size={14} className="text-white/30" />
                      <span className="text-[#6c63ff] font-mono text-sm">
                        {order.id}
                      </span>
                    </td>

                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-white text-sm">{order.customer}</p>
                      <p className="text-white/30 text-xs">{order.email}</p>
                    </td>

                    <td className="px-5 py-4 hidden md:table-cell text-white/60 text-sm">
                      {order.items} item{order.items > 1 ? "s" : ""}
                    </td>

                    <td className="px-5 py-4 text-white font-semibold text-sm">
                      {order.total}
                    </td>

                    <td className="px-5 py-4 hidden lg:table-cell text-white/40 text-xs">
                      {order.date}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${
                          statusStyle[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center ml-auto">
                        <Eye size={13} />
                      </button>
                    </td>

                  </motion.tr>
                ))}
              </tbody>

            </table>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-white/30 text-sm">
                No orders match your search.
              </div>
            )}

          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}