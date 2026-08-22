"use client";

import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { getTenantId, getStoreId } from "@/lib/utils";
import { Plus, BookOpen } from "lucide-react";

export default function COAPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // new account form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Asset");

  const loadCOA = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>(`/tenants/${getTenantId()}/stores/${getStoreId()}/accounting/coa`);
      setAccounts(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const seedCOA = async () => {
    try {
      await apiPost(`/tenants/${getTenantId()}/stores/${getStoreId()}/accounting/coa/seed`, {});
      loadCOA();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const createAccount = async () => {
    try {
      await apiPost(`/tenants/${getTenantId()}/stores/${getStoreId()}/accounting/coa`, { name, account_type: type });
      setShowForm(false);
      setName("");
      loadCOA();
    } catch (e: any) {
      alert(e.message);
    }
  };

  useEffect(() => { loadCOA(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6"/> Chart of Accounts</h1>
        <div className="flex gap-2">
          <button onClick={seedCOA} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Seed Default Accounts</button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-black text-white rounded-lg text-sm flex items-center gap-2">
            <Plus className="h-4 w-4"/> Add Account
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-xl bg-gray-50 flex gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Account Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-64 px-3 py-2 border rounded-lg" placeholder="e.g. Petty Cash" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-48 px-3 py-2 border rounded-lg bg-white">
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <button onClick={createAccount} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Account Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 font-medium text-gray-500">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{acc.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{acc.account_type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{Number(acc.current_balance).toFixed(2)}</td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No accounts found. Click "Seed Default Accounts" to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
