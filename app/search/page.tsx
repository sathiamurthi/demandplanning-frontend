"use client";

"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, ClipboardList, TrendingUp, Filter } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
type ResultType = 'product' | 'order' | 'sale';

interface ResultItem {
  type: ResultType;
  title: string;
  subtitle: string;
  icon: any;
}

const allResults: ResultItem[] = [
  { type: 'product', title: 'Wireless Headphones', subtitle: 'SKU: WH-001 · Electronics · 12 in stock', icon: Package },
  { type: 'product', title: 'Smart Watch Pro', subtitle: 'SKU: SW-002 · Electronics · 145 in stock', icon: Package },
  { type: 'order', title: 'Order #ORD-8821', subtitle: 'Alice Johnson · $199.99 · Completed', icon: ClipboardList },
  { type: 'order', title: 'Order #ORD-8820', subtitle: 'Bob Martinez · $49.99 · Completed', icon: ClipboardList },
  { type: 'sale', title: 'USB-C Hub 7-in-1', subtitle: 'SKU: UH-003 · 5 units sold today', icon: TrendingUp },
  { type: 'product', title: 'Mechanical Keyboard', subtitle: 'SKU: MK-004 · Peripherals · 67 in stock', icon: Package },
  { type: 'order', title: 'Order #ORD-8819', subtitle: 'Carol White · $29.99 · Pending', icon: ClipboardList },
];

const typeBadgeColors: Record<ResultType, string> = {
  product: 'bg-[#6c63ff]/15 text-[#6c63ff]',
  order: 'bg-[#4ecdc4]/15 text-[#4ecdc4]',
  sale: 'bg-[#f7b731]/15 text-[#f7b731]',
};

const typeIconColors: Record<ResultType, string> = {
  product: 'text-[#6c63ff]',
  order: 'text-[#4ecdc4]',
  sale: 'text-[#f7b731]',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | ResultType>('all');

  const results = allResults.filter((r) => {
    const matchQuery =
      query === '' ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(query.toLowerCase());

    const matchType = activeType === 'all' || r.type === activeType;

    return matchQuery && matchType;
  });

  return (
    <DashboardLayout title="Search" subtitle="Search across products, orders, and sales records.">
      <div className="space-y-5 max-w-3xl">

        {/* Search Input */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search products, orders, SKUs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#161a23] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/50 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-white/40" />

          {(['all', 'product', 'order', 'sale'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                activeType === t
                  ? 'bg-[#6c63ff] text-white'
                  : 'bg-[#161a23] border border-white/10 text-white/50 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="bg-[#161a23] border border-white/8 rounded-xl p-12 text-center">
              <Search size={36} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm">
                No results found for "<span className="text-white/60">{query}</span>"
              </p>
            </div>
          ) : (
            results.map((r, i) => {
              const Icon = r.icon;

              return (
                <motion.div
                  key={`${r.type}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-[#161a23] border border-white/8 rounded-xl p-4 flex items-center gap-4 hover:border-white/15 hover:bg-[#1a1f2e] cursor-pointer transition-all"
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5`}>
                    <Icon size={16} className={typeIconColors[r.type]} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.title}</p>
                    <p className="text-white/40 text-xs truncate mt-0.5">{r.subtitle}</p>
                  </div>

                  {/* Badge */}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${typeBadgeColors[r.type]}`}>
                    {r.type}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>

        {query === '' && (
          <p className="text-white/25 text-xs text-center pt-2">
            Start typing to search across all records
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}