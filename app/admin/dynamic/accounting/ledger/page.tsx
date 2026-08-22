"use client";

import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { getTenantId, getStoreId } from "@/lib/utils";
import { Settings2 } from "lucide-react";

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const cRes = await apiGet<any>(`/tenants/${getTenantId()}/stores/${getStoreId()}/accounting/coa`);
      setAccounts(cRes.data || cRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings2 className="h-6 w-6"/> Ledger Report</h1>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-700">Account Balances (Trial Balance)</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Account</th>
                <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Debit Balance</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map(acc => {
                const isDebit = ['Asset', 'Expense'].includes(acc.account_type);
                const bal = Number(acc.current_balance);
                return (
                  <tr key={acc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{acc.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{acc.account_type}</td>
                    <td className="px-4 py-3 font-mono text-right">{isDebit && bal > 0 ? bal.toFixed(2) : (isDebit === false && bal < 0 ? Math.abs(bal).toFixed(2) : '')}</td>
                    <td className="px-4 py-3 font-mono text-right">{!isDebit && bal > 0 ? bal.toFixed(2) : (isDebit === true && bal < 0 ? Math.abs(bal).toFixed(2) : '')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
