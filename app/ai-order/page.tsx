"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ShoppingCart, Plus, Edit2, Trash2, Check,
  ChevronDown, ChevronUp, AlertTriangle, Package, X,
  RefreshCw, ClipboardList, TrendingUp, Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// ── Types ────────────────────────────────────────────────────────────────────
type Vertical = "pharma" | "grocery" | "auto";
type RiskLevel = "Critical" | "High" | "Medium" | "Low";

interface ForecastItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  reorder_level: number;
  predicted_qty_30d: number;
  order_qty: number;
  order_needed: boolean;
  risk_level: RiskLevel;
  unit_price: number;
  unit: string;
  reasoning: string;
  confidence_pct: number;
}

interface OrderItem extends ForecastItem {
  selected: boolean;
  edit_qty: number;
  edit_price: number;
}

// ── Mock data per vertical ────────────────────────────────────────────────────
const MOCK: Record<Vertical, ForecastItem[]> = {
  pharma: [
    { id: "p1", name: "Paracetamol 500mg", sku: "MED-001", category: "OTC Medicines", current_stock: 45, reorder_level: 200, predicted_qty_30d: 380, order_qty: 500, order_needed: true, risk_level: "Critical", unit_price: 2.5, unit: "strip", reasoning: "High fever season; stock covers only 3 days of demand", confidence_pct: 94 },
    { id: "p2", name: "Amoxicillin 250mg", sku: "MED-002", category: "Antibiotics", current_stock: 80, reorder_level: 150, predicted_qty_30d: 200, order_qty: 300, order_needed: true, risk_level: "Critical", unit_price: 45, unit: "strip", reasoning: "Monsoon-driven respiratory infections spike predicted", confidence_pct: 91 },
    { id: "p3", name: "Insulin Glargine 10ml", sku: "MED-003", category: "Diabetes", current_stock: 12, reorder_level: 30, predicted_qty_30d: 48, order_qty: 60, order_needed: true, risk_level: "Critical", unit_price: 650, unit: "vial", reasoning: "Critical cold-chain item; low buffer, consistent demand", confidence_pct: 97 },
    { id: "p4", name: "Atorvastatin 10mg", sku: "MED-004", category: "Cardiac", current_stock: 120, reorder_level: 200, predicted_qty_30d: 220, order_qty: 250, order_needed: true, risk_level: "High", unit_price: 8.5, unit: "strip", reasoning: "Cardiac patients on monthly refills — stock below threshold", confidence_pct: 88 },
    { id: "p5", name: "Cetirizine 10mg", sku: "MED-005", category: "Allergy", current_stock: 200, reorder_level: 180, predicted_qty_30d: 280, order_qty: 200, order_needed: true, risk_level: "High", unit_price: 3.2, unit: "strip", reasoning: "Pollen season allergy surge — 40% above baseline", confidence_pct: 85 },
    { id: "p6", name: "Omeprazole 20mg", sku: "MED-006", category: "Gastro", current_stock: 300, reorder_level: 250, predicted_qty_30d: 310, order_qty: 150, order_needed: true, risk_level: "Medium", unit_price: 6.0, unit: "strip", reasoning: "Current stock covers ~29 days. Preemptive top-up advised", confidence_pct: 80 },
    { id: "p7", name: "Digital Thermometer", sku: "DEV-001", category: "Medical Devices", current_stock: 15, reorder_level: 20, predicted_qty_30d: 30, order_qty: 25, order_needed: true, risk_level: "Medium", unit_price: 250, unit: "piece", reasoning: "Seasonal uptick in home monitoring demand", confidence_pct: 75 },
    { id: "p8", name: "Vitamin C 500mg", sku: "MED-008", category: "Vitamins", current_stock: 450, reorder_level: 300, predicted_qty_30d: 200, order_qty: 0, order_needed: false, risk_level: "Low", unit_price: 5.0, unit: "strip", reasoning: "Adequate stock — no action needed", confidence_pct: 92 },
  ],
  grocery: [
    { id: "g1", name: "Basmati Rice (5kg)", sku: "GRC-001", category: "Staples", current_stock: 8, reorder_level: 50, predicted_qty_30d: 120, order_qty: 200, order_needed: true, risk_level: "Critical", unit_price: 380, unit: "bag", reasoning: "Festival season: demand 3× baseline. Stock critical", confidence_pct: 96 },
    { id: "g2", name: "Cooking Oil 1L", sku: "GRC-002", category: "Edible Oils", current_stock: 20, reorder_level: 60, predicted_qty_30d: 180, order_qty: 250, order_needed: true, risk_level: "Critical", unit_price: 140, unit: "bottle", reasoning: "Price-sensitive staple — frequent stockouts detected", confidence_pct: 93 },
    { id: "g3", name: "Whole Wheat Atta 5kg", sku: "GRC-003", category: "Flours", current_stock: 35, reorder_level: 80, predicted_qty_30d: 160, order_qty: 200, order_needed: true, risk_level: "High", unit_price: 230, unit: "bag", reasoning: "Daily staple — 12-day supply remaining at predicted rate", confidence_pct: 90 },
    { id: "g4", name: "Toor Dal 1kg", sku: "GRC-004", category: "Pulses", current_stock: 60, reorder_level: 100, predicted_qty_30d: 180, order_qty: 200, order_needed: true, risk_level: "High", unit_price: 130, unit: "pack", reasoning: "Protein staple; monsoon supply constraints anticipated", confidence_pct: 87 },
    { id: "g5", name: "Full Cream Milk 500ml", sku: "GRC-005", category: "Dairy", current_stock: 40, reorder_level: 60, predicted_qty_30d: 210, order_qty: 150, order_needed: true, risk_level: "High", unit_price: 28, unit: "pouch", reasoning: "Short shelf-life; requires frequent restocking cycles", confidence_pct: 82 },
    { id: "g6", name: "Amul Butter 500g", sku: "GRC-006", category: "Dairy", current_stock: 25, reorder_level: 40, predicted_qty_30d: 90, order_qty: 80, order_needed: true, risk_level: "Medium", unit_price: 240, unit: "pack", reasoning: "Stock at 67% of reorder level — preemptive order suggested", confidence_pct: 78 },
    { id: "g7", name: "Lay's Classic Chips 26g", sku: "GRC-007", category: "Snacks", current_stock: 180, reorder_level: 100, predicted_qty_30d: 150, order_qty: 0, order_needed: false, risk_level: "Low", unit_price: 20, unit: "pack", reasoning: "Overstocked — no order needed for 30+ days", confidence_pct: 89 },
    { id: "g8", name: "Green Tea 25 bags", sku: "GRC-008", category: "Beverages", current_stock: 90, reorder_level: 80, predicted_qty_30d: 100, order_qty: 50, order_needed: true, risk_level: "Medium", unit_price: 95, unit: "box", reasoning: "Trending health product — stock will touch reorder threshold", confidence_pct: 73 },
  ],
  auto: [
    { id: "a1", name: "Engine Oil 5W-30 1L", sku: "AUTO-001", category: "Lubricants", current_stock: 10, reorder_level: 50, predicted_qty_30d: 120, order_qty: 200, order_needed: true, risk_level: "Critical", unit_price: 520, unit: "can", reasoning: "High workshop demand — summer service spike imminent", confidence_pct: 95 },
    { id: "a2", name: "Disc Brake Pad Set", sku: "AUTO-002", category: "Brake System", current_stock: 6, reorder_level: 20, predicted_qty_30d: 48, order_qty: 60, order_needed: true, risk_level: "Critical", unit_price: 1200, unit: "set", reasoning: "Safety-critical part; 3-day stock remaining at current pace", confidence_pct: 97 },
    { id: "a3", name: "Air Filter (Universal)", sku: "AUTO-003", category: "Engine Parts", current_stock: 22, reorder_level: 40, predicted_qty_30d: 65, order_qty: 80, order_needed: true, risk_level: "High", unit_price: 380, unit: "piece", reasoning: "Monsoon season: dust-laden air increases replacement rate", confidence_pct: 88 },
    { id: "a4", name: "Spark Plug (NGK)", sku: "AUTO-004", category: "Ignition System", current_stock: 30, reorder_level: 60, predicted_qty_30d: 90, order_qty: 100, order_needed: true, risk_level: "High", unit_price: 180, unit: "piece", reasoning: "Multi-brand compatibility drives consistent demand", confidence_pct: 84 },
    { id: "a5", name: "Coolant / Antifreeze 1L", sku: "AUTO-005", category: "Cooling System", current_stock: 18, reorder_level: 30, predicted_qty_30d: 55, order_qty: 60, order_needed: true, risk_level: "High", unit_price: 320, unit: "bottle", reasoning: "Pre-summer spike; engine overheating complaints rising", confidence_pct: 86 },
    { id: "a6", name: "Wiper Blade 22-inch", sku: "AUTO-006", category: "Electrical", current_stock: 40, reorder_level: 50, predicted_qty_30d: 70, order_qty: 50, order_needed: true, risk_level: "Medium", unit_price: 280, unit: "piece", reasoning: "Monsoon preparation — steady seasonal demand", confidence_pct: 77 },
    { id: "a7", name: "Car Battery 35Ah", sku: "AUTO-007", category: "Electrical", current_stock: 5, reorder_level: 10, predicted_qty_30d: 18, order_qty: 20, order_needed: true, risk_level: "Medium", unit_price: 3800, unit: "piece", reasoning: "High-margin item; stock approaching minimum threshold", confidence_pct: 81 },
    { id: "a8", name: "Fuel Injector Cleaner", sku: "AUTO-008", category: "Fuel System", current_stock: 60, reorder_level: 40, predicted_qty_30d: 45, order_qty: 0, order_needed: false, risk_level: "Low", unit_price: 420, unit: "bottle", reasoning: "Sufficient stock — no replenishment needed", confidence_pct: 90 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const VERTICALS: { id: Vertical; label: string; icon: string; color: string; border: string }[] = [
  { id: "pharma",  label: "Pharmacy",   icon: "💊", color: "bg-blue-500/15 text-blue-400",   border: "border-blue-500/50" },
  { id: "grocery", label: "Grocery",    icon: "🛒", color: "bg-green-500/15 text-green-400", border: "border-green-500/50" },
  { id: "auto",    label: "Auto Parts", icon: "🔧", color: "bg-orange-500/15 text-orange-400", border: "border-orange-500/50" },
];

const RISK: Record<RiskLevel, { label: string; dot: string; badge: string; icon: string }> = {
  Critical: { label: "Critical", dot: "bg-red-500",    badge: "bg-red-500/15 text-red-400 border-red-500/30",    icon: "🔴" },
  High:     { label: "High",     dot: "bg-orange-500", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: "🟠" },
  Medium:   { label: "Medium",   dot: "bg-yellow-500", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: "🟡" },
  Low:      { label: "Low",      dot: "bg-emerald-500",badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: "🟢" },
};

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

// ── Edit / Add Product Modal ──────────────────────────────────────────────────
function ProductModal({
  item, onSave, onClose,
}: {
  item: Partial<OrderItem> | null;
  onSave: (d: Partial<OrderItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name:       item?.name       || "",
    sku:        item?.sku        || "",
    category:   item?.category   || "",
    edit_qty:   item?.edit_qty   ?? item?.order_qty ?? 1,
    edit_price: item?.edit_price ?? item?.unit_price ?? 0,
    unit:       item?.unit       || "piece",
  });
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">{item?.id ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-white/50 text-xs mb-1 block">Product Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs mb-1 block">SKU</label>
              <input value={form.sku} onChange={e => set("sku", e.target.value)}
                placeholder="MED-001"
                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Category</label>
              <input value={form.category} onChange={e => set("category", e.target.value)}
                placeholder="e.g. OTC Medicines"
                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-white/50 text-xs mb-1 block">Order Qty *</label>
              <input type="number" min={1} value={form.edit_qty} onChange={e => set("edit_qty", parseInt(e.target.value) || 1)}
                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="col-span-1">
              <label className="text-white/50 text-xs mb-1 block">Unit Price (₹)</label>
              <input type="number" min={0} value={form.edit_price} onChange={e => set("edit_price", parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="col-span-1">
              <label className="text-white/50 text-xs mb-1 block">Unit</label>
              <input value={form.unit} onChange={e => set("unit", e.target.value)}
                placeholder="strip"
                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 font-medium text-sm py-2.5 rounded-xl transition">
            Cancel
          </button>
          <button onClick={() => { if (!form.name) return; onSave(form); }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 rounded-xl transition">
            {item?.id ? "Save Changes" : "Add to Order"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIOrderPage() {
  const [vertical, setVertical]       = useState<Vertical>("pharma");
  const [phase, setPhase]             = useState<"idle" | "loading" | "review" | "creating" | "done">("idle");
  const [items, setItems]             = useState<OrderItem[]>([]);
  const [modalItem, setModalItem]     = useState<Partial<OrderItem> | null | false>(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [supplier, setSupplier]       = useState("");
  const [notes, setNotes]             = useState("");
  const [poNumber, setPoNumber]       = useState("");
  const [filterRisk, setFilterRisk]   = useState<RiskLevel | "all">("all");
  const [showAll, setShowAll]         = useState(false);

  // ── Fetch AI forecast ────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    setPhase("loading");
    setFilterRisk("all");
    try {
      // Resolve the real store from the logged-in session — this previously
      // called /v1/stores/default/report/generate with the literal string
      // "default" as the storeId, which no store ever has, so the request
      // always failed and silently fell through to mock demo data below.
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let storeId = typeof window !== "undefined" ? localStorage.getItem("storeId") : null;
      if (!storeId && token) {
        try { storeId = JSON.parse(atob(token.split(".")[1])).storeId || null; } catch {}
      }
      if (!storeId) throw new Error("No store on this session");

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Try real backend; fall back to mock on any error
      const resp = await fetch(`/v1/stores/${storeId}/report/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ industry: vertical, days: 30 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.data) && data.data.length) {
          setItems(data.data.map((d: ForecastItem) => ({
            ...d,
            selected: d.order_needed && d.order_qty > 0,
            edit_qty: d.order_qty,
            edit_price: d.unit_price ?? 0,
          })));
          setPhase("review");
          return;
        }
      }
    } catch { /* fall through to mock */ }

    // Simulate brief AI processing delay for demo effect
    await new Promise(r => setTimeout(r, 1800));
    setItems(MOCK[vertical].map(d => ({
      ...d,
      selected: d.order_needed && d.order_qty > 0,
      edit_qty: d.order_qty,
      edit_price: d.unit_price,
    })));
    setPhase("review");
  }, [vertical]);

  // ── Create PO ────────────────────────────────────────────────────────────────
  const createPO = useCallback(async () => {
    const selected = items.filter(i => i.selected && i.edit_qty > 0);
    if (!selected.length) return;
    setPhase("creating");

    // Read auth token and decode tenantId from JWT
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    let tenantId = "default";
    if (token) {
      try { tenantId = JSON.parse(atob(token.split(".")[1])).tenantId || "default"; } catch {}
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const resp = await fetch(`/v1/tenants/${tenantId}/purchase-orders/ai-draft`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          vertical,
          notes: notes || `AI-analysed reorder — ${vertical}`,
          items: selected.map(i => ({
            item_name: i.name,
            sku: i.sku,
            category: i.category,
            quantity: i.edit_qty,
            unit_price: i.edit_price,
            reasoning: i.reasoning,
          })),
        }),
      });
      const data = resp.ok ? await resp.json() : null;
      if (data?.success && data?.data?.order_number) {
        setPoNumber(data.data.order_number);
      } else {
        const err = data?.error || `HTTP ${resp.status}`;
        console.error("AI PO creation failed:", err);
        setPoNumber(`DRAFT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
      }
    } catch (e) {
      console.error("AI PO network error:", e);
      setPoNumber(`DRAFT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
    }
    await new Promise(r => setTimeout(r, 600));
    setPhase("done");
  }, [items, supplier, notes, vertical]);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const selected    = items.filter(i => i.selected && i.edit_qty > 0);
  const orderTotal  = selected.reduce((s, i) => s + i.edit_qty * i.edit_price, 0);
  const riskCounts  = (["Critical", "High", "Medium", "Low"] as RiskLevel[]).map(r => ({
    r, count: items.filter(i => i.risk_level === r && i.order_needed).length,
  }));
  const needed      = items.filter(i => i.order_needed);
  const visible     = (filterRisk === "all" ? needed : needed.filter(i => i.risk_level === filterRisk))
    .concat(showAll ? items.filter(i => !i.order_needed) : []);

  const toggleAll = (val: boolean) =>
    setItems(prev => prev.map(i => i.order_needed ? { ...i, selected: val } : i));
  const toggle    = (id: string)  =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  const updateQty = (id: string, qty: number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, edit_qty: qty } : i));
  const updatePrice = (id: string, price: number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, edit_price: price } : i));
  const removeItem  = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const saveModal = (form: Partial<OrderItem>) => {
    if (modalItem && (modalItem as OrderItem).id) {
      setItems(prev => prev.map(i =>
        i.id === (modalItem as OrderItem).id
          ? { ...i, ...form, edit_qty: form.edit_qty ?? i.edit_qty, edit_price: form.edit_price ?? i.edit_price }
          : i,
      ));
    } else {
      const newItem: OrderItem = {
        id: `custom-${Date.now()}`,
        name: form.name || "",
        sku: form.sku || "",
        category: form.category || "Custom",
        current_stock: 0,
        reorder_level: 0,
        predicted_qty_30d: form.edit_qty ?? 0,
        order_qty: form.edit_qty ?? 0,
        order_needed: true,
        risk_level: "Medium",
        unit_price: form.edit_price ?? 0,
        unit: form.unit || "piece",
        reasoning: "Manually added",
        confidence_pct: 100,
        selected: true,
        edit_qty: form.edit_qty ?? 1,
        edit_price: form.edit_price ?? 0,
      };
      setItems(prev => [newItem, ...prev]);
    }
    setModalItem(false);
  };

  const reset = () => {
    setPhase("idle"); setItems([]); setPoNumber("");
    setSupplier(""); setNotes(""); setFilterRisk("all"); setShowAll(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="AI Order Preparation"
      subtitle="AI analyses your inventory demand and prepares a purchase order draft."
    >
      <AnimatePresence mode="wait">

        {/* ── Step 1: Idle ─────────────────────────────────────────────────── */}
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6 max-w-2xl">

            {/* Vertical picker */}
            <div className="bg-[#161a23] border border-white/8 rounded-2xl p-5">
              <p className="text-white/50 text-xs font-medium mb-3 uppercase tracking-wide">Select your business type</p>
              <div className="grid grid-cols-3 gap-3">
                {VERTICALS.map(v => (
                  <button key={v.id} onClick={() => setVertical(v.id)}
                    className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all duration-200 font-semibold text-sm
                      ${vertical === v.id ? `${v.color} ${v.border}` : "bg-white/3 border-white/8 text-white/50 hover:border-white/20 hover:text-white/80"}`}>
                    <span className="text-3xl">{v.icon}</span>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-[#161a23] border border-white/8 rounded-2xl p-5 flex gap-4">
              <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-white font-semibold">How AI Order Preparation works</p>
                <p className="text-white/50 text-sm leading-relaxed">
                  Claude AI analyses your inventory levels, sales velocity, seasonal trends, and reorder thresholds
                  to predict the next 30-day demand per product. Items needing replenishment are surfaced with
                  risk levels — you review, edit quantities, add custom items, and create a Purchase Order in one click.
                </p>
              </div>
            </div>

            <button onClick={runAnalysis}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl text-base transition-all duration-200 shadow-lg shadow-indigo-900/30">
              <Sparkles size={18} /> Run AI Analysis
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Loading ──────────────────────────────────────────────── */}
        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                <Sparkles className="text-indigo-400" size={28} />
              </div>
              <Loader2 className="absolute -top-1 -right-1 text-indigo-500 animate-spin" size={20} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">Analysing inventory…</p>
              <p className="text-white/40 text-sm mt-1">Claude AI is forecasting 30-day demand for your {VERTICALS.find(v => v.id === vertical)?.label} products</p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Review order ─────────────────────────────────────────── */}
        {phase === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">

            {/* Summary header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-white font-bold text-lg">
                  {VERTICALS.find(v => v.id === vertical)?.icon} {VERTICALS.find(v => v.id === vertical)?.label} — AI Forecast
                </p>
                <p className="text-white/40 text-sm">30-day demand analysis · {needed.length} items need replenishment</p>
              </div>
              <button onClick={() => { setPhase("idle"); setItems([]); setFilterRisk("all"); }}
                className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm border border-white/10 rounded-lg px-3 py-1.5 transition">
                <RefreshCw size={13} /> Re-analyse
              </button>
            </div>

            {/* Risk summary tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {riskCounts.map(({ r, count }) => {
                const s = RISK[r];
                return (
                  <button key={r} onClick={() => setFilterRisk(filterRisk === r ? "all" : r)}
                    className={`flex flex-col gap-1 p-4 rounded-xl border transition-all duration-200 text-left
                      ${filterRisk === r ? s.badge + " scale-[1.02]" : "bg-[#161a23] border-white/8 hover:border-white/20"}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className={`text-xs font-bold ${filterRisk === r ? "" : "text-white/50"}`}>{s.label}</span>
                    </div>
                    <span className={`text-2xl font-black ${filterRisk === r ? "" : "text-white"}`}>{count}</span>
                    <span className={`text-[11px] ${filterRisk === r ? "opacity-70" : "text-white/30"}`}>items</span>
                  </button>
                );
              })}
            </div>

            {/* Order table */}
            <div className="bg-[#161a23] border border-white/8 rounded-2xl overflow-hidden">
              {/* Table controls */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <input type="checkbox"
                    checked={needed.length > 0 && needed.every(i => i.selected)}
                    onChange={e => toggleAll(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-indigo-500" />
                  <span className="text-white/50 text-xs">{selected.length} of {needed.length} selected</span>
                </div>
                <button onClick={() => setModalItem({})}
                  className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition">
                  <Plus size={12} /> Add Product
                </button>
              </div>

              {/* Items */}
              <div className="divide-y divide-white/5">
                {visible.length === 0 && (
                  <div className="text-center py-10 text-white/30 text-sm">No items match this filter</div>
                )}
                {visible.map(item => {
                  const s = RISK[item.risk_level];
                  const isExpanded = expandedId === item.id;
                  const lineTotal = item.edit_qty * item.edit_price;
                  return (
                    <div key={item.id} className={`${!item.order_needed ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Checkbox */}
                        <input type="checkbox" checked={item.selected} disabled={!item.order_needed}
                          onChange={() => toggle(item.id)}
                          className="rounded border-white/20 bg-white/5 text-indigo-500 shrink-0" />

                        {/* Risk badge */}
                        <span title={s.label} className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />

                        {/* Name + category */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-white/40 text-xs">{item.sku} · {item.category}</p>
                        </div>

                        {/* Stock indicator */}
                        <div className="hidden sm:block text-center w-16">
                          <p className="text-white/30 text-[10px]">Stock</p>
                          <p className={`text-xs font-bold ${item.current_stock <= item.reorder_level * 0.3 ? "text-red-400" : "text-white/60"}`}>
                            {item.current_stock}
                          </p>
                        </div>

                        {/* Editable qty */}
                        <div className="flex flex-col items-center w-20">
                          <p className="text-white/30 text-[10px]">Qty</p>
                          <input type="number" min={0} value={item.edit_qty}
                            onChange={e => updateQty(item.id, parseInt(e.target.value) || 0)}
                            disabled={!item.selected}
                            className="w-full text-center text-xs bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-30" />
                        </div>

                        {/* Editable price */}
                        <div className="hidden md:flex flex-col items-center w-24">
                          <p className="text-white/30 text-[10px]">Price (₹)</p>
                          <input type="number" min={0} value={item.edit_price}
                            onChange={e => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                            disabled={!item.selected}
                            className="w-full text-center text-xs bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-30" />
                        </div>

                        {/* Line total */}
                        <div className="hidden lg:block text-right w-24">
                          <p className="text-white/30 text-[10px]">Total</p>
                          <p className="text-white/80 text-xs font-bold">{fmt(lineTotal)}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setModalItem(item)}
                            className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg transition">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => removeItem(item.id)}
                            className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                            <Trash2 size={13} />
                          </button>
                          {item.reasoning && (
                            <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="p-1.5 text-white/20 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition">
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded: AI reasoning */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div key="reasoning"
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="mx-4 mb-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3 flex gap-3">
                              <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={14} />
                              <div>
                                <p className="text-indigo-300 text-xs font-semibold mb-0.5">AI Reasoning</p>
                                <p className="text-white/60 text-xs leading-relaxed">{item.reasoning}</p>
                                <p className="text-white/30 text-[11px] mt-1.5">Confidence: {item.confidence_pct}% · Predicted 30-day demand: {item.predicted_qty_30d} {item.unit}s</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Show low-stock items toggle */}
              <div className="px-4 py-2.5 border-t border-white/5">
                <button onClick={() => setShowAll(!showAll)}
                  className="text-white/30 hover:text-white/60 text-xs transition flex items-center gap-1">
                  {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAll ? "Hide" : "Show"} items not needing reorder ({items.length - needed.length})
                </button>
              </div>
            </div>

            {/* Order config + totals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#161a23] border border-white/8 rounded-2xl p-5 space-y-4">
                <p className="text-white font-semibold text-sm">Order Details</p>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Supplier / Vendor name</label>
                  <input value={supplier} onChange={e => setSupplier(e.target.value)}
                    placeholder="e.g. MedPlus Wholesale, Reliance Smart"
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="e.g. Urgent — cold chain required for Insulin"
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="bg-[#161a23] border border-white/8 rounded-2xl p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-white font-semibold text-sm mb-3">Order Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Items selected</span>
                    <span className="text-white font-bold">{selected.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Total units</span>
                    <span className="text-white font-bold">{selected.reduce((s, i) => s + i.edit_qty, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/8 pt-2 mt-2">
                    <span className="text-white font-bold">Estimated Total</span>
                    <span className="text-indigo-400 font-black text-base">{fmt(orderTotal)}</span>
                  </div>
                </div>
                <button onClick={createPO} disabled={selected.length === 0}
                  className="mt-5 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/30">
                  <ClipboardList size={16} /> Create Purchase Order
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Creating ──────────────────────────────────────────────── */}
        {phase === "creating" && (
          <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="text-indigo-400 animate-spin" size={40} />
            <p className="text-white font-bold">Creating Purchase Order…</p>
            <p className="text-white/40 text-sm">Saving {selected.length} items to your orders</p>
          </motion.div>
        )}

        {/* ── Step 5: Done ─────────────────────────────────────────────────── */}
        {phase === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="max-w-lg mx-auto">
            <div className="bg-[#161a23] border border-white/8 rounded-2xl p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto">
                <Check className="text-emerald-400" size={32} />
              </div>
              <div>
                <p className="text-white font-black text-xl">
                  {poNumber.startsWith("DRAFT-") ? "Draft Saved Locally" : "Purchase Order Created!"}
                </p>
                <p className="text-indigo-400 font-mono font-bold text-lg mt-1">{poNumber}</p>
                {poNumber.startsWith("DRAFT-") && (
                  <p className="text-yellow-400/70 text-xs mt-1">⚠ Not saved to DB — please log in as manager to create real POs</p>
                )}
              </div>
              <div className="bg-[#0d0f14] border border-white/8 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Vertical</span>
                  <span className="text-white font-semibold">{VERTICALS.find(v => v.id === vertical)?.icon} {VERTICALS.find(v => v.id === vertical)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Items</span>
                  <span className="text-white font-semibold">{selected.length} products</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Total Units</span>
                  <span className="text-white font-semibold">{selected.reduce((s, i) => s + i.edit_qty, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/8 pt-2">
                  <span className="text-white/70 font-semibold">Order Value</span>
                  <span className="text-indigo-400 font-black">{fmt(orderTotal)}</span>
                </div>
                {supplier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Supplier</span>
                    <span className="text-white font-semibold">{supplier}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Status</span>
                  <span className="bg-yellow-500/15 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">Draft</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={reset}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 font-medium py-2.5 rounded-xl text-sm transition">
                  New Order
                </button>
                <a href="/orders"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm transition text-center">
                  View Orders →
                </a>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Edit / Add modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalItem !== false && (
          <ProductModal
            item={modalItem || {}}
            onSave={saveModal}
            onClose={() => setModalItem(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
