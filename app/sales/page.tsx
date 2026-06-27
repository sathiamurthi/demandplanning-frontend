"use client";

"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Users, ShoppingBag } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';

const salesData = [
  { week: 'W1', online: 12400, instore: 8200 },
  { week: 'W2', online: 15600, instore: 9100 },
  { week: 'W3', online: 13200, instore: 10400 },
  { week: 'W4', online: 18900, instore: 11200 },
  { week: 'W5', online: 16700, instore: 9800 },
  { week: 'W6', online: 21300, instore: 12600 },
];

const categoryData = [
  { name: 'Electronics', value: 42 },
  { name: 'Accessories', value: 28 },
  { name: 'Peripherals', value: 18 },
  { name: 'Other', value: 12 },
];

const COLORS = ['#6c63ff', '#4ecdc4', '#f7b731', '#ff6b6b'];

const recentSales = [
  { id: '#ORD-8821', customer: 'Alice Johnson', product: 'Smart Watch Pro', amount: '$199.99', date: 'Today, 2:30 PM', status: 'completed' },
  { id: '#ORD-8820', customer: 'Bob Martinez', product: 'Wireless Headphones', amount: '$49.99', date: 'Today, 1:15 PM', status: 'completed' },
  { id: '#ORD-8819', customer: 'Carol White', product: 'USB-C Hub', amount: '$29.99', date: 'Today, 11:40 AM', status: 'pending' },
  { id: '#ORD-8818', customer: 'David Kim', product: 'Mechanical Keyboard', amount: '$89.99', date: 'Yesterday', status: 'completed' },
  { id: '#ORD-8817', customer: 'Eva Chen', product: 'Webcam 4K', amount: '$79.99', date: 'Yesterday', status: 'refunded' },
];

const statusStyle: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  refunded: 'bg-red-500/15 text-red-400',
};

export default function Sales() {
  return (
    <DashboardLayout title="Sales" subtitle="Track your sales performance and revenue channels.">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Monthly Revenue" value="$98,420" change="+15.2%" positive icon={DollarSign} color="bg-[#6c63ff]/20" delay={0} />
          <StatCard label="Total Sales" value="2,841" change="+9.4%" positive icon={ShoppingBag} color="bg-[#4ecdc4]/20" delay={0.1} />
          <StatCard label="New Customers" value="384" change="+22.1%" positive icon={Users} color="bg-[#f7b731]/20" delay={0.2} />
          <StatCard label="Avg. Order Value" value="$34.64" change="+5.3%" positive icon={TrendingUp} color="bg-emerald-500/20" delay={0.3} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#161a23] border border-white/8 rounded-xl p-6"
          >
            <h2 className="font-heading text-base font-semibold text-white mb-1">
              Sales by Channel
            </h2>
            <p className="text-white/40 text-xs mb-6">
              Online vs In-Store weekly comparison
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Line type="monotone" dataKey="online" stroke="#6c63ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="instore" stroke="#4ecdc4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#161a23] border border-white/8 rounded-xl p-6"
          >
            <h2 className="font-heading text-base font-semibold text-white mb-1">
              By Category
            </h2>
            <p className="text-white/40 text-xs mb-4">
              Revenue distribution
            </p>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Legend
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="font-heading text-base font-semibold text-white">
              Recent Sales
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-white/40 text-xs uppercase">Order</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs uppercase hidden sm:table-cell">Customer</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs uppercase hidden md:table-cell">Product</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs uppercase hidden sm:table-cell">Date</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs uppercase">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-3.5 text-[#6c63ff] text-sm font-mono font-medium">
                      {sale.id}
                    </td>
                    <td className="px-6 py-3.5 text-white text-sm hidden sm:table-cell">
                      {sale.customer}
                    </td>
                    <td className="px-6 py-3.5 text-white/60 text-sm hidden md:table-cell">
                      {sale.product}
                    </td>
                    <td className="px-6 py-3.5 text-white font-semibold text-sm">
                      {sale.amount}
                    </td>
                    <td className="px-6 py-3.5 text-white/40 text-xs hidden sm:table-cell">
                      {sale.date}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[sale.status]}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}