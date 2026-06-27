"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { getTenantId } from "@/lib/utils";
import { useStore } from "../appshell";
import {
  Package, Plus, RefreshCw, Pencil, Trash2, X, Search,
  AlertTriangle, TrendingDown, Upload, Download,
  ChevronUp, ChevronDown, Sparkles, CheckCircle2,
} from "lucide-react";

/* ── Types ── */
interface Item {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  current_stock: string;
  reorder_level: string;
  max_stock_level: string | null;
  selling_price: string | null;
  purchase_price: string | null;
  gst_rate: string;
  unit_symbol: string | null;
  category_name: string | null;
  supplier_name: string | null;
  expiry_date: string | null;
  is_seasonal: boolean;
  season_flag: string | null;
  description: string | null;
  is_active: boolean;
  rack_location: string | null;
}

interface Category { id: string; name: string; }

/* ── Helpers ── */
const fmtINR = (v: string | number | null) =>
  v == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(Number(v));

const stockPct = (item: Item) => {
  const cur = parseFloat(item.current_stock);
  const max = item.max_stock_level ? parseFloat(item.max_stock_level) : parseFloat(item.reorder_level) * 5;
  return max > 0 ? Math.min(100, Math.round((cur / max) * 100)) : 0;
};

const stockStatus = (item: Item) => {
  const cur = parseFloat(item.current_stock);
  const rl  = parseFloat(item.reorder_level);
  if (cur === 0)       return { label: "Out of stock", color: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50"    };
  if (cur <= rl)       return { label: "Low stock",    color: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" };
  if (cur <= rl * 1.5) return { label: "Near reorder", color: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-50"  };
  return               { label: "In stock",    color: "bg-emerald-400",text: "text-emerald-700",bg: "bg-emerald-50" };
};

/* ── Domain badge ── */
function DomainBadge({ cat }: { cat: string | null }) {
  if (!cat) return null;
  const colors: Record<string, string> = {
    antibiotics: "bg-teal-100 text-teal-700",
    "pain relief": "bg-rose-100 text-rose-700",
    vitamins: "bg-purple-100 text-purple-700",
    otc: "bg-blue-100 text-blue-700",
    default: "bg-gray-100 text-gray-600",
  };
  const key = cat.toLowerCase();
  const cls = Object.keys(colors).find(k => key.includes(k)) ? colors[Object.keys(colors).find(k => key.includes(k))!] : colors.default;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {cat}
    </span>
  );
}

/* ── Stock bar ── */
function StockBar({ item }: { item: Item }) {
  const pct = stockPct(item);
  const st  = stockStatus(item);
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${st.color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

/* ── Item form modal ── */
interface ItemFormProps {
  tenantId: string;
  storeId: string;
  categories: Category[];
  editing: Item | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM = {
  name: "", sku: "", brand: "", description: "",
  categoryId: "", currentStock: "", reorderLevel: "",
  maxStockLevel: "", sellingPrice: "", purchasePrice: "",
  gstRate: "0", isSeasonal: false, rackLocation: "",
  batchNumber: "", manufactureDate: "", expiryDate: "",
};

function ItemFormModal({ tenantId, storeId, categories, editing, onClose, onSaved }: ItemFormProps) {
  const [form, setForm]   = useState(() => editing ? {
    name: editing.name, sku: editing.sku ?? "", brand: editing.brand ?? "",
    description: editing.description ?? "", categoryId: "",
    currentStock: editing.current_stock, reorderLevel: editing.reorder_level,
    maxStockLevel: editing.max_stock_level ?? "", sellingPrice: editing.selling_price ?? "",
    purchasePrice: editing.purchase_price ?? "", gstRate: editing.gst_rate,
    isSeasonal: editing.is_seasonal, rackLocation: editing.rack_location ?? "",
    batchNumber: (editing as any).batch_number ?? "",
    manufactureDate: (editing as any).manufacture_date ? (editing as any).manufacture_date.slice(0,10) : "",
    expiryDate: editing.expiry_date ? editing.expiry_date.slice(0,10) : "",
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const aiSuggest = async () => {
    if (!form.name.trim() || form.name.length < 2) return;
    setAiLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/stores/${storeId}/report/suggest`,
        { name: form.name }
      );
      if (res.success && res.data) {
        const d = res.data;
        setForm(f => ({
          ...f,
          sku:          d.suggestedSku     ?? f.sku,
          reorderLevel: String(d.suggestedReorderLevel ?? f.reorderLevel),
          isSeasonal:   d.isSeasonal       ?? f.isSeasonal,
        }));
      }
    } catch { /* ignore AI suggestion errors */ }
    setAiLoading(false);
  };

  const save = async () => {
    if (!form.name.trim()) { setErr("Name is required"); return; }
    setSaving(true); setErr(null);
    try {
      const payload = {
        storeId,
        name:          form.name,
        sku:           form.sku   || null,
        brand:         form.brand || null,
        description:   form.description || null,
        categoryId:    form.categoryId  || null,
        currentStock:  parseFloat(form.currentStock)  || 0,
        reorderLevel:  parseFloat(form.reorderLevel)  || 0,
        maxStockLevel: form.maxStockLevel ? parseFloat(form.maxStockLevel) : null,
        sellingPrice:  form.sellingPrice  ? parseFloat(form.sellingPrice)  : null,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        gstRate:       parseFloat(form.gstRate) || 0,
        isSeasonal:    form.isSeasonal,
        rackLocation:  form.rackLocation || null,
        batchNumber:   form.batchNumber || null,
        manufactureDate: form.manufactureDate || null,
        expiryDate:    form.expiryDate || null,
      };
      if (editing) {
        await apiPut(`/tenants/${tenantId}/stores/${storeId}/items/${editing.id}`, payload);
      } else {
        await apiPost(`/tenants/${tenantId}/stores/${storeId}/items`, payload);
      }
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: string; label: string; type?: string; span?: boolean }[] = [
    { key: "currentStock",  label: "Current stock"  },
    { key: "reorderLevel",  label: "Reorder level"  },
    { key: "maxStockLevel", label: "Max stock"       },
    { key: "sellingPrice",  label: "Selling price (₹)" },
    { key: "purchasePrice", label: "Purchase price (₹)" },
    { key: "gstRate",       label: "GST rate (%)"   },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {editing ? "Edit item" : "Add new item"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name + AI */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Item name *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-gold-400"
                placeholder="e.g. Paracetamol 500mg"
              />
              <button
                onClick={aiSuggest}
                disabled={aiLoading || form.name.length < 2}
                className="flex items-center gap-1.5 rounded-xl border border-gold-200 bg-gold-50
                           px-3 py-2.5 text-xs font-semibold text-gold-600 hover:bg-gold-100
                           transition-colors disabled:opacity-40"
                title="AI suggest fields"
              >
                <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                AI fill
              </button>
            </div>
          </div>

          {/* SKU + Brand */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "sku",   label: "SKU",   placeholder: "MED-001"    },
              { key: "brand", label: "Brand", placeholder: "e.g. Cipla" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={(form as any)[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
            ))}
          </div>

          {/* Rack location */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Rack / Shelf Location
            </label>
            <input
              type="text"
              value={form.rackLocation}
              onChange={e => set("rackLocation", e.target.value)}
              placeholder="e.g. A-3, Shelf 2B, Row 5"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          {/* Batch / Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Batch No.</label>
              <input type="text" value={form.batchNumber} onChange={e => set("batchNumber", e.target.value)}
                placeholder="e.g. B2024-01"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mfg. Date</label>
              <input type="date" value={form.manufactureDate} onChange={e => set("manufactureDate", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={e => set("categoryId", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Numeric fields grid */}
          <div className="grid grid-cols-3 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {f.label}
                </label>
                <input
                  type="number"
                  value={(form as any)[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-gold-400"
                  min="0"
                />
              </div>
            ))}
          </div>

          {/* Seasonal toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${form.isSeasonal ? "bg-gold-400" : "bg-gray-200"}`}
              onClick={() => set("isSeasonal", !form.isSeasonal)}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform
                               ${form.isSeasonal ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Seasonal item</span>
          </label>

          {err && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600
                       hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update item" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
type SortKey = "name" | "current_stock" | "selling_price" | "reorder_level";

function ItemsPageInner() {
  const { storeId, loading: storeLoading } = useStore();
  const tenantId = getTenantId() ?? "";
  const searchParams = useSearchParams();

  const [items,      setItems]      = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [showForm,   setShowForm]   = useState(() => searchParams.get("quick") === "1");
  const [editing,    setEditing]    = useState<Item | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [sortKey,    setSortKey]    = useState<SortKey>("name");
  const [sortAsc,    setSortAsc]    = useState(true);
  const [filterLow,  setFilterLow]  = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!tenantId || !storeId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        apiGet<{ success: boolean; data: Item[] }>(`/tenants/${tenantId}/stores/${storeId}/items`),
        apiGet<{ success: boolean; data: Category[] }>(`/tenants/${tenantId}/categories`),
      ]);
      setItems(itemsRes.data ?? []);
      setCategories(catsRes.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [tenantId, storeId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item? This action cannot be undone.")) return;
    setDeleting(id);
    try {
      await apiDelete(`/tenants/${tenantId}/stores/${storeId}/items/${id}`);
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : sortAsc
      ? <ChevronUp className="h-3 w-3 ml-0.5" />
      : <ChevronDown className="h-3 w-3 ml-0.5" />;

  const lowStockItems = items.filter(i => {
    const cur = parseFloat(i.current_stock), rl = parseFloat(i.reorder_level);
    return cur <= rl;
  });

  const filtered = items
    .filter(i => {
      if (filterLow) { const cur=parseFloat(i.current_stock),rl=parseFloat(i.reorder_level); return cur<=rl; }
      return true;
    })
    .filter(i =>
      !search || [i.name, i.sku, i.brand, i.category_name]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const av = sortKey === "name" ? a.name : String((a as any)[sortKey] ?? "0");
      const bv = sortKey === "name" ? b.name : String((b as any)[sortKey] ?? "0");
      const cmp = sortKey === "name" ? av.localeCompare(bv) : parseFloat(av) - parseFloat(bv);
      return sortAsc ? cmp : -cmp;
    });

  const totalItems   = items.length;
  const totalValue   = items.reduce((s, i) => s + parseFloat(i.current_stock) * parseFloat(i.selling_price ?? "0"), 0);
  const outOfStock   = items.filter(i => parseFloat(i.current_stock) === 0).length;

  if (storeLoading || loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="theme-content min-h-full p-5 sm:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Package className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory Items</h1>
            <p className="text-xs text-gray-400 mt-0.5">{totalItems} items · {lowStockItems.length} need attention</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2
                       text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2
                       text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total items",    value: String(totalItems),         icon: Package, bg: "bg-indigo-50", ic: "text-indigo-500" },
          { label: "Stock value",    value: fmtINR(totalValue),         icon: TrendingDown, bg: "bg-emerald-50", ic: "text-emerald-500" },
          { label: "Out of stock",   value: String(outOfStock),         icon: AlertTriangle, bg: "bg-red-50", ic: "text-red-500" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon className={`h-5 w-5 ${k.ic}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{k.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alert banners */}
      {lowStockItems.filter(i => !dismissedAlerts.has(i.id)).slice(0, 3).map(i => (
        <div key={i.id}
          className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-orange-900">{i.name}</span>
            <span className="text-xs text-orange-600 ml-2">
              {parseFloat(i.current_stock) === 0
                ? "Out of stock"
                : `Low stock — ${parseFloat(i.current_stock)} units (reorder at ${parseFloat(i.reorder_level)})`}
            </span>
          </div>
          <button
            onClick={() => setDismissedAlerts(s => new Set([...s, i.id]))}
            className="rounded p-1 hover:bg-orange-100 text-orange-400 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        {/* Search + filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <button
            onClick={() => setFilterLow(f => !f)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors
              ${filterLow
                ? "bg-orange-500 border-orange-500 text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Low stock {filterLow ? "✓" : `(${lowStockItems.length})`}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-10 w-10 text-gray-200 mb-3" />
            <p className="font-semibold text-gray-500">No items found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? "Try a different search term." : "Add your first inventory item."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                  <th className="pb-3 text-left">
                    <button className="flex items-center hover:text-gray-600 transition-colors"
                      onClick={() => toggleSort("name")}>
                      Item <SortIcon k="name" />
                    </button>
                  </th>
                  <th className="pb-3 text-left">SKU / Brand</th>
                  <th className="pb-3 text-left">Category</th>
                  <th className="pb-3 text-right">
                    <button className="flex items-center ml-auto hover:text-gray-600 transition-colors"
                      onClick={() => toggleSort("current_stock")}>
                      Stock <SortIcon k="current_stock" />
                    </button>
                  </th>
                  <th className="pb-3 text-left w-36">Level</th>
                  <th className="pb-3 text-right">
                    <button className="flex items-center ml-auto hover:text-gray-600 transition-colors"
                      onClick={() => toggleSort("selling_price")}>
                      Price <SortIcon k="selling_price" />
                    </button>
                  </th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => {
                  const st = stockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Name */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                                          bg-indigo-50 text-indigo-600 text-xs font-bold">
                            {item.name.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                            {item.is_seasonal && (
                              <span className="text-[10px] text-gold-600 font-medium">Seasonal</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU / Brand */}
                      <td className="py-3.5">
                        <p className="font-mono text-xs text-gray-500">{item.sku ?? "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.brand ?? ""}</p>
                        {item.rack_location && (
                          <p className="text-xs text-indigo-500 mt-0.5">📍 {item.rack_location}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5">
                        <DomainBadge cat={item.category_name} />
                        {!item.category_name && <span className="text-xs text-gray-300">—</span>}
                      </td>

                      {/* Stock count */}
                      <td className="py-3.5 text-right tabular-nums">
                        <p className="font-semibold text-gray-900">
                          {parseFloat(item.current_stock).toLocaleString()}
                          <span className="text-xs text-gray-400 font-normal ml-1">{item.unit_symbol ?? "pcs"}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          reorder @ {parseFloat(item.reorder_level).toLocaleString()}
                        </p>
                      </td>

                      {/* Stock bar */}
                      <td className="py-3.5"><StockBar item={item} /></td>

                      {/* Price */}
                      <td className="py-3.5 text-right">
                        <p className="font-semibold text-gray-900">{fmtINR(item.selling_price)}</p>
                        {item.gst_rate && parseFloat(item.gst_rate) > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">+{item.gst_rate}% GST</p>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1
                                          text-[10px] font-bold uppercase ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditing(item); setShowForm(true); }}
                            className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100
                                       text-gray-500 hover:text-gray-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="rounded-lg border border-red-100 p-1.5 hover:bg-red-50
                                       text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ItemFormModal
          tenantId={tenantId}
          storeId={storeId}
          categories={categories}
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense>
      <ItemsPageInner />
    </Suspense>
  );
}
