"use client";

"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Globe, Save } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Globe },
] as const;

type TabId = typeof tabs[number]['id'];

type NotificationKey = 'lowStock' | 'newOrders' | 'weeklyReport' | 'systemAlerts';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    lowStock: true,
    newOrders: true,
    weeklyReport: false,
    systemAlerts: true,
  });

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and application preferences.">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
                  activeTab === id
                    ? 'bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 bg-[#161a23] border border-white/8 rounded-xl p-6"
        >

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Profile Information</h2>

              <div className="flex items-center gap-4 pb-5 border-b border-white/8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#4ecdc4] flex items-center justify-center text-white text-xl font-bold">
                  JD
                </div>
                <div>
                  <p className="text-white font-semibold">John Doe</p>
                  <p className="text-white/40 text-sm">Administrator</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'First Name', value: 'John' },
                  { label: 'Last Name', value: 'Doe' },
                  { label: 'Email', value: 'john@company.com' },
                  { label: 'Phone', value: '+1 (555) 000-0000' },
                  { label: 'Company', value: 'Acme Corp' },
                  { label: 'Role', value: 'Administrator' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-white/50 text-xs mb-1.5">
                      {field.label}
                    </label>
                    <input
                      defaultValue={field.value}
                      className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#6c63ff]/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Notification Preferences</h2>

              {[
                { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when items fall below threshold' },
                { key: 'newOrders', label: 'New Orders', desc: 'Receive alerts for incoming orders' },
                { key: 'weeklyReport', label: 'Weekly Reports', desc: 'Automated weekly summary' },
                { key: 'systemAlerts', label: 'System Alerts', desc: 'Critical system notifications' },
              ].map((item) => {
                const key = item.key as NotificationKey;

                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#0d0f14] rounded-lg border border-white/5">
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-white/40 text-xs">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => toggleNotification(key)}
                      role="switch"
                      aria-checked={notifications[key]}
                      className={`relative w-11 h-6 rounded-full transition ${
                        notifications[key] ? 'bg-[#6c63ff]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications[key] ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Security Settings</h2>

              {['Current Password', 'New Password', 'Confirm Password'].map((label) => (
                <div key={label}>
                  <label className="block text-white/50 text-xs mb-1.5">{label}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                  />
                </div>
              ))}

              <button className="bg-[#6c63ff] text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
                <Shield size={15} className="inline mr-2" />
                Update Password
              </button>
            </div>
          )}

          {/* PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Application Preferences</h2>

              {[
                { label: 'Language', options: ['English', 'Spanish', 'French'] },
                { label: 'Timezone', options: ['UTC', 'GMT', 'IST'] },
                { label: 'Currency', options: ['USD', 'EUR', 'INR'] },
                { label: 'Date Format', options: ['MM/DD/YYYY', 'DD/MM/YYYY'] },
              ].map((pref) => (
                <div key={pref.label}>
                  <label className="block text-white/50 text-xs mb-1.5">{pref.label}</label>
                  <select className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white">
                    {pref.options.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}

              <button className="bg-[#6c63ff] text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
                <Save size={15} className="inline mr-2" />
                Save Preferences
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </DashboardLayout>
  );
}