"use client";
import { Activity, Database, RefreshCw, Users } from "lucide-react";
import AccountTable from "../components/AccountTable";
import { useState, useEffect } from "react";

type Overview = {
  accounts: number;
  active24h: number;
  active7d: number;
  registered7d: number;
  recentLogins: { id: string; name: string; email: string; logged_in_at: string }[];
};

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${token}` };
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
        {[
          ["Registered Accounts", overview?.accounts || 0, Users],
          ["Current Users (24h)", overview?.active24h || 0, Activity],
          ["Active This Week", overview?.active7d || 0, Activity],
          ["New This Week", overview?.registered7d || 0, Users],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof Users;
          return <div key={label as string} className="bg-white border border-gray-200 rounded-xl p-4">
            <StatIcon size={16} className="text-teal-600 mb-2" />
            <p className="text-2xl font-black text-gray-900">{loading ? "-" : value}</p>
            <p className="text-xs text-gray-500 mt-1">{label as string}</p>
          </div>;
        })}
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
