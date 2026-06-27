"use client";


import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface User {
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  lastLogin: string;
}

interface AuditLog {
  action: string;
  user: string;
  time: string;
  type: "info" | "success" | "warning";
}

const users: User[] = [
  { name: "John Doe", email: "john@company.com", role: "Admin", status: "active", lastLogin: "2 min ago" },
  { name: "Sarah Chen", email: "sarah@company.com", role: "Manager", status: "active", lastLogin: "1 hr ago" },
  { name: "Marcus Webb", email: "marcus@company.com", role: "Staff", status: "active", lastLogin: "3 hr ago" },
  { name: "Priya Nair", email: "priya@company.com", role: "Manager", status: "inactive", lastLogin: "2 days ago" },
  { name: "David Kim", email: "david@company.com", role: "Staff", status: "active", lastLogin: "5 hr ago" },
];

const auditLog: AuditLog[] = [
  { action: "Inventory updated", user: "Sarah Chen", time: "2 min ago", type: "info" },
  { action: "Order #ORD-8821 completed", user: "System", time: "15 min ago", type: "success" },
  { action: "Low stock alert triggered", user: "System", time: "1 hr ago", type: "warning" },
  { action: "User login: Marcus Webb", user: "System", time: "3 hr ago", type: "info" },
  { action: "Report generated", user: "John Doe", time: "5 hr ago", type: "info" },
];

const logTypeStyle: Record<string, { icon: any; color: string }> = {
  info: { icon: Activity, color: "text-blue-400" },
  success: { icon: CheckCircle, color: "text-emerald-400" },
  warning: { icon: AlertTriangle, color: "text-yellow-400" },
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">

      {/* System Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: "24", icon: Users, color: "bg-[#6c63ff]/20" },
          { label: "Active Sessions", value: "8", icon: Activity, color: "bg-emerald-500/20" },
          { label: "DB Storage", value: "4.2 GB", icon: Database, color: "bg-[#4ecdc4]/20" },
          { label: "System Status", value: "Healthy", icon: Shield, color: "bg-[#f7b731]/20" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#161a23] border border-white/8 rounded-xl p-5"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={17} className="text-white" />
            </div>
            <p className="text-white/40 text-xs mb-1">{stat.label}</p>
            <p className="text-white font-bold text-xl">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <h2 className="font-semibold text-white">Users</h2>
            <button className="bg-[#6c63ff] hover:bg-[#5a52e0] text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              + Invite User
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {users.map((user) => (
              <div
                key={user.email}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff]/60 to-[#4ecdc4]/60 flex items-center justify-center text-xs font-bold">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </div>

                  <div>
                    <p className="text-white text-sm">{user.name}</p>
                    <p className="text-white/30 text-xs">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white/40 text-xs hidden sm:block">
                    {user.role}
                  </span>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      user.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Audit Log */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white">Audit Log</h2>
          </div>

          <div className="divide-y divide-white/5">
            {auditLog.map((log, i) => {
              const { icon: LogIcon, color } = logTypeStyle[log.type];

              return (
                <div
                  key={i}
                  className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/5"
                >
                  <LogIcon size={15} className={`${color} mt-0.5`} />

                  <div className="flex-1">
                    <p className="text-white text-sm">{log.action}</p>
                    <p className="text-white/30 text-xs">{log.user}</p>
                  </div>

                  <div className="flex items-center gap-1 text-white/30 text-xs">
                    <Clock size={11} />
                    {log.time}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
