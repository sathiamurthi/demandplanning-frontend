"use client";

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";

const inventoryItems = [
  { id: 1, name: "Wireless Headphones", sku: "WH-001", category: "Electronics", stock: 12, price: "$49.99", status: "critical" },
  { id: 2, name: "Smart Watch Pro", sku: "SW-002", category: "Electronics", stock: 145, price: "$199.99", status: "good" },
  { id: 3, name: "USB-C Hub 7-in-1", sku: "UH-003", category: "Accessories", stock: 28, price: "$29.99", status: "warning" },
  { id: 4, name: "Mechanical Keyboard", sku: "MK-004", category: "Peripherals", stock: 67, price: "$89.99", status: "good" },
  { id: 5, name: "Webcam 4K", sku: "WC-005", category: "Electronics", stock: 35, price: "$79.99", status: "warning" },
  { id: 6, name: "Laptop Stand", sku: "LS-006", category: "Accessories", stock: 210, price: "$34.99", status: "good" },
  { id: 7, name: "Noise Cancelling Earbuds", sku: "NE-007", category: "Electronics", stock: 8, price: "$129.99", status: "critical" },
  { id: 8, name: "Wireless Mouse", sku: "WM-008", category: "Peripherals", stock: 92, price: "$39.99", status: "good" },
];

const statusConfig: Record<
  string,
  { label: string; class: string }
> = {
  good: { label: "In Stock", class: "bg-emerald-500/15 text-emerald-400" },
  warning: { label: "Low Stock", class: "bg-yellow-500/15 text-yellow-400" },
  critical: { label: "Critical", class: "bg-red-500/15 text-red-400" },
};

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = inventoryItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());

    const matchFilter = filter === "all" || item.status === filter;

    return matchSearch && matchFilter;
  });

  return (
    <DashboardLayout title="Inventory" subtitle="Manage your product stock levels and SKUs.">

      <div className="space-y-5">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">

          <div className="flex flex-col sm:flex-row gap-3 flex-1">

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#161a23] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-white/40" />

              {["all", "good", "warning", "critical"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                    filter === f
                      ? "bg-[#6c63ff] text-white"
                      : "bg-[#161a23] border border-white/10 text-white/50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Add button */}
          <button className="flex items-center gap-2 bg-[#6c63ff] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            <Plus size={16} /> Add Item
          </button>

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
                  <th className="px-5 py-3 text-left text-white/40 text-xs">Product</th>
                  <th className="px-5 py-3 text-left text-white/40 text-xs hidden sm:table-cell">SKU</th>
                  <th className="px-5 py-3 text-left text-white/40 text-xs hidden md:table-cell">Category</th>
                  <th className="px-5 py-3 text-left text-white/40 text-xs">Stock</th>
                  <th className="px-5 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Price</th>
                  <th className="px-5 py-3 text-left text-white/40 text-xs">Status</th>
                  <th className="px-5 py-3 text-right text-white/40 text-xs">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item, i) => {
                  const status = statusConfig[item.status];

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-5 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#6c63ff]/15 rounded-lg flex items-center justify-center">
                          <Package size={14} className="text-[#6c63ff]" />
                        </div>
                        <span className="text-white text-sm">{item.name}</span>
                      </td>

                      <td className="px-5 py-4 hidden sm:table-cell text-white/40 text-xs font-mono">
                        {item.sku}
                      </td>

                      <td className="px-5 py-4 hidden md:table-cell text-white/60 text-sm">
                        {item.category}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {item.status !== "good" && (
                            <AlertTriangle
                              size={13}
                              className={
                                item.status === "critical"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }
                            />
                          )}
                          <span className="text-white text-sm font-semibold">
                            {item.stock}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 hidden sm:table-cell text-white text-sm">
                        {item.price}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${status.class}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center">
                            <Edit size={13} />
                          </button>
                          <button className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>

            </table>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-white/30 text-sm">
                No items match your search.
              </div>
            )}

          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}