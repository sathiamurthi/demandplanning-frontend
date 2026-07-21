"use client";

import { useState, useEffect } from "react";
import { Boxes, Plus, PackageCheck, AlertTriangle } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface StockItem { id: string; name: string; category: string; unit: string; current_qty: number; reorder_level: number; needs_reorder?: boolean; pending_indents?: number; }
interface Indent { id: string; stock_item_id: string; stock_item_name: string; unit: string; requested_by: string; quantity: number; status: string; indent_date: string; }

export default function InventoryPage() {
  const [tab, setTab] = useState<"stock" | "indents">("stock");
  const [items, setItems] = useState<StockItem[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);

  const [itemForm, setItemForm] = useState({ name: "", category: "packaging", unit: "kg", current_qty: "", reorder_level: "" });
  const [indentForm, setIndentForm] = useState({ stock_item_id: "", requested_by: "", quantity: "" });
  const [issueQty, setIssueQty] = useState<Record<string, string>>({});

  const loadStock = () => fetch(teaUrl("/reports/inventory"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setItems(d.data));
  const loadIndents = () => fetch(teaUrl("/indents"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setIndents(d.data));

  useEffect(() => { loadStock(); loadIndents(); }, []);

  const addItem = async () => {
    if (!itemForm.name) return;
    await fetch(teaUrl("/stock-items"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(itemForm) });
    setItemForm({ name: "", category: "packaging", unit: "kg", current_qty: "", reorder_level: "" });
    loadStock();
  };
  const addIndent = async () => {
    if (!indentForm.stock_item_id || !indentForm.quantity) return;
    await fetch(teaUrl("/indents"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(indentForm) });
    setIndentForm({ stock_item_id: "", requested_by: "", quantity: "" });
    loadIndents();
  };
  const setIndentStatus = async (id: string, status: string) => {
    await fetch(teaUrl(`/indents/${id}`), { method: "PUT", headers: teaAuthHeaders(), body: JSON.stringify({ status }) });
    loadIndents();
  };
  const issueIndent = async (id: string) => {
    const qty = issueQty[id];
    if (!qty) return;
    await fetch(teaUrl(`/indents/${id}/issue`), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify({ issued_qty: qty }) });
    loadIndents(); loadStock();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-cyan-500/10 rounded-xl flex items-center justify-center"><Boxes size={18} className="text-cyan-400" /></div>
        <div><h1 className="text-lg font-bold text-white">Inventory</h1><p className="text-white/40 text-xs">Packaging, chemicals, spares — indent → approval → store issue</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit">
        {([["stock", "Stock Items"], ["indents", "Indents"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-green-600/20 text-green-400" : "text-white/40 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "stock" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input placeholder="Item name" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {["packaging", "chemicals", "spares", "stationery", "other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Current qty" value={itemForm.current_qty} onChange={e => setItemForm({ ...itemForm, current_qty: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Reorder level" value={itemForm.reorder_level} onChange={e => setItemForm({ ...itemForm, reorder_level: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={addItem} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {items.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No stock items yet.</div> : (
              <table className="w-full"><tbody>
                {items.map(i => (
                  <tr key={i.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{i.category}</td>
                    <td className="px-4 py-3 text-white text-sm">{i.current_qty} {i.unit}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">reorder @ {i.reorder_level}</td>
                    <td className="px-4 py-3">
                      {i.needs_reorder && <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle size={12} /> Reorder needed</span>}
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "indents" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={indentForm.stock_item_id} onChange={e => setIndentForm({ ...indentForm, stock_item_id: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Item...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input placeholder="Requested by" value={indentForm.requested_by} onChange={e => setIndentForm({ ...indentForm, requested_by: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Quantity" value={indentForm.quantity} onChange={e => setIndentForm({ ...indentForm, quantity: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={addIndent} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> Raise Indent</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {indents.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No indents yet.</div> : (
              <table className="w-full"><tbody>
                {indents.map(i => (
                  <tr key={i.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm">{i.stock_item_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{i.quantity} {i.unit} · {i.requested_by || "—"}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/60 capitalize">{i.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {i.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setIndentStatus(i.id, "approved")} className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg">Approve</button>
                          <button onClick={() => setIndentStatus(i.id, "rejected")} className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg">Reject</button>
                        </div>
                      )}
                      {i.status === "approved" && (
                        <div className="flex gap-2 justify-end items-center">
                          <input type="number" placeholder="Issue qty" value={issueQty[i.id] || ""} onChange={e => setIssueQty({ ...issueQty, [i.id]: e.target.value })} className="w-24 bg-[#0f1218] border border-white/10 rounded-lg px-2 py-1 text-xs text-white" />
                          <button onClick={() => issueIndent(i.id)} className="flex items-center gap-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg"><PackageCheck size={12} /> Issue</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
