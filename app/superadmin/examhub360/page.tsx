"use client";
import { Database, Settings, Save, Loader2 } from "lucide-react";
import AccountTable from "../components/AccountTable";
import { useState, useEffect } from "react";

export default function ExamHub360SuperAdmin() {
  const [config, setConfig] = useState({ tier: "free", enableQuestionBank: true, enableDemoMode: true });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<{email: string, isPaid: boolean, hasQbAccess: boolean}[]>([]);
  const [logs, setLogs] = useState<{id: string, name: string, created_at: string}[]>([]);
  const [adminNewPaidUser, setAdminNewPaidUser] = useState("");

  const loadData = () => {
    fetch("/api/examhub360/config")
      .then(r => r.json())
      .then(d => { if (d.success) setConfig(d.data); })
      .catch(e => console.error("Failed to load config", e));
      
    fetch("/api/examhub360/users")
      .then(r => r.json())
      .then(d => { if (d.success) setUsers(d.data); })
      .catch(e => console.error("Failed to load users", e));
      
    fetch("/api/examhub360/logs")
      .then(r => r.json())
      .then(d => { if (d.success) setLogs(d.data); })
      .catch(e => console.error("Failed to load logs", e));
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch("/api/examhub360/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      alert("Global configuration saved successfully!");
    } catch(e) {
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };
  
  const updateUser = async (email: string, isPaid: boolean, hasQbAccess: boolean) => {
    try {
      await fetch("/api/examhub360/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isPaid, hasQbAccess })
      });
      loadData();
    } catch(e) {
      alert("Failed to update user.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600/20 rounded-xl flex items-center justify-center">
          <Database className="text-teal-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ExamHub360</h1>
          <p className="text-xs text-gray-500">Manage users and global platform configurations.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-gray-500" /> Global Platform Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">Platform Tier</label>
            <select value={config.tier} onChange={e => setConfig({ ...config, tier: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400">
              <option value="free">Free (Open Access)</option>
              <option value="paid">Paid (Requires Subscription)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">Question Bank Module</label>
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer mt-2">
              <input type="checkbox" checked={config.enableQuestionBank} onChange={e => setConfig({ ...config, enableQuestionBank: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
              Enable Question Bank UI
            </label>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">Demo Operator Mode</label>
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer mt-2">
              <input type="checkbox" checked={config.enableDemoMode} onChange={e => setConfig({ ...config, enableDemoMode: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
              Enable Demo Mode
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={saveConfig} disabled={saving} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Configuration
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">User Access Tracking (PostgreSQL)</h3>
        <div className="flex gap-2 mb-4">
          <input value={adminNewPaidUser} onChange={e => setAdminNewPaidUser(e.target.value)} placeholder="user@email.com" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-400" />
          <button 
            onClick={() => {
              if (!adminNewPaidUser) return;
              updateUser(adminNewPaidUser, false, false);
              setAdminNewPaidUser("");
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition"
          >
            Add User
          </button>
        </div>
        <ul className="space-y-2">
          {users.map(u => {
            const isPaid = u.isPaid;
            const hasQb = u.hasQbAccess;
            return (
              <li key={u.email} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 flex-wrap gap-2">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900 font-bold">{u.email}</span>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isPaid ? 'bg-teal-100 text-teal-800' : 'bg-gray-200 text-gray-500'}`}>{isPaid ? 'Premium Tier' : 'Free Tier'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${hasQb ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-500'}`}>{hasQb ? 'QB Access' : 'No QB Access'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateUser(u.email, !isPaid, hasQb)}
                    className={`text-xs font-bold px-3 py-1.5 border rounded shadow-sm ${isPaid ? 'text-red-600 border-red-200 bg-white hover:bg-red-50' : 'text-teal-700 border-teal-200 bg-white hover:bg-teal-50'}`}
                  >
                    {isPaid ? 'Revoke Paid' : 'Make Paid'}
                  </button>
                  <button 
                    onClick={() => updateUser(u.email, isPaid, !hasQb)}
                    className={`text-xs font-bold px-3 py-1.5 border rounded shadow-sm ${hasQb ? 'text-red-600 border-red-200 bg-white hover:bg-red-50' : 'text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50'}`}
                  >
                    {hasQb ? 'Revoke QB' : 'Enable QB'}
                  </button>
                </div>
              </li>
            );
          })}
          {users.length === 0 && <li className="text-xs text-gray-400 py-2">No users found in database.</li>}
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Audit Logs & Login Activity</h3>
        <ul className="space-y-2">
          {logs.map(log => (
            <li key={log.id} className="text-sm bg-gray-50 px-3 py-2 border border-gray-100 rounded-lg flex items-center justify-between">
              <span className="text-gray-700">{log.name}</span>
              <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
            </li>
          ))}
          {logs.length === 0 && <li className="text-xs text-gray-400">No recent activity.</li>}
        </ul>
      </div>

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
        ]}
      />
    </div>
  );
}
