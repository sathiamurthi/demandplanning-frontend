"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Plus, Save, Printer, Leaf, X } from "lucide-react";

import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Grower { id: string; name: string; grower_code: string; }
interface Entry {
  id: string; grower_id: string; grower_name: string; grower_code: string;
  gross_weight: number; moisture_deduction_kg: number; net_weight: number; grade: string;
}
interface Batch { id: string; collection_date: string; total_kg: number; grower_count: number; status: string; }

export default function CollectionsPage() {
  const [growers, setGrowers]     = useState<Grower[]>([]);
  const [batch, setBatch]         = useState<Batch | null>(null);
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [showEntry, setShowEntry] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [batches, setBatches]     = useState<Batch[]>([]);

  // Entry form state
  const [growerId, setGrowerId]         = useState("");
  const [grossWeight, setGrossWeight]   = useState("");
  const [moistureKg, setMoistureKg]     = useState("0");
  const [grade, setGrade]               = useState("A");
  const [notes, setNotes]               = useState("");

  const netWeight = grossWeight
    ? (parseFloat(grossWeight) - parseFloat(moistureKg || "0")).toFixed(2)
    : "0.00";

  useEffect(() => {
    fetch(teaUrl("/growers"), { headers: teaAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setGrowers(d.data); });

    fetch(teaUrl("/collections/batches"), { headers: teaAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setBatches(d.data); });
  }, []);

  useEffect(() => { loadBatchForDate(); }, [date]);

  const loadBatchForDate = async () => {
    const r = await fetch(teaUrl(`/collections/batches?date=${date}`), { headers: teaAuthHeaders() });
    const d = await r.json();
    const b = d.success && d.data.length > 0 ? d.data[0] : null;
    setBatch(b);
    if (b) loadEntries(b.id);
    else setEntries([]);
  };

  const loadEntries = async (batchId: string) => {
    const r = await fetch(teaUrl(`/collections/batches/${batchId}/entries`), { headers: teaAuthHeaders() });
    const d = await r.json();
    if (d.success) setEntries(d.data);
  };

  const openBatch = async () => {
    const r = await fetch(teaUrl("/collections/batches"), {
      method: "POST",
      headers: teaAuthHeaders(),
      body: JSON.stringify({ collection_date: date }),
    });
    const d = await r.json();
    if (d.success) { setBatch(d.data); loadEntries(d.data.id); }
  };

  const addEntry = async () => {
    if (!batch || !growerId || !grossWeight) return;
    setSaving(true);
    const r = await fetch(teaUrl(`/collections/batches/${batch.id}/entries`), {
      method: "POST",
      headers: teaAuthHeaders(),
      body: JSON.stringify({
        grower_id: growerId,
        gross_weight: parseFloat(grossWeight),
        moisture_deduction_kg: parseFloat(moistureKg || "0"),
        grade,
        notes,
      }),
    });
    const d = await r.json();
    if (d.success) {
      setShowEntry(false);
      setGrowerId(""); setGrossWeight(""); setMoistureKg("0"); setGrade("A"); setNotes("");
      loadBatchForDate();
    }
    setSaving(false);
  };

  const printSlip = (entry: Entry) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const growerName = growers.find(g => g.id === entry.grower_id)?.name || entry.grower_name;
    w.document.write(`
      <html><head><title>Collection Slip</title>
      <style>body{font-family:monospace;padding:20px;max-width:300px}
      h2{border-bottom:1px solid #000;padding-bottom:8px}
      .row{display:flex;justify-content:space-between;margin:6px 0}
      .total{border-top:1px solid #000;margin-top:10px;padding-top:10px;font-weight:bold}
      .note{font-size:11px;color:#666;margin-top:16px}</style></head>
      <body>
        <h2>Tea Collection Slip</h2>
        <div class="row"><span>Date:</span><span>${date}</span></div>
        <div class="row"><span>Grower:</span><span>${growerName}</span></div>
        <div class="row"><span>Code:</span><span>${entry.grower_code || "—"}</span></div>
        <div class="row"><span>Grade:</span><span>${entry.grade}</span></div>
        <div class="row"><span>Gross Weight:</span><span>${entry.gross_weight} kg</span></div>
        <div class="row"><span>Moisture Deduction:</span><span>${Number(entry.moisture_deduction_kg).toFixed(2)} kg</span></div>
        <div class="total"><div class="row"><span>Net Weight:</span><span>${entry.net_weight} kg</span></div></div>
        <p class="note">Rate & payment will be settled at week end.</p>
      </body></html>
    `);
    w.document.close(); w.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center">
            <ClipboardList size={18} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Tea Collection</h1>
            <p className="text-white/40 text-xs">Record daily grower collections</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
        </div>
      </div>

      {/* Rate notice */}
      <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
        <span className="text-yellow-400 text-lg">ℹ</span>
        <p className="text-yellow-400/80 text-xs">
          Rates are set by the owner at week end (Saturday/Sunday). Payment is calculated during settlement, not at collection time.
        </p>
      </div>

      {/* Batch summary */}
      {batch ? (
        <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-5 flex items-center gap-5 flex-wrap">
          <div className="text-sm">
            <span className="text-white/40 text-xs">Batch Date </span>
            <span className="text-white font-medium">{batch.collection_date}</span>
          </div>
          <div className="flex gap-4">
            <div><p className="text-white font-bold">{Number(batch.total_kg).toFixed(2)} kg</p><p className="text-white/40 text-xs">Net KG</p></div>
            <div><p className="text-white font-bold">{batch.grower_count}</p><p className="text-white/40 text-xs">Growers</p></div>
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${batch.status === 'open' ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'}`}>
                {batch.status}
              </span>
            </div>
          </div>
          <button onClick={() => setShowEntry(true)} className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Plus size={15} /> Add Entry
          </button>
        </div>
      ) : (
        <div className="bg-[#161a23] border border-white/8 border-dashed rounded-xl p-8 mb-5 text-center">
          <Leaf size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/50 text-sm mb-3">No collection batch for {date}</p>
          <button onClick={openBatch} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
            Start Today's Collection
          </button>
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 && (
        <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-white/40 text-xs">Grower</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Grade</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Gross (kg)</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Moisture (kg)</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Net (kg)</th>
                <th className="px-4 py-3 text-right text-white/40 text-xs">Slip</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{e.grower_name}</p>
                    <p className="text-white/40 text-xs">{e.grower_code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${e.grade === "A" ? "bg-green-500/15 text-green-400" : e.grade === "B" ? "bg-blue-500/15 text-blue-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {e.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 text-sm">{Number(e.gross_weight).toFixed(2)}</td>
                  <td className="px-4 py-3 text-red-400/70 text-sm">−{Number(e.moisture_deduction_kg).toFixed(2)}</td>
                  <td className="px-4 py-3 text-white font-semibold text-sm">{Number(e.net_weight).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => printSlip(e)} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center ml-auto hover:bg-white/10" title="Print Slip">
                      <Printer size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Entry Modal */}
      {showEntry && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Add Collection Entry</h2>
              <button onClick={() => setShowEntry(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {/* Grower */}
              <div>
                <label className="text-white/50 text-xs block mb-1">Grower *</label>
                <select value={growerId} onChange={e => setGrowerId(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">Select grower...</option>
                  {growers.map(g => <option key={g.id} value={g.id}>{g.name} ({g.grower_code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Gross weight */}
                <div>
                  <label className="text-white/50 text-xs block mb-1">Gross Weight (kg) *</label>
                  <input type="number" value={grossWeight} onChange={e => setGrossWeight(e.target.value)} step="0.1"
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>

                {/* Moisture in kg */}
                <div>
                  <label className="text-white/50 text-xs block mb-1">Moisture Deduction (kg)</label>
                  <input type="number" value={moistureKg} onChange={e => setMoistureKg(e.target.value)} step="0.01" min="0"
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>

              {/* Grade */}
              <div>
                <label className="text-white/50 text-xs block mb-1">Grade</label>
                <div className="flex gap-2">
                  {["A", "B", "C"].map(g => (
                    <button key={g} onClick={() => setGrade(g)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${grade === g ? "bg-green-600/20 border-green-500/40 text-green-400" : "bg-[#0d0f14] border-white/10 text-white/50 hover:text-white"}`}>
                      Grade {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Net weight preview */}
              {grossWeight && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-white/50 text-sm">Net Weight:</span>
                  <span className="text-white font-bold text-lg">{netWeight} kg</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-white/50 text-xs block mb-1">Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEntry(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
              <button onClick={addEntry} disabled={saving || !growerId || !grossWeight}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
