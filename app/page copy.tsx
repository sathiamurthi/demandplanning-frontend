"use client";

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Zap,
  BarChart3,
  Package,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
} from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live dashboards with demand forecasting and trend analysis across all product lines.', color: 'bg-[#6c63ff]/20 text-[#6c63ff]' },
  { icon: Package, title: 'Smart Inventory', desc: 'Automated stock tracking with low-stock alerts and reorder point optimization.', color: 'bg-[#4ecdc4]/20 text-[#4ecdc4]' },
  { icon: TrendingUp, title: 'Sales Intelligence', desc: 'Deep sales insights with cohort analysis, revenue attribution, and growth metrics.', color: 'bg-[#f7b731]/20 text-[#f7b731]' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Granular permissions for admins, managers, and staff with full audit trails.', color: 'bg-[#ff6b6b]/20 text-[#ff6b6b]' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Operations Director', company: 'RetailCo', text: 'DemandGenius cut our stockouts by 40% in the first quarter.', rating: 5 },
  { name: 'Marcus Webb', role: 'Supply Chain Manager', company: 'DistributeX', text: 'Inventory tools are best-in-class.', rating: 5 },
  { name: 'Priya Nair', role: 'CEO', company: 'ShopSmart', text: 'Real-time visibility across warehouses.', rating: 5 },
];

export default function HomeCopy() {
  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="relative max-w-4xl mx-auto px-6 text-center py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-6">
              Smarter Inventory
            </h1>

            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="bg-[#6c63ff] px-6 py-3 rounded-lg"
              >
                Get Started
              </Link>

              <Link
                href="/login"
                className="border border-white/20 px-6 py-3 rounded-lg"
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="grid grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 border border-white/10 rounded-xl">
              <f.icon />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}