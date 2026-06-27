"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export default function StatCard({ label, value, change, positive, icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#161a23] border border-white/8 rounded-xl p-5 hover:border-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-black/30"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-white/50 text-xs font-medium mb-1">{label}</p>
      <p className="text-white text-2xl font-bold font-heading">{value}</p>
    </motion.div>
  );
}