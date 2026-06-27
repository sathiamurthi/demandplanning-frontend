"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { getTenantId } from "@/lib/utils";
import { useStore } from "../appshell";
import {
  ShoppingCart, Plus, RefreshCw, Pencil, Trash2, X,
  CheckCircle2, Clock, Package, TruckIcon, XCircle, FileText,
  Printer, Share2, MessageCircle, Mail, ChevronDown, ChevronRight,
  AlertTriangle, Search, Download,
} from "lucide-react";

/* ── Types ── */
interface POItem {
  id: string;
  item_id: string | null;
  item_name: string;
  sku: string | null;
  quantity: string;
  unit_price: string;
  gst_rate: string;
  gst_amount: string;
  subtotal: string;
  total: string;
  notes: string | null;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  status: "draft" | "sent" | "confirmed" | "delivered" | "cancelled";
  supplier_id: string;
  supplier_name: string;
  supplier_email: string | null;
  supplier_phone: string | null;
  store_name: string;
  subtotal: string;
  gst_amount: string;
  total_amount: string;
  order_date: string;
  expected_delivery: string | null;
  notes: string | null;
  item_count?: number;
  items?: POItem[];
}

interface Supplier { id: string; name: string; email?: string; phone?: string; }
interface StoreItem { id: string; name: string; sku: string | null; purchase_price: string | null; gst_rate: string | null; }

/* ── Status config ── */
const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     bg: "bg-gray-100",    text: "text-gray-600",   icon: FileText      },
  sent:      { label: "Sent",      bg: "bg-blue-100",    text: "text-blue-700",   icon: Clock         },
  confirmed: { label: "Confirmed", bg: "bg-amber-100",   text: "text-amber-700",  icon: CheckCircle2  },
  delivered: { label: "Delivered", bg: "bg-emerald-100", text: "text-emerald-700",icon: TruckIcon     },
  cancelled: { label: "Cancelled", bg: "bg-red-100",     text: "text-red-700",    icon: XCircle       },
};

const fmtINR = (v: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(Number(v));

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

/* ── Line item row for the form ── */
function LineItemRow({
  item, index, storeItems, onChange, onRemove,
}: {
  item: Partial<POItem & { itemId?: string; itemName?: string; unitPrice?: string }>;
  index: number;
  storeItems: StoreItem[];
  onChange: (idx: number, key: string, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const qty = parseFloat((item as any).quantity) || 0;
  const price = parseFloat((item as any).unitPrice ?? item.unit_price ?? "0") || 0;
  const gst = parseFloat((item as any).gstRate ?? item.gst_rate ?? "0") || 0;
  const subtotal = qty * price;
  const total = subtotal * (1 + gst / 100);

  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-2 pr-2">
        <select
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
          value={(item as any).itemId ?? ""}
          onChange={e => {
            const si = storeItems.find(s => s.id === e.target.value);
            onChange(index, "itemId", e.target.value);
            if (si) {
              onChange(index, "itemName", si.name);
              if (si.purchase_price) onChange(index, "unitPrice", si.purchase_price);
              if (si.gst_rate) onChange(index, "gstRate", si.gst_rate);
              if (si.sku) onChange(index, "sku", si.sku);
            }
          }}
        >
          <option value="">— Select item —</option>
          {storeItems.map(si => (
            <option key={si.id} value={si.id}>{si.name}{si.sku ? ` (${si.sku})` : ""}</option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-2">
        <input
          type="text"
          placeholder="Item name"
          value={(item as any).itemName ?? item.item_name ?? ""}
          onChange={e => onChange(index, "itemName", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      </td>
      <td className="py-2 pr-2 w-20">
        <input
          type="number"
          min="0.001"
          step="0.001"
          placeholder="Qty"
          value={(item as any).quantity ?? ""}
          onChange={e => onChange(index, "quantity", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      </td>
      <td className="py-2 pr-2 w-24">
        <input
          type="number"
          min="0"
          placeholder="Price"
          value={(item as any).unitPrice ?? item.unit_price ?? ""}
          onChange={e => onChange(index, "unitPrice", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      </td>
      <td className="py-2 pr-2 w-16">
        <input
          type="number"
          min="0"
          placeholder="GST%"
          value={(item as any).gstRate ?? item.gst_rate ?? ""}
          onChange={e => onChange(index, "gstRate", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      </td>
      <td className="py-2 pr-2 w-24 text-right">
        <span className="text-xs font-semibold text-gray-700">{fmtINR(total)}</span>
      </td>
      <td className="py-2 w-8">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

/* ── Order form modal ── */
interface OrderFormProps {
  tenantId: string;
  storeId: string;
  suppliers: Supplier[];
  storeItems: StoreItem[];
  editing: PurchaseOrder | null;
  onClose: () => void;
  onSaved: () => void;
}

type NewItem = {
  itemId: string; itemName: string; sku: string;
  quantity: string; unitPrice: string; gstRate: string; notes: string;
};

function OrderFormModal({ tenantId, storeId, suppliers, storeItems, editing, onClose, onSaved }: OrderFormProps) {
  const [form, setForm] = useState({
    supplierId:       editing?.supplier_id      ?? "",
    status:           editing?.status           ?? "draft",
    expectedDelivery: editing?.expected_delivery?.slice(0, 10) ?? "",
    notes:            editing?.notes ?? "",
  });
  const [lineItems, setLineItems] = useState<NewItem[]>(
    editing?.items?.map(i => ({
      itemId: i.item_id ?? "", itemName: i.item_name, sku: i.sku ?? "",
      quantity: i.quantity, unitPrice: i.unit_price, gstRate: i.gst_rate, notes: i.notes ?? "",
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addItem = () => setLineItems(li => [...li, { itemId: "", itemName: "", sku: "", quantity: "1", unitPrice: "0", gstRate: "0", notes: "" }]);
  const removeItem = (idx: number) => setLineItems(li => li.filter((_, i) => i !== idx));
  const changeItem = (idx: number, key: string, val: string) =>
    setLineItems(li => li.map((item, i) => i === idx ? { ...item, [key]: val } : item));

  const totals = lineItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const gst = parseFloat(item.gstRate) || 0;
    const sub = qty * price;
    const gstAmt = sub * gst / 100;
    return { subtotal: acc.subtotal + sub, gst: acc.gst + gstAmt, total: acc.total + sub + gstAmt };
  }, { subtotal: 0, gst: 0, total: 0 });

  const save = async () => {
    if (!form.supplierId) { setErr("Supplier is required"); return; }
    setSaving(true); setErr(null);
    try {
      const payload = {
        storeId,
        supplierId:       form.supplierId,
        status:           form.status,
        expectedDelivery: form.expectedDelivery || null,
        notes:            form.notes || null,
        items: lineItems.filter(li => li.itemName || li.itemId).map(li => ({
          itemId:    li.itemId || null,
          itemName:  li.itemName || "Unnamed item",
          sku:       li.sku || null,
          quantity:  parseFloat(li.quantity) || 1,
          unitPrice: parseFloat(li.unitPrice) || 0,
          gstRate:   parseFloat(li.gstRate)   || 0,
          notes:     li.notes || null,
        })),
      };

      if (editing) {
        await apiPut(`/tenants/${tenantId}/purchase-orders/${editing.id}`, payload);
        // Update items: delete all and re-add
        for (const oldItem of editing.items ?? []) {
          await apiDelete(`/tenants/${tenantId}/purchase-orders/${editing.id}/items/${oldItem.id}`);
        }
        for (const newItem of payload.items) {
          await apiPost(`/tenants/${tenantId}/purchase-orders/${editing.id}/items`, newItem);
        }
      } else {
        await apiPost(`/tenants/${tenantId}/purchase-orders`, payload);
      }
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-4">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {editing ? `Edit ${editing.order_number}` : "New Purchase Order"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Supplier *</label>
              <select value={form.supplierId} onChange={e => setF("supplierId", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select value={form.status} onChange={e => setF("status", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            {/* Expected delivery */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Expected delivery</label>
              <input type="date" value={form.expectedDelivery} onChange={e => setF("expectedDelivery", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400" />
            </div>
            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
              <input type="text" value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="Optional…" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium
                           text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </div>

            {lineItems.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                No items added yet.{" "}
                <button type="button" onClick={addItem} className="font-medium text-gray-600 hover:text-gray-800 underline">
                  Add an item
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Catalog</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Name</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Qty</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Price</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-500">GST%</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-500">Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 px-2">
                    {lineItems.map((item, idx) => (
                      <LineItemRow
                        key={idx}
                        item={item}
                        index={idx}
                        storeItems={storeItems}
                        onChange={changeItem}
                        onRemove={removeItem}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {lineItems.length > 0 && (
              <div className="flex justify-end mt-3 gap-6 text-sm">
                <div className="text-right space-y-1">
                  <div className="flex justify-between gap-8 text-gray-500">
                    <span>Subtotal</span><span className="font-medium">{fmtINR(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-gray-500">
                    <span>GST</span><span className="font-medium">{fmtINR(totals.gst)}</span>
                  </div>
                  <div className="flex justify-between gap-8 font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                    <span>Total</span><span>{fmtINR(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {err && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update order" : "Create order"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PDF Print view ── */
function POPrintView({ po }: { po: PurchaseOrder }) {
  return (
    <div id="po-print" className="p-8 bg-white text-gray-900 font-sans text-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">DemandPlan</h1>
          <p className="text-gray-500 text-xs mt-1">Purchase Order</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{po.order_number}</p>
          <StatusBadge status={po.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Supplier</p>
          <p className="font-semibold">{po.supplier_name}</p>
          {po.supplier_email && <p className="text-gray-500">{po.supplier_email}</p>}
          {po.supplier_phone && <p className="text-gray-500">{po.supplier_phone}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Order Details</p>
          <p>Store: <span className="font-medium">{po.store_name}</span></p>
          <p>Order date: <span className="font-medium">{fmtDate(po.order_date)}</span></p>
          {po.expected_delivery && <p>Expected: <span className="font-medium">{fmtDate(po.expected_delivery)}</span></p>}
        </div>
      </div>

      {po.items && po.items.length > 0 && (
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="text-left py-2 text-xs font-bold uppercase">#</th>
              <th className="text-left py-2 text-xs font-bold uppercase">Item</th>
              <th className="text-left py-2 text-xs font-bold uppercase">SKU</th>
              <th className="text-right py-2 text-xs font-bold uppercase">Qty</th>
              <th className="text-right py-2 text-xs font-bold uppercase">Unit Price</th>
              <th className="text-right py-2 text-xs font-bold uppercase">GST%</th>
              <th className="text-right py-2 text-xs font-bold uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-1.5 text-gray-400">{idx + 1}</td>
                <td className="py-1.5">{item.item_name}</td>
                <td className="py-1.5 text-gray-500">{item.sku ?? "—"}</td>
                <td className="py-1.5 text-right">{item.quantity}</td>
                <td className="py-1.5 text-right">{fmtINR(item.unit_price)}</td>
                <td className="py-1.5 text-right">{item.gst_rate}%</td>
                <td className="py-1.5 text-right font-semibold">{fmtINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmtINR(po.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">GST</span><span>{fmtINR(po.gst_amount)}</span></div>
          <div className="flex justify-between font-bold border-t border-gray-900 pt-1"><span>Total</span><span>{fmtINR(po.total_amount)}</span></div>
        </div>
      </div>

      {po.notes && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
          <p className="text-gray-600">{po.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
function PurchaseOrdersInner() {
  const { storeId, loading: storeLoading } = useStore();
  const tenantId = getTenantId() ?? "";

  const [orders,     setOrders]    = useState<PurchaseOrder[]>([]);
  const [suppliers,  setSuppliers] = useState<Supplier[]>([]);
  const [storeItems, setStoreItems]= useState<StoreItem[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState<string | null>(null);
  const [showForm,   setShowForm]  = useState(false);
  const [editing,    setEditing]   = useState<PurchaseOrder | null>(null);
  const [deleting,   setDeleting]  = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [printPO,    setPrintPO]   = useState<PurchaseOrder | null>(null);
  const [expanded,   setExpanded]  = useState<string | null>(null);
  const [loadingPO,  setLoadingPO] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const params = storeId ? `?storeId=${storeId}` : "";
      const [ordersRes, suppliersRes] = await Promise.all([
        apiGet<{ success: boolean; data: PurchaseOrder[] }>(`/tenants/${tenantId}/purchase-orders${params}`),
        apiGet<{ success: boolean; data: Supplier[] }>(`/tenants/${tenantId}/suppliers`),
      ]);
      setOrders(ordersRes.data ?? []);
      setSuppliers(suppliersRes.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [tenantId, storeId]);

  useEffect(() => { load(); }, [load]);

  // Load store items for item picker
  useEffect(() => {
    if (!storeId || !tenantId) return;
    apiGet<{ success: boolean; data: StoreItem[] }>(`/tenants/${tenantId}/stores/${storeId}/items?limit=500`)
      .then(r => setStoreItems(r.data ?? []))
      .catch(() => {});
  }, [storeId, tenantId]);

  const expandOrder = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const existing = orders.find(o => o.id === id);
    if (existing?.items) return; // already loaded
    setLoadingPO(id);
    try {
      const r = await apiGet<{ success: boolean; data: PurchaseOrder }>(`/tenants/${tenantId}/purchase-orders/${id}`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...r.data } : o));
    } finally {
      setLoadingPO(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft order?")) return;
    setDeleting(id);
    try { await apiDelete(`/tenants/${tenantId}/purchase-orders/${id}`); await load(); }
    catch (e: any) { alert(e?.message ?? "Failed to delete"); }
    finally { setDeleting(null); }
  };

  const handlePrint = async (po: PurchaseOrder) => {
    let fullPO = po;
    if (!po.items) {
      const r = await apiGet<{ success: boolean; data: PurchaseOrder }>(`/tenants/${tenantId}/purchase-orders/${po.id}`);
      fullPO = r.data;
    }
    setPrintPO(fullPO);
    setTimeout(() => window.print(), 300);
  };

  const handleWhatsApp = (po: PurchaseOrder) => {
    const lines = [
      `*Purchase Order: ${po.order_number}*`,
      `Supplier: ${po.supplier_name}`,
      `Store: ${po.store_name}`,
      `Status: ${po.status.toUpperCase()}`,
      `Order Date: ${fmtDate(po.order_date)}`,
      po.expected_delivery ? `Expected: ${fmtDate(po.expected_delivery)}` : "",
      ``,
      po.items?.map((i, idx) => `${idx+1}. ${i.item_name} × ${i.quantity} @ ${fmtINR(i.unit_price)} = ${fmtINR(i.total)}`).join("\n") ?? "",
      ``,
      `Subtotal: ${fmtINR(po.subtotal)}`,
      `GST: ${fmtINR(po.gst_amount)}`,
      `*Total: ${fmtINR(po.total_amount)}*`,
    ].filter(Boolean).join("\n");

    const phone = po.supplier_phone ?? "";
    const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank");
  };

  const handleEmail = (po: PurchaseOrder) => {
    const subject = `Purchase Order ${po.order_number} from DemandPlan`;
    const body = [
      `Dear ${po.supplier_name},`,
      ``,
      `Please find the purchase order details below:`,
      `Order Number: ${po.order_number}`,
      `Order Date: ${fmtDate(po.order_date)}`,
      `Status: ${po.status}`,
      `Total Amount: ${fmtINR(po.total_amount)}`,
      ``,
      `Items:`,
      ...(po.items?.map((i, idx) => `${idx+1}. ${i.item_name} x ${i.quantity} @ ${fmtINR(i.unit_price)}`) ?? ["(Open order to view items)"]),
      ``,
      `Thank you.`,
    ].join("\n");
    window.open(`mailto:${po.supplier_email ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  const totalValue    = orders.reduce((s, o) => s + parseFloat(o.total_amount), 0);
  const pendingCount  = orders.filter(o => ["draft","sent","confirmed"].includes(o.status)).length;
  const deliveredAmt  = orders.filter(o => o.status === "delivered").reduce((s,o) => s + parseFloat(o.total_amount), 0);

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
    <>
      {/* Print overlay */}
      {printPO && (
        <div className="hidden print:block">
          <POPrintView po={printPO} />
        </div>
      )}

      <div className="print:hidden theme-content min-h-full p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-xs text-gray-400 mt-0.5">{orders.length} orders total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2
                         text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2
                         text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> New order
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total order value", value: fmtINR(totalValue),  icon: Package,    bg: "bg-blue-50",    ic: "text-blue-500"    },
            { label: "Pending orders",    value: String(pendingCount), icon: Clock,      bg: "bg-amber-50",   ic: "text-amber-500"   },
            { label: "Delivered value",   value: fmtINR(deliveredAmt), icon: TruckIcon,  bg: "bg-emerald-50", ic: "text-emerald-500" },
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

        {/* Status tabs + list */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
            {[["all", "All"], ...Object.entries(STATUS_CFG).map(([k,v]) => [k, v.label])].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors
                  ${statusFilter === k ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {label}
                {k !== "all" && (
                  <span className="ml-1.5 opacity-60">
                    {orders.filter(o => o.status === k).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-gray-200 mb-3" />
              <p className="font-semibold text-gray-500">No purchase orders found</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter !== "all" ? `No ${statusFilter} orders.` : "Create your first purchase order."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(order => (
                <div key={order.id}>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    {/* Expand toggle */}
                    <button
                      onClick={() => expandOrder(order.id)}
                      className="rounded p-1 text-gray-300 hover:text-gray-500"
                    >
                      {expanded === order.id
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">{order.order_number}</span>
                        <StatusBadge status={order.status} />
                        {(order.item_count ?? 0) > 0 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            {order.item_count} item{order.item_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span>{order.supplier_name}</span>
                        <span>·</span>
                        <span>{order.store_name}</span>
                        <span>·</span>
                        <span>{fmtDate(order.order_date)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmtINR(order.total_amount)}</p>
                      {order.expected_delivery && (
                        <p className="text-[11px] text-gray-400">By {fmtDate(order.expected_delivery)}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handlePrint(order)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Print / Save PDF"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEmail(order)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Send email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(order)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Share via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const r = await apiGet<{ success: boolean; data: PurchaseOrder }>(`/tenants/${tenantId}/purchase-orders/${order.id}`);
                          setEditing(r.data);
                          setShowForm(true);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {order.status === "draft" && (
                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={deleting === order.id}
                          className="rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded items */}
                  {expanded === order.id && (
                    <div className="bg-gray-50 border-t border-gray-100 px-10 py-3">
                      {loadingPO === order.id ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading items…</p>
                      ) : !order.items || order.items.length === 0 ? (
                        <p className="text-xs text-gray-400">No items in this order.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 font-semibold uppercase">
                              <th className="text-left pb-1.5">Item</th>
                              <th className="text-left pb-1.5">SKU</th>
                              <th className="text-right pb-1.5">Qty</th>
                              <th className="text-right pb-1.5">Unit Price</th>
                              <th className="text-right pb-1.5">GST</th>
                              <th className="text-right pb-1.5">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {order.items.map(item => (
                              <tr key={item.id}>
                                <td className="py-1.5 font-medium text-gray-800">{item.item_name}</td>
                                <td className="py-1.5 text-gray-500">{item.sku ?? "—"}</td>
                                <td className="py-1.5 text-right">{item.quantity}</td>
                                <td className="py-1.5 text-right">{fmtINR(item.unit_price)}</td>
                                <td className="py-1.5 text-right">{item.gst_rate}%</td>
                                <td className="py-1.5 text-right font-semibold text-gray-900">{fmtINR(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t border-gray-300 font-semibold">
                            <tr>
                              <td colSpan={5} className="pt-2 text-right text-gray-500">Total</td>
                              <td className="pt-2 text-right text-gray-900">{fmtINR(order.total_amount)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <OrderFormModal
          tenantId={tenantId}
          storeId={storeId}
          suppliers={suppliers}
          storeItems={storeItems}
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </>
  );
}

export default function PurchaseOrdersPage() {
  return <PurchaseOrdersInner />;
}
