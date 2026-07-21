"use client";

import { useState, useEffect } from "react";
import { Wrench, Plus, Sparkles, Building2 } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Machine { id: string; name: string; type: string; last_service_date: string | null; status: string; }
interface Vendor { id: string; name: string; contact: string; phone: string; category: string; }
interface Ticket { id: string; machine_id: string; machine_name: string; issue: string; status: string; assigned_to: string; cost: number | null; }
interface Quote { id: string; vendor_id: string; vendor_name: string; amount: number; delivery_days: number | null; ai_recommended: boolean; }

export default function MachineryPage() {
  const [tab, setTab] = useState<"machines" | "vendors" | "tickets">("machines");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quotesFor, setQuotesFor] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const [machineForm, setMachineForm] = useState({ name: "", type: "roller" });
  const [vendorForm, setVendorForm] = useState({ name: "", contact: "", phone: "", category: "spares" });
  const [ticketForm, setTicketForm] = useState({ machine_id: "", issue: "" });
  const [quoteForm, setQuoteForm] = useState({ vendor_id: "", amount: "", delivery_days: "" });

  const load = async () => {
    const [m, v, t] = await Promise.all([
      fetch(teaUrl("/machines"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/vendors"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/maintenance-tickets"), { headers: teaAuthHeaders() }).then(r => r.json()),
    ]);
    if (m.success) setMachines(m.data);
    if (v.success) setVendors(v.data);
    if (t.success) setTickets(t.data);
  };
  useEffect(() => { load(); }, []);

  const addMachine = async () => {
    if (!machineForm.name) return;
    await fetch(teaUrl("/machines"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(machineForm) });
    setMachineForm({ name: "", type: "roller" }); load();
  };
  const addVendor = async () => {
    if (!vendorForm.name) return;
    await fetch(teaUrl("/vendors"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(vendorForm) });
    setVendorForm({ name: "", contact: "", phone: "", category: "spares" }); load();
  };
  const addTicket = async () => {
    if (!ticketForm.machine_id || !ticketForm.issue) return;
    await fetch(teaUrl("/maintenance-tickets"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(ticketForm) });
    setTicketForm({ machine_id: "", issue: "" }); load();
  };
  const closeTicket = async (id: string) => {
    await fetch(teaUrl(`/maintenance-tickets/${id}`), { method: "PUT", headers: teaAuthHeaders(), body: JSON.stringify({ status: "closed" }) });
    load();
  };
  const openQuotes = async (ticketId: string) => {
    setQuotesFor(ticketId); setRecommendation(null);
    const r = await fetch(teaUrl(`/maintenance-tickets/${ticketId}/quotes`), { headers: teaAuthHeaders() }).then(r => r.json());
    if (r.success) setQuotes(r.data);
  };
  const addQuote = async () => {
    if (!quotesFor || !quoteForm.vendor_id || !quoteForm.amount) return;
    await fetch(teaUrl(`/maintenance-tickets/${quotesFor}/quotes`), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(quoteForm) });
    setQuoteForm({ vendor_id: "", amount: "", delivery_days: "" });
    openQuotes(quotesFor);
  };
  const getRecommendation = async () => {
    if (!quotesFor) return;
    const r = await fetch(teaUrl(`/ai/vendor-recommendation/${quotesFor}`), { method: "POST", headers: teaAuthHeaders() }).then(r => r.json());
    if (r.success) { setRecommendation(r.data.reasoning); openQuotes(quotesFor); }
    else setRecommendation(r.error || "Could not get a recommendation.");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 rounded-xl flex items-center justify-center shadow-sm shadow-orange-950/20"><Wrench size={18} className="text-orange-400" /></div>
        <div><h1 className="text-xl font-bold text-white tracking-tight">Machinery & Vendors</h1><p className="text-white/40 text-xs">Rollers, driers, sorters — service tickets and vendor quote comparison</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-1 w-fit">
        {([["machines", "Machines"], ["vendors", "Vendors"], ["tickets", "Service Tickets"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-gradient-to-r from-green-600/25 to-emerald-600/25 text-green-300 border border-green-500/30" : "text-white/40 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "machines" && (
        <>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input placeholder="Machine name" value={machineForm.name} onChange={e => setMachineForm({ ...machineForm, name: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <select value={machineForm.type} onChange={e => setMachineForm({ ...machineForm, type: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white">
              {["roller", "drier", "sorter", "ctc", "withering_trough", "other"].map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
            <button onClick={addMachine} className="flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-950/40 transition-all text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
          </div>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
            {machines.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No machines registered yet.</div> : (
              <table className="w-full"><tbody>
                {machines.map(m => (
                  <tr key={m.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{m.type?.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">Last service: {m.last_service_date || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${m.status === "needs_service" ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "vendors" && (
        <>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input placeholder="Vendor name" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <input placeholder="Contact" value={vendorForm.contact} onChange={e => setVendorForm({ ...vendorForm, contact: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <input placeholder="Phone" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <select value={vendorForm.category} onChange={e => setVendorForm({ ...vendorForm, category: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white">
              {["spares", "electrical", "mechanical", "civil", "other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addVendor} className="flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-950/40 transition-all text-white rounded-lg text-sm font-medium"><Building2 size={14} /> Add</button>
          </div>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
            {vendors.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No vendors yet.</div> : (
              <table className="w-full"><tbody>
                {vendors.map(v => (
                  <tr key={v.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm font-medium">{v.name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{v.category}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{v.contact}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{v.phone}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "tickets" && (
        <>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select value={ticketForm.machine_id} onChange={e => setTicketForm({ ...ticketForm, machine_id: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white">
              <option value="">Machine...</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input placeholder="Issue description" value={ticketForm.issue} onChange={e => setTicketForm({ ...ticketForm, issue: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <button onClick={addTicket} className="flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-950/40 transition-all text-white rounded-lg text-sm font-medium"><Plus size={14} /> Raise Ticket</button>
          </div>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden mb-4">
            {tickets.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No maintenance tickets yet.</div> : (
              <table className="w-full"><tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm">{t.machine_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{t.issue}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${t.status === "closed" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>{t.status}</span></td>
                    <td className="px-4 py-3 text-right flex gap-2 justify-end">
                      <button onClick={() => openQuotes(t.id)} className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg">Quotes</button>
                      {t.status !== "closed" && <button onClick={() => closeTicket(t.id)} className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg">Close</button>}
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>

          {quotesFor && (
            <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-medium">Vendor Quotes</p>
                <button onClick={getRecommendation} className="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-600/25 to-fuchsia-600/25 hover:from-purple-500/30 hover:to-fuchsia-500/30 text-purple-200 border border-purple-500/30 px-3 py-1.5 rounded-lg"><Sparkles size={12} /> AI Recommend</button>
              </div>
              {recommendation && <p className="text-xs text-purple-300 bg-purple-500/10 rounded-lg p-2 mb-3">{recommendation}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <select value={quoteForm.vendor_id} onChange={e => setQuoteForm({ ...quoteForm, vendor_id: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white">
                  <option value="">Vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <input type="number" placeholder="Amount ₹" value={quoteForm.amount} onChange={e => setQuoteForm({ ...quoteForm, amount: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
                <input type="number" placeholder="Delivery (days)" value={quoteForm.delivery_days} onChange={e => setQuoteForm({ ...quoteForm, delivery_days: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
                <button onClick={addQuote} className="flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-950/40 transition-all text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add Quote</button>
              </div>
              {quotes.map(q => (
                <div key={q.id} className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${q.ai_recommended ? "bg-green-500/10 border border-green-500/30" : "bg-white/5"}`}>
                  <span className="text-white text-sm">{q.vendor_name} {q.ai_recommended && <span className="text-green-400 text-xs ml-1">★ AI pick</span>}</span>
                  <span className="text-white/50 text-xs">₹{q.amount} · {q.delivery_days ?? "?"} days</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
