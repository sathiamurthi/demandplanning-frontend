"use client";
import { Activity, Database, RefreshCw, Users, type LucideIcon } from "lucide-react";
import AccountTable from "../components/AccountTable";
import { useState, useEffect } from "react";

type Overview = {
  accounts: number;
  active24h: number;
  active7d: number;
  registered7d: number;
  recentLogins: { id: string; name: string; email: string; logged_in_at: string }[];
};

function authHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ExamHub360SuperAdmin() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/v1/superadmin/data360/overview", { headers: authHeader() });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load ExamHub360 activity");
      setOverview(data.data);
    } catch (err: any) {
      setError(err.message || "Unable to load ExamHub360 activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600/20 rounded-xl flex items-center justify-center">
          <Database className="text-teal-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ExamHub360</h1>
          <p className="text-xs text-gray-500">Accounts and login activity for School and College.</p>
        </div>
      </div>
        <button onClick={loadData} className="p-2 text-gray-500 hover:text-teal-700 border border-gray-200 rounded-lg" title="Refresh activity">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: "Registered Accounts", value: overview?.accounts || 0, icon: Users },
          { label: "Current Users (24h)", value: overview?.active24h || 0, icon: Activity },
          { label: "Active This Week", value: overview?.active7d || 0, icon: Activity },
          { label: "New This Week", value: overview?.registered7d || 0, icon: Users },
        ] as Array<{ label: string; value: number; icon: LucideIcon }>).map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <Icon size={16} className="text-teal-600 mb-2" />
            <p className="text-2xl font-black text-gray-900">{loading ? "-" : value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Recent Login Activity</h3>
        <ul className="space-y-2">
          {overview?.recentLogins.map(login => (
            <li key={login.id} className="text-sm bg-gray-50 px-3 py-2 border border-gray-100 rounded-lg flex items-center justify-between gap-3">
              <span className="text-gray-700 truncate"><strong>{login.name}</strong> <span className="text-gray-400">{login.email}</span></span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(login.logged_in_at).toLocaleString()}</span>
            </li>
          ))}
          {!loading && !overview?.recentLogins.length && <li className="text-xs text-gray-400">No login activity recorded yet.</li>}
        </ul>
      </div>

      <h2 className="font-bold text-gray-900">Registered Accounts</h2>
      <AccountTable
        listUrl="/v1/superadmin/data360/users"
        actionBase="/v1/superadmin/data360/users"
        emptyLabel="No ExamHub360 users yet."
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "purchased_document_quota", label: "Purchased Docs" },
          { key: "created_at", label: "Registered", render: r => new Date(r.created_at).toLocaleDateString("en-IN") },
          { key: "last_login_at", label: "Last Login", render: r => r.last_login_at ? new Date(r.last_login_at).toLocaleString() : "Never" },
        ]}
      />
    </div>
  );
}
