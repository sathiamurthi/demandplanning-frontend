"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Trash2, Search, X, ShoppingCart, BarChart2,
  TrendingUp, Package, Download,
  CheckCircle2, AlertTriangle, Loader2, RefreshCw,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────
function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}
function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}
function fmtINR(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v);
}
function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }

// ── types ─────────────────────────────────────────────────────
interface StoreItem {
  id: string; name: string; sku: string | null; brand: string | null;
  selling_price: string | null; primary_unit_id: string | null;
  unit_symbol: string | null; current_stock: string; gst_rate: string;
  expiry_date: string | null;
  discount_type?: string | null;
  discount_value?: string | null;
}
interface LineItem { itemId: string; name: string; unitPrice: number; qty: number; discountPct: number; unitId: string; unitSymbol: string; stock: number; }
interface Sale { id: string; sale_number: string; sale_date: string; customer_name: string | null; total_amount: number; payment_method: string | null; item_count: number; }
interface SummaryPeriod { period: string; sale_count: number; total_revenue: string; avg_sale_value: string; }
interface TopItem { id: string; name: string; qty_sold: string; revenue: string; }

// ── sub-components ────────────────────────────────────────────
function ItemSearch({ items, onAdd }: { items: StoreItem[]; onAdd: (i: StoreItem) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = q.trim().length > 0
    ? items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || (i.sku || "").toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search item by name or SKU…"
          className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
        />
        {q && <button onClick={() => { setQ(""); setOpen(false); }}><X size={13} className="text-gray-300" /></button>}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {filtered.map(item => {
            const exp = item.expiry_date ? new Date(item.expiry_date) : null;
            const expired = exp ? exp < new Date() : false;
            const nearExp = exp && !expired ? (exp.getTime() - Date.now()) / 86400000 < 30 : false;
            return (
              <button key={item.id} onClick={() => { onAdd(item); setQ(""); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 text-left border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}
                    {item.brand && <span className="text-gray-400 font-normal text-xs ml-1">{item.brand}</span>}
                  </p>
                  <p className="text-xs text-gray-400">{item.sku || "No SKU"} · Stock: {item.current_stock} {item.unit_symbol || ""}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-gray-900">{fmtINR(parseFloat(item.selling_price || "0"))}</p>
                  {expired && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Expired</span>}
                  {nearExp && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">Near exp</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function SalePage() {
  const params = useParams();
  const storeId = params?.storeId as string;
  const [tab, setTab] = useState<"sale" | "report">("sale");

  // ── Sale state ──
  const [items, setItems] = useState<StoreItem[]>([]);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [saleDate, setSaleDate] = useState(today());
  const [payMethod, setPayMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");

  // ── Report state ──
  const [reportRange, setReportRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [customFrom, setCustomFrom] = useState(daysAgo(7));
  const [customTo, setCustomTo] = useState(today());
  const [summary, setSummary] = useState<{ periods: SummaryPeriod[]; totals: any; topItems: TopItem[] } | null>(null);
  const [reportSales, setReportSales] = useState<Sale[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // ── Load items ──
  useEffect(() => {
    const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") || "" : "";
    const url = tenantId 
      ? `/v1/tenants/${tenantId}/stores/${storeId}/items` 
      : `/v1/stores/${storeId}/items`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json()).then(d => { if (d.success || Array.isArray(d.data)) setItems(d.data || []); }).catch(() => {});
    loadTodaySales();
  }, [storeId]);

  const loadTodaySales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const r = await fetch(`/v1/stores/${storeId}/sales?from=${today()}T00:00:00&to=${today()}T23:59:59&limit=50`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setTodaySales(d.data?.items || []);
    } catch {}
    setLoadingSales(false);
  }, [storeId]);

  // ── Add item to line ──
  const addLine = (item: StoreItem) => {
    const existing = lines.findIndex(l => l.itemId === item.id);
    const discountVal = parseFloat(item.discount_value || "0");
    let discountPct = 0;
    if (item.discount_type === "percentage" && discountVal > 0) {
      discountPct = discountVal;
    } else if (item.discount_type === "fixed" && discountVal > 0) {
      const price = parseFloat(item.selling_price || "0");
      if (price > 0) {
        discountPct = Math.round((discountVal / price) * 100 * 100) / 100;
      }
    }

    if (existing >= 0) {
      setLines(prev => prev.map((l, i) => i === existing ? { ...l, qty: l.qty + 1 } : l));
    } else {
      setLines(prev => [...prev, {
        itemId: item.id, name: item.name,
        unitPrice: parseFloat(item.selling_price || "0"),
        qty: 1, discountPct,
        unitId: item.primary_unit_id || "",
        unitSymbol: item.unit_symbol || "pcs",
        stock: parseFloat(item.current_stock),
      }]);
    }
  };

  const updateLine = (i: number, field: keyof LineItem, value: any) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));

  // ── Coupon Apply Effect ──
  useEffect(() => {
    const code = couponCode.trim().toUpperCase();
    if (!code || lines.length === 0) {
      setCouponDiscount(0);
      setCouponMsg("");
      return;
    }
    const sub = lines.reduce((s, l) => s + l.unitPrice * l.qty * (1 - l.discountPct / 100), 0);
    if (code === "SAVE10") {
      setCouponDiscount(Math.round(sub * 0.1 * 100) / 100);
      setCouponMsg("Coupon 'SAVE10' applied (10% off)");
    } else if (code === "WELCOME50") {
      setCouponDiscount(Math.min(50, sub));
      setCouponMsg("Coupon 'WELCOME50' applied (Flat ₹50 off)");
    } else if (code === "FRESH20") {
      setCouponDiscount(Math.round(sub * 0.2 * 100) / 100);
      setCouponMsg("Coupon 'FRESH20' applied (20% off)");
    } else if (code === "MED50") {
      setCouponDiscount(Math.min(50, sub));
      setCouponMsg("Coupon 'MED50' applied (Flat ₹50 off)");
    } else {
      setCouponDiscount(0);
      setCouponMsg("Invalid coupon code");
    }
  }, [lines, couponCode]);

  // ── Totals ──
  const lineTotal = (l: LineItem) => l.unitPrice * l.qty * (1 - l.discountPct / 100);
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const grandTotal = Math.max(0, subtotal - couponDiscount);

  // ── Save sale ──
  const saveSale = async () => {
    if (!lines.length) { setSaveMsg({ ok: false, text: "Add at least one item" }); return; }
    setSaving(true); setSaveMsg(null);
    try {
      const r = await fetch(`/v1/stores/${storeId}/sales`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          saleDate: new Date(saleDate).toISOString(),
          paymentMethod: payMethod,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          notes: notes || undefined,
          discountAmount: couponDiscount || undefined,
          items: lines.map(l => ({
            itemId: l.itemId, qtySold: l.qty,
            unitId: l.unitId || undefined,
            unitPrice: l.unitPrice,
            discountPct: l.discountPct,
          })),
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Failed");
      setSaveMsg({ ok: true, text: `Sale ${d.data?.saleNumber || ""} saved!` });
      setLines([]); setCustomerName(""); setCustomerPhone(""); setNotes(""); setSaleDate(today());
      setCouponCode(""); setCouponDiscount(0); setCouponMsg("");
      loadTodaySales();
    } catch (e: any) {
      setSaveMsg({ ok: false, text: e.message });
    } finally { setSaving(false); }
  };

  // ── Load report ──
  const loadReport = useCallback(async () => {
    setLoadingReport(true); setSummary(null);
    let from = "", to = "", groupBy: string = "day";
    const t = today();
    if (reportRange === "today")  { from = `${t}T00:00:00`; to = `${t}T23:59:59`; groupBy = "day"; }
    else if (reportRange === "week")  { from = `${daysAgo(6)}T00:00:00`; to = `${t}T23:59:59`; groupBy = "day"; }
    else if (reportRange === "month") { from = `${daysAgo(29)}T00:00:00`; to = `${t}T23:59:59`; groupBy = "day"; }
    else { from = `${customFrom}T00:00:00`; to = `${customTo}T23:59:59`; groupBy = "day"; }

    try {
      const [sumRes, listRes] = await Promise.all([
        fetch(`/v1/stores/${storeId}/sales/summary?from=${from}&to=${to}&groupBy=${groupBy}`, { headers: authHeaders() }),
        fetch(`/v1/stores/${storeId}/sales?from=${from}&to=${to}&limit=100`, { headers: authHeaders() }),
      ]);
      const [sumD, listD] = await Promise.all([sumRes.json(), listRes.json()]);
      if (sumD.success) setSummary({ periods: sumD.data.summary || [], totals: sumD.data.totals, topItems: sumD.data.topItems || [] });
      if (listD.success) setReportSales(listD.data?.items || []);
    } catch {}
    setLoadingReport(false);
  }, [storeId, reportRange, customFrom, customTo]);

  useEffect(() => { if (tab === "report") loadReport(); }, [tab, reportRange, customFrom, customTo]);

  const maxRevenue = summary?.periods ? Math.max(...summary.periods.map(p => parseFloat(p.total_revenue || "0")), 1) : 1;

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sales</h1>
          <p className="text-gray-400 text-sm">Record sales and view reports</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setTab("sale")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "sale" ? "bg-white shadow-sm text-orange-500" : "text-gray-500 hover:text-gray-700"}`}>
            <ShoppingCart size={13} /> New Sale
          </button>
          <button onClick={() => setTab("report")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "report" ? "bg-white shadow-sm text-orange-500" : "text-gray-500 hover:text-gray-700"}`}>
            <BarChart2 size={13} /> Reports
          </button>
        </div>
      </div>

      {/* ── NEW SALE TAB ── */}
      {tab === "sale" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-3">
            {/* Date + Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sale Date</label>
                  <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer name (optional)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>

            {/* Item search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Items</label>
              <ItemSearch items={items} onAdd={addLine} />

              {/* Line items */}
              {lines.length > 0 && (
                <div className="mt-3 space-y-2">
                  {lines.map((l, i) => {
                    const overStock = l.qty > l.stock;
                    return (
                      <div key={i} className={`rounded-xl border p-3 ${overStock ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{l.name}</p>
                            <p className="text-xs text-gray-400">Stock: {l.stock} {l.unitSymbol}</p>
                          </div>
                          <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-400 shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Qty</label>
                            <input type="number" min="0.01" step="0.01" value={l.qty}
                              onChange={e => updateLine(i, "qty", parseFloat(e.target.value) || 0)}
                              className="w-full mt-0.5 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-orange-400" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Unit Price ₹</label>
                            <input type="number" min="0" step="0.01" value={l.unitPrice}
                              onChange={e => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="w-full mt-0.5 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Disc %</label>
                            <input type="number" min="0" max="100" step="0.5" value={l.discountPct}
                              onChange={e => updateLine(i, "discountPct", parseFloat(e.target.value) || 0)}
                              className="w-full mt-0.5 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          {overStock && <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={10}/> Exceeds stock</span>}
                          <span className="text-sm font-bold text-gray-900 ml-auto">{fmtINR(lineTotal(l))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Notes (optional)"
              className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>

          {/* Right: summary + save */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Order Summary</h3>
              {lines.length === 0 ? (
                <div className="text-center py-6 text-gray-300">
                  <ShoppingCart size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No items added</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {lines.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate mr-2">{l.name} × {l.qty}</span>
                      <span className="font-semibold text-gray-900 shrink-0">{fmtINR(lineTotal(l))}</span>
                    </div>
                  ))}
                   {/* Coupon code input */}
                   <div className="border-t border-gray-100 pt-3 mt-3">
                     <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Coupon Code</label>
                     <div className="flex gap-2">
                       <input
                         type="text"
                         value={couponCode}
                         onChange={e => setCouponCode(e.target.value)}
                         placeholder="e.g. SAVE10, WELCOME50"
                         className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-orange-400"
                       />
                     </div>
                     {couponMsg && (
                       <p className={`text-[10px] mt-1 font-semibold ${couponDiscount > 0 ? "text-green-600" : "text-red-500"}`}>
                         {couponMsg}
                       </p>
                     )}
                   </div>

                   {couponDiscount > 0 && (
                     <div className="flex justify-between text-xs text-green-600 font-semibold mt-2">
                       <span>Coupon Deduction</span>
                       <span>-{fmtINR(couponDiscount)}</span>
                     </div>
                   )}

                   <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-black text-base">
                     <span>Total</span>
                     <span className="text-orange-500">{fmtINR(grandTotal)}</span>
                   </div>
                 </div>
               )}

              {saveMsg && (
                <div className={`rounded-xl px-3 py-2 text-xs font-semibold mb-3 flex items-center gap-1.5 ${saveMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {saveMsg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  {saveMsg.text}
                </div>
              )}

              <button onClick={saveSale} disabled={saving || lines.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {saving ? "Saving…" : `Save Sale · ${fmtINR(grandTotal)}`}
              </button>
            </div>

            {/* Today's sales mini list */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Today's Sales</h3>
                <button onClick={loadTodaySales} className="text-gray-300 hover:text-gray-500">
                  <RefreshCw size={13} className={loadingSales ? "animate-spin" : ""} />
                </button>
              </div>
              {loadingSales ? (
                <div className="text-center py-4 text-gray-300 text-xs">Loading…</div>
              ) : todaySales.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No sales today yet</p>
              ) : (
                <div className="space-y-2">
                  {todaySales.slice(0, 8).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{s.sale_number}</p>
                        <p className="text-gray-400">{s.customer_name || "Walk-in"} · {s.item_count} item{s.item_count !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="font-bold text-gray-900">{fmtINR(s.total_amount)}</span>
                    </div>
                  ))}
                  {todaySales.length > 8 && <p className="text-xs text-gray-400 text-center">+{todaySales.length - 8} more</p>}
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-xs font-bold">
                    <span className="text-gray-600">Today Total</span>
                    <span className="text-orange-500">{fmtINR(todaySales.reduce((s, x) => s + Number(x.total_amount), 0))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT TAB ── */}
      {tab === "report" && (
        <div className="space-y-4">
          {/* Range selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex flex-wrap gap-2 items-center">
              {(["today", "week", "month", "custom"] as const).map(r => (
                <button key={r} onClick={() => setReportRange(r)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all border ${reportRange === r ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-500 hover:border-orange-300"}`}>
                  {r === "today" ? "Today" : r === "week" ? "Last 7 Days" : r === "month" ? "Last 30 Days" : "Custom Range"}
                </button>
              ))}
              {reportRange === "custom" && (
                <div className="flex items-center gap-2 ml-2">
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <button onClick={loadReport} className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-xl text-sm font-semibold">
                    <RefreshCw size={12} /> Go
                  </button>
                </div>
              )}
            </div>
          </div>

          {loadingReport ? (
            <div className="text-center py-16 text-gray-300"><Loader2 size={28} className="mx-auto animate-spin mb-2" /><p className="text-sm">Loading report…</p></div>
          ) : summary ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Revenue", value: fmtINR(parseFloat(summary.totals?.revenue || "0")), icon: TrendingUp, color: "text-orange-500" },
                  { label: "Transactions", value: summary.totals?.transactions ?? 0, icon: ShoppingCart, color: "text-blue-500" },
                  { label: "Avg Sale", value: fmtINR(parseFloat(summary.totals?.revenue || "0") / Math.max(1, summary.totals?.transactions || 1)), icon: BarChart2, color: "text-purple-500" },
                  { label: "Items Sold", value: summary.topItems?.reduce((s: number, i: TopItem) => s + parseFloat(i.qty_sold || "0"), 0).toFixed(0) ?? 0, icon: Package, color: "text-green-500" },
                ].map(c => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</p>
                        <Icon size={14} className={c.color} />
                      </div>
                      <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Daily chart */}
              {summary.periods.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue by Day</h3>
                  <div className="flex items-end gap-1.5 h-28 overflow-x-auto pb-2">
                    {summary.periods.map(p => {
                      const rev = parseFloat(p.total_revenue || "0");
                      const h = Math.max(4, (rev / maxRevenue) * 96);
                      return (
                        <div key={p.period} className="flex flex-col items-center gap-1 min-w-[36px] group">
                          <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{fmtINR(rev)}</span>
                          <div className="w-7 bg-orange-400 rounded-t-md transition-all hover:bg-orange-500" style={{ height: `${h}px` }} title={`${p.period}: ${fmtINR(rev)}`} />
                          <span className="text-[9px] text-gray-400 whitespace-nowrap">{p.period.slice(5)}</span>
                          <span className="text-[9px] text-gray-300">{p.sale_count}×</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top items */}
                {summary.topItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Top Items</h3>
                    <div className="space-y-2">
                      {summary.topItems.map((item, i) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">{parseFloat(item.qty_sold).toFixed(1)} sold</p>
                          </div>
                          <span className="text-sm font-bold text-orange-500 shrink-0">{fmtINR(parseFloat(item.revenue))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sale list */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Transactions ({reportSales.length})</h3>
                    <a href={`/v1/stores/${storeId}/sales/export?format=csv&from=${customFrom}T00:00:00&to=${customTo}T23:59:59`}
                      className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                      <Download size={11} /> CSV
                    </a>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {reportSales.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No sales in this period</p>
                    ) : reportSales.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{s.sale_number}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(s.sale_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {s.customer_name ? ` · ${s.customer_name}` : ""}
                            {s.payment_method ? ` · ${s.payment_method}` : ""}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{fmtINR(s.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-300">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No data for this period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
