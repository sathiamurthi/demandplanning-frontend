"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Scale, Truck, Plus, Save, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Leaf, ChevronRight, X, Search, Printer, Eye,
} from "lucide-react";
import { tfFetch, fmtDate, fmtDateShort, fmtKg } from "@/lib/tf-api";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Vehicle { id: string; vehicle_reg_no: string; driver_name: string; tare_weight_kg: number | null; }
interface Grower  { id: string; name: string; grower_code: string; phone?: string; }
interface IntakeEntry {
  id: string; intake_date: string; vehicle_id: string; vehicle_reg_no: string;
  grower_id: string; grower_name: string; grower_code: string;
  gross_weight_kg: number; tare_weight_kg: number; net_weight_kg: number;
  moisture_deduction_pct: number; net_after_moisture_kg: number;
  leaf_grade: string; lot_no: string; status: "pending" | "processed" | "rejected";
  created_at: string; age_hours?: number;
}
interface DaySummary {
  total_gross_kg: number; total_net_kg: number; entry_count: number;
  grower_count: number; pending_count: number; processed_count: number;
}

const LEAF_GRADES = [
  { code: "A",    label: "Grade A — Fine" },
  { code: "B",    label: "Grade B — Medium" },
  { code: "C",    label: "Grade C — Coarse" },
  { code: "MIXED",label: "Mixed / Ungraded" },
];

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";

/* ─── Lot number generator ───────────────────────────────────────────────── */
function genLotNo(date: string): string {
  const [y, m, d] = date.split("-");
  const seq = Math.floor(Math.random() * 900) + 100;
  return `GL/${d}${m}${y.slice(2)}/${seq}`;
}

export default function GreenLeafIntakePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [tab, setTab]   = useState<"entry" | "pending" | "history">("entry");

  const [vehicles,    setVehicles]    = useState<Vehicle[]>([]);
  const [growers,     setGrowers]     = useState<Grower[]>([]);
  const [entries,     setEntries]     = useState<IntakeEntry[]>([]);
  const [summary,     setSummary]     = useState<DaySummary | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Weighbridge form ── */
  const [vehicleId,    setVehicleId]    = useState("");
  const [vehicleSearch,setVehicleSearch]= useState("");
  const [growerId,     setGrowerId]     = useState("");
  const [growerSearch, setGrowerSearch] = useState("");
  const [grossWeight,  setGrossWeight]  = useState("");
  const [tareWeight,   setTareWeight]   = useState("");
  const [moisturePct,  setMoisturePct]  = useState("5");
  const [leafGrade,    setLeafGrade]    = useState("A");
  const [lotNo,        setLotNo]        = useState(() => genLotNo(today));
  const [notes,        setNotes]        = useState("");

  /* ── Derived ── */
  const gross    = parseFloat(grossWeight) || 0;
  const tare     = parseFloat(tareWeight)  || 0;
  const netGross = Math.max(0, gross - tare);
  const moisture = (netGross * (parseFloat(moisturePct) || 0)) / 100;
  const netFinal = Math.max(0, netGross - moisture);

  /* ── Filtered lists ── */
  const filteredVehicles = vehicles.filter(v =>
    v.vehicle_reg_no.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.driver_name.toLowerCase().includes(vehicleSearch.toLowerCase())
  ).slice(0, 5);

  const filteredGrowers = growers.filter(g =>
    g.name.toLowerCase().includes(growerSearch.toLowerCase()) ||
    g.grower_code.toLowerCase().includes(growerSearch.toLowerCase())
  ).slice(0, 6);

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const selectedGrower  = growers.find(g => g.id === growerId);

  const pendingEntries  = entries.filter(e => e.status === "pending");
  const pendingKg       = pendingEntries.reduce((s, e) => s + e.net_after_moisture_kg, 0);

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    const [v, g, e, s] = await Promise.all([
      tfFetch<Vehicle[]>("/vehicles?active=true"),
      tfFetch<Grower[]>("/growers-list"),
      tfFetch<IntakeEntry[]>(`/intake?date=${date}&limit=100`),
      tfFetch<DaySummary>(`/intake/summary?date=${date}`),
    ]);
    if (v.success) setVehicles(v.data ?? []);
    if (g.success) setGrowers(g.data ?? []);
    if (e.success) setEntries(e.data ?? []);
    if (s.success) setSummary(s.data ?? null);
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  /* ── Auto-fill tare from vehicle master ── */
  useEffect(() => {
    if (vehicleId) {
      const v = vehicles.find(x => x.id === vehicleId);
      if (v?.tare_weight_kg) setTareWeight(v.tare_weight_kg.toString());
    }
  }, [vehicleId, vehicles]);

  /* ── Auto-generate lot no when date changes ── */
  useEffect(() => { setLotNo(genLotNo(date)); }, [date]);

  /* ── Save entry ── */
  const save = async () => {
    if (!grossWeight || !tareWeight || !growerId) {
      setMsg({ ok: false, text: "Gross weight, tare weight and grower are required." }); return;
    }
    setSaving(true); setMsg(null);
    const r = await tfFetch<IntakeEntry>("/intake", {
      method: "POST",
      body: JSON.stringify({
        intake_date: date, vehicle_id: vehicleId || null,
        grower_id: growerId, lot_no: lotNo,
        gross_weight_kg: gross, tare_weight_kg: tare,
        net_weight_kg: netGross,
        moisture_deduction_pct: parseFloat(moisturePct) || 0,
        net_after_moisture_kg: netFinal,
        leaf_grade: leafGrade, notes: notes || null, status: "pending",
      }),
    });
    setSaving(false);
    if (r.success) {
      setMsg({ ok: true, text: `Entry saved — Lot ${lotNo} · Net ${netFinal.toFixed(2)} kg` });
      setGrossWeight(""); setTareWeight(""); setGrowerId(""); setGrowerSearch("");
      setVehicleId(""); setVehicleSearch(""); setNotes("");
      setLotNo(genLotNo(date));
      load();
    } else { setMsg({ ok: false, text: r.error ?? "Save failed." }); }
  };

  /* ── Mark processed ── */
  const markProcessed = async (id: string) => {
    await tfFetch(`/intake/${id}`, { method: "PATCH", body: JSON.stringify({ status: "processed" }) });
    load();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center">
            <Scale size={18} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Green Leaf Intake</h1>
            <p className="text-gray-500 text-xs">Weighbridge receipt · Daily register · Pending leaf tracker</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:border-emerald-500 focus:outline-none" />
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[40px]">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Day Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Gross Leaf Today", val: fmtKg(summary?.total_gross_kg ?? 0), color: "bg-green-50 border-green-200 text-green-800" },
          { label: "Net Leaf (After Moisture)", val: fmtKg(summary?.total_net_kg ?? 0), color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
          { label: "Growers Today", val: (summary?.grower_count ?? 0).toString(), color: "bg-blue-50 border-blue-200 text-blue-800" },
          {
            label: "Pending Processing",
            val: `${summary?.pending_count ?? 0} lots · ${fmtKg(pendingKg)}`,
            color: pendingEntries.length > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-gray-50 border-gray-200 text-gray-600"
          },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-3.5 ${c.color}`}>
            <p className="text-[11px] font-semibold opacity-70 mb-1">{c.label}</p>
            <p className="text-xl font-bold">{c.val}</p>
          </div>
        ))}
      </div>

      {/* Pending leaf alert */}
      {pendingEntries.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
          <AlertCircle size={15} />
          <span><strong>{pendingEntries.length} lots</strong> of green leaf ({fmtKg(pendingKg)}) pending factory processing.</span>
          <button onClick={() => setTab("pending")} className="ml-auto text-amber-700 underline underline-offset-2 text-xs font-medium">View →</button>
        </div>
      )}

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-4 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {msg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {([["entry","Weighbridge Entry", Scale], ["pending","Pending Leaf", Clock], ["history","Today's Register", Eye]] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all min-h-[44px] ${tab === k ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
            <Icon size={13} />{l}
            {k === "pending" && pendingEntries.length > 0 && (
              <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingEntries.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── WEIGHBRIDGE ENTRY ──────────────────────────────────────────────── */}
      {tab === "entry" && (
        <div className="space-y-4">
          {/* Section 1 — Vehicle */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <Truck size={12} className="inline mr-1.5" />Step 1 — Vehicle & Date
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle (optional — for weighbridge auto-fill)</label>
                {selectedVehicle ? (
                  <div className="h-11 border border-emerald-300 bg-emerald-50 rounded-lg px-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-800">{selectedVehicle.vehicle_reg_no} — {selectedVehicle.driver_name}</span>
                    <button onClick={() => { setVehicleId(""); setVehicleSearch(""); }} className="text-emerald-500 hover:text-red-500"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-3.5 text-gray-400" />
                    <input value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)}
                      placeholder="Search by reg no or driver…" className={inp + " pl-8"} />
                    {vehicleSearch.length > 0 && filteredVehicles.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                        {filteredVehicles.map(v => (
                          <button key={v.id} onClick={() => { setVehicleId(v.id); setVehicleSearch(""); }}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-900">{v.vehicle_reg_no}</span>
                            <span className="text-gray-500 text-xs">{v.driver_name}{v.tare_weight_kg ? ` · Tare ${v.tare_weight_kg} kg` : ""}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lot No. (auto)</label>
                <input value={lotNo} onChange={e => setLotNo(e.target.value)} className={inp + " font-mono text-sm"} />
              </div>
            </div>
          </div>

          {/* Section 2 — Grower */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <Leaf size={12} className="inline mr-1.5" />Step 2 — Grower
            </p>
            {selectedGrower ? (
              <div className="h-11 border border-emerald-300 bg-emerald-50 rounded-lg px-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-800">{selectedGrower.name} <span className="font-mono text-xs text-emerald-600">[{selectedGrower.grower_code}]</span></span>
                <button onClick={() => { setGrowerId(""); setGrowerSearch(""); }} className="text-emerald-500 hover:text-red-500"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={13} className="absolute left-3 top-3.5 text-gray-400" />
                <input value={growerSearch} onChange={e => setGrowerSearch(e.target.value)}
                  placeholder="Search grower by name or code…" className={inp + " pl-8"} />
                {growerSearch.length > 0 && filteredGrowers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                    {filteredGrowers.map(g => (
                      <button key={g.id} onClick={() => { setGrowerId(g.id); setGrowerSearch(""); }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">{g.name}</span>
                        <span className="text-gray-400 font-mono text-xs">{g.grower_code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Leaf Grade</label>
              <div className="flex gap-2 flex-wrap">
                {LEAF_GRADES.map(g => (
                  <button key={g.code} onClick={() => setLeafGrade(g.code)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all min-h-[36px] ${leafGrade === g.code ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3 — Weighbridge */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <Scale size={12} className="inline mr-1.5" />Step 3 — Weighbridge
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gross Weight (kg) <span className="text-red-500">*</span></label>
                <input type="number" value={grossWeight} onChange={e => setGrossWeight(e.target.value)}
                  placeholder="e.g. 7500" step="0.5"
                  className={inp + " text-right text-lg font-bold tabular-nums"} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tare Weight (kg) <span className="text-red-500">*</span></label>
                <input type="number" value={tareWeight} onChange={e => setTareWeight(e.target.value)}
                  placeholder="e.g. 770" step="0.5"
                  className={inp + " text-right text-lg font-bold tabular-nums"} />
                {selectedVehicle?.tare_weight_kg && (
                  <p className="text-[10px] text-emerald-600 mt-0.5">Auto-filled from vehicle master</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Net Green Leaf (kg)</label>
                <div className="h-11 bg-blue-50 border border-blue-200 rounded-lg px-3 flex items-center justify-end text-blue-800 font-bold text-lg tabular-nums">
                  {netGross.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Moisture Deduction (%)</label>
                <input type="number" value={moisturePct} onChange={e => setMoisturePct(e.target.value)}
                  placeholder="5" step="0.5" min="0" max="20"
                  className={inp + " text-right tabular-nums"} />
              </div>
            </div>

            {/* Live weight display */}
            {gross > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Gross Weight</p>
                  <p className="text-2xl font-black text-emerald-800">{gross.toFixed(1)}</p>
                  <p className="text-xs text-emerald-600">kg</p>
                </div>
                <div className="text-center border-x border-emerald-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Net (Gross − Tare)</p>
                  <p className="text-2xl font-black text-blue-800">{netGross.toFixed(1)}</p>
                  <p className="text-xs text-blue-600">kg</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-medium mb-1">Payable Net (−{moisturePct}% moisture)</p>
                  <p className="text-2xl font-black text-gray-900">{netFinal.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">kg</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes + Save */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Leaf quality good. No contamination." className={inp} />
          </div>

          <div className="flex justify-end pb-6">
            <button onClick={save} disabled={saving || !grossWeight || !tareWeight || !growerId}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-semibold shadow-sm min-h-[48px]">
              <Save size={16} />
              {saving ? "Saving…" : "Save Weighbridge Entry"}
              {grossWeight && tareWeight && <span className="bg-green-500/40 px-2 py-0.5 rounded text-xs">{netFinal.toFixed(1)} kg net</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── PENDING LEAF ─────────────────────────────────────────────────── */}
      {tab === "pending" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {pendingEntries.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-300" />
              <p className="text-gray-500 text-sm">No pending leaf — all batches processed.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Lot No.", "Grower", "Vehicle", "Net Kg", "Age", "Grade", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingEntries.map(e => {
                  const ageHrs = e.age_hours ?? 0;
                  const ageColor = ageHrs > 24 ? "text-red-600 font-bold" : ageHrs > 12 ? "text-amber-600 font-semibold" : "text-gray-500";
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-amber-50/40">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{e.lot_no}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{e.grower_name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{e.vehicle_reg_no || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">{e.net_after_moisture_kg.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-xs ${ageColor}`}>{ageHrs > 0 ? `${ageHrs.toFixed(0)} hrs` : "< 1 hr"}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">{e.leaf_grade}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => markProcessed(e.id)}
                          className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors min-h-[36px]">
                          <CheckCircle2 size={11} /> Mark Processed
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TODAY'S REGISTER ─────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {entries.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No entries for {fmtDateShort(date)}.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Lot No.", "Grower", "Vehicle", "Gross (kg)", "Tare (kg)", "Net (kg)", "Grade", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{e.lot_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{e.grower_name} <span className="text-gray-400 text-xs">[{e.grower_code}]</span></td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-xs">{e.vehicle_reg_no || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{e.gross_weight_kg.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">{e.tare_weight_kg.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">{e.net_after_moisture_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">{e.leaf_grade}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status === "processed" ? "bg-emerald-50 text-emerald-700" : e.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <td colSpan={3} className="px-4 py-3 text-gray-700">Total ({entries.length} entries)</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">{entries.reduce((s, e) => s + e.gross_weight_kg, 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{entries.reduce((s, e) => s + e.tare_weight_kg, 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{entries.reduce((s, e) => s + e.net_after_moisture_kg, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
