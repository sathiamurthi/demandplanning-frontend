"use client";

import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { getTenantId, getStoreId } from "@/lib/utils";
import { Plus, ReceiptText, X } from "lucide-react";

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // new journal form
  const [showForm, setShowForm] = useState(false);
  const [voucherType, setVoucherType] = useState("Journal");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [narrative, setNarrative] = useState("");
  const [lines, setLines] = useState([{ account_id: "", debit: 0, credit: 0, narrative: "" }, { account_id: "", debit: 0, credit: 0, narrative: "" }]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jRes, cRes] = await Promise.all([
        apiGet<any>(`/tenants/${getTenantId()}/stores/${getStoreId()}/accounting/journal`),
        apiGet<any>(`/tenants/${getTenantId()}/stores/${getStoreId()}/accounting/coa`)
      ]);
      setEntries(jRes.data || jRes);
      setAccounts(cRes.data || cRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const addLine = () => setLines([...lines, { account_id: "", debit: 0, credit: 0, narrative: "" }]);
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: string, val: any) => {
    const newLines = [...lines];
    (newLines[idx] as any)[field] = val;
    setLines(newLines);
  };

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const submitJournal = async () => {
    if (!isBalanced) return alert("Journal is not balanced!");
    if (lines.some(l => !l.account_id)) return alert("Select an account for all lines");
    
    try {
      await apiPost(`/tenants/${getTenantId()}/stores/${getStoreId()}/accounting/journal`, {
        voucher_type: voucherType,
        entry_date: entryDate,
        narrative,
        lines: lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) }))
      });
      setShowForm(false);
      setLines([{ account_id: "", debit: 0, credit: 0, narrative: "" }, { account_id: "", debit: 0, credit: 0, narrative: "" }]);
      setNarrative("");
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ReceiptText className="h-6 w-6"/> Journal Vouchers</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-black text-white rounded-lg text-sm flex items-center gap-2">
          <Plus className="h-4 w-4"/> New Journal Entry
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 border rounded-xl bg-white shadow-sm">
          <h2 className="font-bold mb-4">Create Journal Entry</h2>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block">Voucher Type</label>
              <select value={voucherType} onChange={e => setVoucherType(e.target.value)} className="w-48 px-3 py-2 border rounded-lg">
                {['Journal', 'Receipt', 'Payment', 'Contra', 'Sales', 'Purchase'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block">Date</label>
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-48 px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 block">Narrative (Memo)</label>
              <input value={narrative} onChange={e => setNarrative(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Description of transaction" />
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Account</th>
                <th className="pb-2">Debit</th>
                <th className="pb-2">Credit</th>
                <th className="pb-2">Narrative</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2">
                    <select value={line.account_id} onChange={e => updateLine(idx, 'account_id', e.target.value)} className="w-full px-2 py-1.5 border rounded">
                      <option value="">Select Account...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" value={line.debit} onChange={e => updateLine(idx, 'debit', e.target.value)} className="w-24 px-2 py-1.5 border rounded" min="0" step="0.01" />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" value={line.credit} onChange={e => updateLine(idx, 'credit', e.target.value)} className="w-24 px-2 py-1.5 border rounded" min="0" step="0.01" />
                  </td>
                  <td className="py-2 pr-2">
                    <input value={line.narrative} onChange={e => updateLine(idx, 'narrative', e.target.value)} className="w-full px-2 py-1.5 border rounded" placeholder="Line memo..." />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeLine(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="h-4 w-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-lg border">
            <button onClick={addLine} className="text-sm font-semibold text-blue-600">+ Add Line</button>
            <div className="flex gap-6 font-mono text-sm font-bold">
              <span className={isBalanced ? "text-gray-700" : "text-red-600"}>Total Debit: {totalDebit.toFixed(2)}</span>
              <span className={isBalanced ? "text-gray-700" : "text-red-600"}>Total Credit: {totalCredit.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
            <button onClick={submitJournal} disabled={!isBalanced} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">Post Journal</button>
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex justify-between items-center mb-3 border-b pb-2">
                <div>
                  <span className="font-bold">{entry.voucher_type} {entry.voucher_no}</span>
                  <span className="text-gray-500 text-xs ml-3">{new Date(entry.entry_date).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-gray-600">{entry.narrative}</div>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {entry.lines?.map((l: any, i: number) => (
                    <tr key={i}>
                      <td className="py-1 w-1/3 font-medium">{l.account_name}</td>
                      <td className="py-1 w-1/4 text-gray-500 text-xs">{l.narrative}</td>
                      <td className="py-1 text-right w-24">{l.debit > 0 ? l.debit.toFixed(2) : ''}</td>
                      <td className="py-1 text-right w-24">{l.credit > 0 ? l.credit.toFixed(2) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {entries.length === 0 && <p className="text-gray-500 text-center py-8">No journal entries found.</p>}
        </div>
      )}
    </div>
  );
}
