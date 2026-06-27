"use client";
import { useState } from "react";
import Tenants from "./tenants";
import Users from "./users/users";
import Permissions from "./permissions";
import Notifications from "./notifications";
import Messages from "./messages";
import Subscriptions from "./subscriptions";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("tenants");

  const tabs = [
    { key: "tenants", label: "Tenants", component: <Tenants /> },
    { key: "users", label: "Users", component: <Users /> },
    { key: "permissions", label: "Permissions", component: <Permissions /> },
    { key: "notifications", label: "Notifications", component: <Notifications /> },
    { key: "messages", label: "Messages", component: <Messages /> },
    { key: "subscriptions", label: "Subscriptions", component: <Subscriptions /> },
  ];

  return (
    <div>
      <div className="flex gap-4 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded ${activeTab === t.key ? "bg-[#6c63ff]" : "bg-[#161a23]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.find(t => t.key === activeTab)?.component}
    </div>
  );
}
