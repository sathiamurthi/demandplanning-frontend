"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Gavel, TrendingUp } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Buyer { id: string; name: string; contact: string; phone: string; channel_preference: string; }
interface Lot { id: string; auction_house: string; lot_number: string; auction_date: string | null; quantity_kg: number; reserve_price: number | null; sold_price: number | null; status: string; }
interface Sale { id: string; channel: string; buyer_name: string | null; quantity_kg: number; price_per_kg: number; total_amount: number; sale_date: string; }
interface SalesReport { by_channel: { channel: string; transactions: number; total_kg: number; total_revenue: number; avg_price_per_kg: number }[]; auction_performance: { lot_number: string; reserve_price: number; sold_price: number; pct_vs_reserve: number | null }[]; }

export default function SalesPage() {
  const [tab, setTab] = useState<"sales" | "auction" | "buyers" | "report">("sales");
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [report, setReport] = useState<SalesReport | null>(null);

  const [buyerForm, setBuyerForm] = useState({ name: "", contact: "", phone: "", channel_preference: "auction" });
  const [lotForm, setLotForm] = useState({ auction_house: "Coonoor", lot_number: "", auction_date: "", quantity_kg: "", reserve_price: "" });
  const [saleForm, setSaleForm] = useState({ channel: "private", buyer_id: "", quantity_kg: "", price_per_kg: "" });

  const load = async () => {
    const [b, l, s] = await Promise.all([
      fetch(teaUrl("/buyers"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/auction-lots"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/sales"), { headers: teaAuthHeaders() }).then(r => r.json()),
    ]);
    if (b.success) setBuyers(b.data);
    if (l.success) setLots(l.data);
    if (s.success) setSales(s.data);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === "report") fetch(teaUrl("/reports/sales"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setReport(d.data)); }, [tab]);

  const addBuyer = async () => {
    if (!buyerForm.name) return;
    await fetch(teaUrl("/buyers"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(buyerForm) });
    setBuyerForm({ name: "", contact: "", phone: "", channel_preference: "auction" }); load();
  };
  const addLot = async () => {
    if (!lotForm.quantity_kg) return;
    await fetch(teaUrl("/auction-lots"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(lotForm) });
    setLotForm({ auction_house: "Coonoor", lot_number: "", auction_date: "", quantity_kg: "", reserve_price: "" }); load();
  };
  const markSold = async (id: string, sold_price: string) => {
    if (!sold_price) return;
    await fetch(teaUrl(`/auction-lots/${id}`), { method: "PUT", headers: teaAuthHeaders(), body: JSON.stringify({ sold_price, status: "sold" }) });
    load();
  };
  const addSale = async () => {
    if (!saleForm.quantity_kg || !saleForm.price_per_kg) return;
    await fetch(teaUrl("/sales"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(saleForm) });
    setSaleForm({ channel: "private", buyer_id: "", quantity_kg: "", price_per_kg: "" }); load();
  };

  const [soldPriceDraft, setSoldPriceDraft] = useState<Record<string, string>>({});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center"><ShoppingCart size={18} className="text-emerald-400" /></div>
        <div><h1 className="text-lg font-bold text-white">Sales & Auction</h1><p className="text-white/40 text-xs">Buyers, auction lots, private sales, and channel performance</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit flex-wrap">
        {([["sales", "Sales"], ["auction", "Auction Lots"], ["buyers", "Buyers"], ["report", "Report"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-green-600/20 text-green-400" : "text-white/40 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "sales" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <select value={saleForm.channel} onChange={e => setSaleForm({ ...saleForm, channel: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {["private", "auction", "export"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={saleForm.buyer_id} onChange={e => setSaleForm({ ...saleForm, buyer_id: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Buyer...</option>
              {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input type="number" placeholder="Qty (kg)" value={saleForm.quantity_kg} onChange={e => setSaleForm({ ...saleForm, quantity_kg: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Price/kg ₹" value={saleForm.price_per_kg} onChange={e => setSaleForm({ ...saleForm, price_per_kg: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={addSale} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> Record Sale</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {sales.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No sales recorded yet.</div> : (
              <table className="w-full"><tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white/50 text-xs">{new Date(s.sale_date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-white text-sm capitalize">{s.channel}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{s.buyer_name || "—"}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{s.quantity_kg} kg @ ₹{s.price_per_kg}</td>
                    <td className="px-4 py-3 text-green-400 text-sm font-medium">₹{s.total_amount}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "auction" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input placeholder="Auction house" value={lotForm.auction_house} onChange={e => setLotForm({ ...lotForm, auction_house: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Lot number" value={lotForm.lot_number} onChange={e => setLotForm({ ...lotForm, lot_number: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="date" value={lotForm.auction_date} onChange={e => setLotForm({ ...lotForm, auction_date: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Qty (kg)" value={lotForm.quantity_kg} onChange={e => setLotForm({ ...lotForm, quantity_kg: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Reserve ₹/kg" value={lotForm.reserve_price} onChange={e => setLotForm({ ...lotForm, reserve_price: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <button onClick={addLot} className="mb-4 flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium px-4 py-2"><Gavel size={14} /> Create Lot</button>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {lots.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No auction lots yet.</div> : (
              <table className="w-full"><tbody>
                {lots.map(l => (
                  <tr key={l.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm">{l.auction_house} {l.lot_number ? `#${l.lot_number}` : ""}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{l.quantity_kg} kg · reserve ₹{l.reserve_price ?? "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${l.status === "sold" ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/60"}`}>{l.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {l.status !== "sold" ? (
                        <div className="flex gap-2 justify-end items-center">
                          <input type="number" placeholder="Sold ₹/kg" value={soldPriceDraft[l.id] || ""} onChange={e => setSoldPriceDraft({ ...soldPriceDraft, [l.id]: e.target.value })} className="w-24 bg-[#0f1218] border border-white/10 rounded-lg px-2 py-1 text-xs text-white" />
                          <button onClick={() => markSold(l.id, soldPriceDraft[l.id])} className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg">Mark Sold</button>
                        </div>
                      ) : <span className="text-white text-sm">₹{l.sold_price}/kg</span>}
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "buyers" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input placeholder="Buyer name" value={buyerForm.name} onChange={e => setBuyerForm({ ...buyerForm, name: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Contact" value={buyerForm.contact} onChange={e => setBuyerForm({ ...buyerForm, contact: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Phone" value={buyerForm.phone} onChange={e => setBuyerForm({ ...buyerForm, phone: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={buyerForm.channel_preference} onChange={e => setBuyerForm({ ...buyerForm, channel_preference: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {["auction", "private", "export"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addBuyer} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {buyers.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No buyers yet.</div> : (
              <table className="w-full"><tbody>
                {buyers.map(b => (
                  <tr key={b.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{b.channel_preference}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{b.contact}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{b.phone}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "report" && report && (
        <div className="space-y-4">
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4">
            <p className="text-white text-sm font-medium mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-green-400" /> Revenue by Channel (last 90 days)</p>
            {report.by_channel.map(c => (
              <div key={c.channel} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/70 capitalize">{c.channel}</span>
                <span className="text-white/50 text-xs">{c.transactions} txns · {c.total_kg} kg · avg ₹{Number(c.avg_price_per_kg).toFixed(2)}/kg</span>
                <span className="text-green-400 font-medium">₹{c.total_revenue}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4">
            <p className="text-white text-sm font-medium mb-3">Auction Performance vs Reserve</p>
            {report.auction_performance.length === 0 ? <p className="text-white/30 text-sm">No sold lots in this period.</p> : report.auction_performance.map((a, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/70">{a.lot_number || "—"}</span>
                <span className="text-white/50 text-xs">reserve ₹{a.reserve_price} → sold ₹{a.sold_price}</span>
                <span className={a.pct_vs_reserve && a.pct_vs_reserve >= 0 ? "text-green-400" : "text-red-400"}>{a.pct_vs_reserve != null ? `${a.pct_vs_reserve}%` : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
