"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Printer, RefreshCw, CheckCircle2, AlertCircle, X, Save, Truck } from "lucide-react";
import { tfFetch, fmtDate, fmtDateShort, fmtINR } from "@/lib/tf-api";

const GRADES = [
  { code: "BOP", label: "BOP · Black Tea (HSN 09024030)" },
  { code: "BP",  label: "BP · Black Tea (HSN 09024030)" },
  { code: "DUST",label: "DUST · Black Tea (HSN 09024030)" },
  { code: "CTC", label: "CTC · Black Tea (HSN 09024030)" },
  { code: "RC",  label: "RC · Black Tea (HSN 09024030)" },
  { code: "WASTE",label: "Tea Waste (HSN 09024030)" },
];

interface GatePass {
  id: string;
  invoice_serial_no: number;
  dispatch_date: string;
  dispatch_time: string | null;
  consignee_name: string;
  consignee_address: string | null;
  vehicle_reg_no: string | null;
  transport_mode: string;
  total_qty_kg: number;
  total_assessable_value: number | null;
  total_duty_amount: number | null;
  status: "draft" | "issued";
  issued_at: string | null;
  line_items?: LineItem[];
}
interface LineItem {
  id: string;
  si_no: number;
  variety_of_goods: string;
  package_description: string | null;
  chest_serial_nos: string | null;
  avg_content_per_pkg_kg: number | null;
  qty_kg: number;
  assessable_value: number | null;
  rate_of_duty: number | null;
  duty_amount: number | null;
  bag_count: number | null;
}
interface FactoryConfig {
  factory_name: string;
  factory_address: string;
  ecc_no: string | null;
  assessee_code: string | null;
  rc_no: string | null;
  gst_in: string | null;
  pan: string | null;
  pla_no: string | null;
  ce_series_no: string | null;
}

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";

export default function GatePassPage() {
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [config, setConfig] = useState<FactoryConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [printPass, setPrintPass] = useState<GatePass | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Form state
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [dispatchTime, setDispatchTime] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddr, setConsigneeAddr] = useState("");
  const [vehicleRegNo, setVehicleRegNo] = useState("");
  const [transportMode, setTransportMode] = useState("lorry");
  const [lineItems, setLineItems] = useState<Omit<LineItem, "id" | "si_no">[]>([
    { variety_of_goods: "BOP", package_description: null, chest_serial_nos: null, avg_content_per_pkg_kg: null, qty_kg: 0, assessable_value: null, rate_of_duty: null, duty_amount: null, bag_count: null },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      tfFetch<GatePass[]>("/gate-pass?limit=50"),
      tfFetch<FactoryConfig>("/setup/factory-config"),
    ]);
    if (p.success) setPasses(p.data ?? []);
    if (c.success) setConfig(c.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addLineItem = () => setLineItems(prev => [...prev, { variety_of_goods: "BOP", package_description: null, chest_serial_nos: null, avg_content_per_pkg_kg: null, qty_kg: 0, assessable_value: null, rate_of_duty: null, duty_amount: null, bag_count: null }]);

  const updateItem = (i: number, field: string, val: string) => {
    setLineItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val === "" ? null : isNaN(Number(val)) ? val : Number(val) } : item));
  };

  const totalQty = lineItems.reduce((s, i) => s + (Number(i.qty_kg) || 0), 0);
  const totalValue = lineItems.reduce((s, i) => s + (Number(i.assessable_value) || 0), 0);
  const totalDuty  = lineItems.reduce((s, i) => s + (Number(i.duty_amount) || 0), 0);

  const save = async (asDraft = true) => {
    setSaving(true); setMsg(null);
    const r = await tfFetch<GatePass>("/gate-pass", {
      method: "POST",
      body: JSON.stringify({
        dispatch_date: dispatchDate, dispatch_time: dispatchTime || null,
        consignee_name: consigneeName, consignee_address: consigneeAddr || null,
        vehicle_reg_no: vehicleRegNo || null, transport_mode: transportMode,
        status: asDraft ? "draft" : "issued",
        line_items: lineItems.map((item, i) => ({ ...item, si_no: i + 1 })),
      }),
    });
    setSaving(false);
    if (r.success) {
      setShowForm(false);
      setMsg({ ok: true, text: `Gate Pass ${asDraft ? "saved as draft" : "issued"} successfully.` });
      load();
      if (!asDraft && r.data) { setPrintPass(r.data); setTimeout(() => window.print(), 600); }
    } else { setMsg({ ok: false, text: r.error ?? "Save failed." }); }
  };

  const openPrint = async (gp: GatePass) => {
    const r = await tfFetch<GatePass>(`/gate-pass/${gp.id}`);
    if (r.success && r.data) { setPrintPass(r.data); setTimeout(() => window.print(), 400); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gate Pass</h1>
            <p className="text-gray-500 text-xs">Central Excise Invoice — Form E (Rule 52-A & 1736-C)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[44px]">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm min-h-[44px]">
            <Plus size={15} /> New Gate Pass
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-4 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <AlertCircle size={14} />{msg.text}
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            {["Serial No.", "Date", "Consignee", "Vehicle", "Total (kg)", "Value (₹)", "Duty (₹)", "Status", ""].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {passes.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center">
                <FileText size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No gate passes yet.</p>
              </td></tr>
            ) : passes.map(gp => (
              <tr key={gp.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold text-gray-900">{config?.ce_series_no ?? "65-A"} / {gp.invoice_serial_no}</td>
                <td className="px-4 py-3 text-gray-700">{fmtDate(gp.dispatch_date)}</td>
                <td className="px-4 py-3 text-gray-800 max-w-[140px] truncate">{gp.consignee_name}</td>
                <td className="px-4 py-3 font-mono text-gray-600 text-xs">{gp.vehicle_reg_no ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{gp.total_qty_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{gp.total_assessable_value ? fmtINR(gp.total_assessable_value) : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{gp.total_duty_amount ? fmtINR(gp.total_duty_amount) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gp.status === "issued" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {gp.status === "issued" ? "Issued" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openPrint(gp)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-colors">
                    <Printer size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── New Gate Pass Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">New Gate Pass — Central Excise Invoice</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date of Removal</label><input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className={inp} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Time of Removal</label><input type="time" value={dispatchTime} onChange={e => setDispatchTime(e.target.value)} className={inp} /></div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Manner of Transport</label>
                  <select value={transportMode} onChange={e => setTransportMode(e.target.value)} className={inp}>
                    <option value="lorry">Through Lorry</option>
                    <option value="rail">By Rail</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name & Address of Consignee <span className="text-red-500">*</span></label>
                <input type="text" value={consigneeName} onChange={e => setConsigneeName(e.target.value)} placeholder="e.g. HAILEYBURIA TEA ESTATES LTD., KOCHI" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Consignee Address</label>
                <input type="text" value={consigneeAddr} onChange={e => setConsigneeAddr(e.target.value)} placeholder="Full address" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Registration No.</label>
                <input type="text" value={vehicleRegNo} onChange={e => setVehicleRegNo(e.target.value)} placeholder="e.g. KL 07 AB 1234" className={inp} />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600">Line Items (Goods being dispatched)</label>
                  <button onClick={addLineItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 min-h-[32px]"><Plus size={12} /> Add Item</button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Item {i + 1}</span>
                        {lineItems.length > 1 && <button onClick={() => setLineItems(p => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 min-h-[32px] min-w-[32px] flex items-center justify-center"><X size={13} /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Variety of Goods</label>
                          <select value={item.variety_of_goods} onChange={e => updateItem(i, "variety_of_goods", e.target.value)} className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:border-emerald-500 focus:outline-none">
                            {GRADES.map(g => <option key={g.code} value={g.code}>{g.code}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">No. of Bags</label>
                          <input type="number" value={item.bag_count ?? ""} onChange={e => updateItem(i, "bag_count", e.target.value)} placeholder="0" className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:border-emerald-500 focus:outline-none text-right" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Avg Pkg Wt (kg)</label>
                          <input type="number" value={item.avg_content_per_pkg_kg ?? ""} onChange={e => updateItem(i, "avg_content_per_pkg_kg", e.target.value)} placeholder="0" step="0.01" className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:border-emerald-500 focus:outline-none text-right" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Total Qty (kg) <span className="text-red-400">*</span></label>
                          <input type="number" value={item.qty_kg || ""} onChange={e => updateItem(i, "qty_kg", e.target.value)} placeholder="0" step="0.01" className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:border-emerald-500 focus:outline-none text-right" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Assessable Value (₹)</label>
                          <input type="number" value={item.assessable_value ?? ""} onChange={e => updateItem(i, "assessable_value", e.target.value)} placeholder="0" step="0.01" className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:border-emerald-500 focus:outline-none text-right" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Duty Amount (₹)</label>
                          <input type="number" value={item.duty_amount ?? ""} onChange={e => updateItem(i, "duty_amount", e.target.value)} placeholder="0" step="0.01" className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:border-emerald-500 focus:outline-none text-right" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Chest / Identification Marks & Serial Nos.</label>
                        <input type="text" value={item.chest_serial_nos ?? ""} onChange={e => updateItem(i, "chest_serial_nos", e.target.value)} placeholder="e.g. SV/BOP/001-010" className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:border-emerald-500 focus:outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals preview */}
              {totalQty > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 grid grid-cols-3 gap-4">
                  <div><p className="text-xs text-blue-600 font-medium">Total Qty</p><p className="font-bold text-blue-900">{totalQty.toLocaleString("en-IN", { minimumFractionDigits: 2 })} kg</p></div>
                  <div><p className="text-xs text-blue-600 font-medium">Total Value</p><p className="font-bold text-blue-900">{totalValue > 0 ? fmtINR(totalValue) : "—"}</p></div>
                  <div><p className="text-xs text-blue-600 font-medium">Total Duty</p><p className="font-bold text-blue-900">{totalDuty > 0 ? fmtINR(totalDuty) : "—"}</p></div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 min-h-[44px]">Cancel</button>
              <button onClick={() => save(true)} disabled={saving || !consigneeName || totalQty === 0}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]">
                <Save size={14} />Save Draft
              </button>
              <button onClick={() => save(false)} disabled={saving || !consigneeName || totalQty === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]">
                <Printer size={14} />Issue & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT VIEW — Central Excise Invoice Form E ── */}
      {printPass && (
        <div className="hidden print:block fixed inset-0 bg-white z-[200] p-[15mm] font-mono text-[10pt]">
          {/* Document Header */}
          <div className="border-2 border-black p-0">
            <div className="flex justify-between items-start px-2 py-1 border-b border-black text-[8pt]">
              <div>
                <p>Central Excise Series No. {config?.ce_series_no ?? "65-A"}</p>
                <p>Serial No. : <strong>{config?.assessee_code ? `${config.assessee_code.slice(0, 8)}` : "—"}</strong></p>
                <p>Sector I : <strong>A</strong></p>
                <p>Range : <strong>Vandiperiyar</strong></p>
                <p>Division : <strong>IDUKKI</strong></p>
                <p>Range Code: <strong>TI0701</strong></p>
              </div>
              <div className="text-center">
                <p>ECC : <strong>{config?.ecc_no ?? "—"}</strong></p>
                <p>Assessee Code : <strong>{config?.assessee_code ?? "—"}</strong></p>
                <p>Reg. No. RC. No. : <strong>{config?.rc_no ?? "—"}</strong></p>
                <p>QL. No. :</p>
                <p>GST IN : <strong>{config?.gst_in ?? "—"}</strong></p>
                <p>PAN NUMBER : <strong>{config?.pan ?? "—"}</strong></p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[9pt]">ORIGINAL FOR BUYER</p>
                <p className="text-[20pt] font-black border-2 border-black px-3 py-1 mt-1">{printPass.invoice_serial_no}</p>
                <p className="text-[8pt]">Printed Serial No.</p>
              </div>
            </div>

            <div className="text-center py-1 border-b border-black">
              <p className="font-bold text-[11pt]">INVOICE</p>
              <p className="text-[9pt]">INVOICE FOR REMOVAL OF GOODS FROM FACTORY OR WAREHOUSE ON PAYMENT OF DUTY</p>
              <p className="text-[8pt]">(Rules 52-A and 1736-C)</p>
            </div>

            <div className="px-2 py-1 text-[8pt] border-b border-black">
              <div className="flex gap-4">
                <span>Date of Removal : <strong>{fmtDate(printPass.dispatch_date)}</strong></span>
                <span>Time of Removal : <strong>{printPass.dispatch_time ?? "—"}</strong></span>
              </div>
              <p>Name, Address & Licence No. of Factory :</p>
              <p className="font-bold">{config?.factory_name ?? "—"}, {config?.factory_address ?? "—"}</p>
              <p>P.L.A. No. : <strong>{config?.pla_no ?? "—"}</strong></p>
              <p>Name of Excisable Commodity : <strong>BLACK TEA & OTHERS/TEA WASTE (HSN CODE: 09024030)</strong></p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-[8pt]">
              <thead>
                <tr className="border-b border-black">
                  {["Sl No.", "Invoice No.", "Variety of Goods", "No. & Description of Packages", "Identification Marks & Serial No. of Chests", "Average Contents per Package Kgms.", "Total Quantity Kgms.", "Total Assessable Value or Tariff Value Rs. Ps.", "Rate of Duty", "Amount Duty Rs. Ps."].map(h => (
                    <th key={h} className="border-r border-black px-1 py-1 text-center font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(printPass.line_items ?? []).map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-400">
                    <td className="border-r border-black px-1 py-1 text-center">{item.si_no}</td>
                    <td className="border-r border-black px-1 py-1 text-center">{printPass.invoice_serial_no}</td>
                    <td className="border-r border-black px-1 py-1">{item.variety_of_goods}</td>
                    <td className="border-r border-black px-1 py-1 text-center">{item.bag_count ? `${item.bag_count} Bags` : "—"}</td>
                    <td className="border-r border-black px-1 py-1">{item.chest_serial_nos ?? "—"}</td>
                    <td className="border-r border-black px-1 py-1 text-right">{item.avg_content_per_pkg_kg?.toFixed(2) ?? "—"}</td>
                    <td className="border-r border-black px-1 py-1 text-right font-semibold">{Number(item.qty_kg).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="border-r border-black px-1 py-1 text-right">{item.assessable_value?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "—"}</td>
                    <td className="border-r border-black px-1 py-1 text-center">{item.rate_of_duty ? `${item.rate_of_duty}%` : "—"}</td>
                    <td className="px-1 py-1 text-right">{item.duty_amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "—"}</td>
                  </tr>
                ))}
                {/* Empty rows to match physical form */}
                {Array.from({ length: Math.max(0, 8 - (printPass.line_items?.length ?? 0)) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-gray-300"><td colSpan={10} className="py-3"></td></tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={6} className="border-r border-black px-1 py-1">TOTAL</td>
                  <td className="border-r border-black px-1 py-1 text-right">{printPass.total_qty_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="border-r border-black px-1 py-1 text-right">{printPass.total_assessable_value?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "—"}</td>
                  <td className="border-r border-black px-1 py-1"></td>
                  <td className="px-1 py-1 text-right">{printPass.total_duty_amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "—"}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-2 py-1 text-[8pt] border-t border-black space-y-0.5">
              <p>Name and address of Consignee : <strong>{printPass.consignee_name}{printPass.consignee_address ? `, ${printPass.consignee_address}` : ""}</strong></p>
              <p>Manner of Transport : <strong>{printPass.transport_mode === "lorry" ? "Through Lorry" : printPass.transport_mode === "rail" ? "By Rail" : printPass.transport_mode}</strong></p>
              <p>If any Motor Vehicle, its Registration No. : <strong>{printPass.vehicle_reg_no ?? "—"}</strong></p>
            </div>
            <div className="px-2 py-1 text-[7.5pt] border-t border-black">
              <p className="font-bold text-center">THE VALUE IN THE INVOICE REPRESENT THE VALUE OF THE GOODS UNDER SECTION OF THE CENTRAL EXCISE ACT 1994 AND THE DUTY PAID AS PROVIDED UNDER SECTION 12 A OF THE ACT</p>
              <p className="text-center font-bold mt-0.5">CERTIFIED THAT THE PARTICULARS GIVEN ABOVE ARE CORRECT</p>
              <p className="text-center">Form E</p>
              <p className="text-center">Refer Regulation 2.1.14(2)</p>
            </div>
            <div className="px-2 py-1 text-[7.5pt] border-t border-black">
              <p>The teas in the above invoices were made from H/Green Leaf which have only used PPFs and have not used any chemicals and pesticides banned in India as per the certified and undertaking furnished by the tea growers. It is further certified that from the date of purchasing the green leaf to the date of manufacturing there was no use of any pesticide and/or any contamination. In the event of detection of any banned pesticides or chemicals and their residues are beyond the prescribed limit, Tea Board is free to take appropriate action as per the provisions of the Tea Marketing (Control) Order 2003.</p>
            </div>
            <div className="flex justify-between px-2 py-2 text-[8pt]">
              <div>
                <p>Place : <strong>{config?.factory_name?.split(" ")[0] ?? "FACTORY"}</strong></p>
                <p>Date and Time of Preparation of Invoice</p>
              </div>
              <div className="text-right">
                <div className="h-10"></div>
                <p>Signature of the Licensee or</p>
                <p>his authorised agent</p>
              </div>
            </div>
          </div>
          <style jsx global>{`
            @media print {
              body * { visibility: hidden; }
              .print\\:block, .print\\:block * { visibility: visible; }
              @page { size: A4 landscape; margin: 10mm; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
