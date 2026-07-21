"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Fuel, ShoppingBag } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Supplier { id: string; name: string; category: string; contact: string; phone: string; payment_terms: string; is_active: boolean; }
interface SupplyOrder { id: string; supplier_id: string; supplier_name: string; order_date: string; items: string; quantity: number; unit: string; unit_cost: number; total_cost: number; status: string; }
interface FuelRow { id: string; consumption_date: string; fuel_type: string; quantity_used: number; unit: string; cost: number; notes: string; }

const CATS = ["fuel", "packaging", "spares", "chemicals", "other"];

export default function SuppliersPage() {
  const [tab, setTab] = useState<"suppliers" | "orders" | "fuel">("suppliers");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [fuelRows, setFuelRows] = useState<FuelRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [supForm, setSupForm] = useState({ name: "", category: "fuel", contact: "", phone: "", payment_terms: "" });
  const [orderForm, setOrderForm] = useState({ supplier_id: "", items: "", quantity: "", unit: "kg", unit_cost: "" });
  const [fuelForm, setFuelForm] = useState({ fuel_type: "firewood", quantity_used: "", unit: "kg", cost: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [s, o, f] = await Promise.all([
        fetch(teaUrl("/suppliers"), { headers: teaAuthHeaders() }).then(r => r.json()),
        fetch(teaUrl("/supply-orders"), { headers: teaAuthHeaders() }).then(r => r.json()),
        fetch(teaUrl("/fuel-consumption"), { headers: teaAuthHeaders() }).then(r => r.json()),
      ]);
      if (s.success) setSuppliers(s.data);
      if (o.success) setOrders(o.data);
      if (f.success) setFuelRows(f.data);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addSupplier = async () => {
    if (!supForm.name) return;
    await fetch(teaUrl("/suppliers"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(supForm) });
    setSupForm({ name: "", category: "fuel", contact: "", phone: "", payment_terms: "" });
    load();
  };
  const addOrder = async () => {
    if (!orderForm.supplier_id || !orderForm.quantity) return;
    await fetch(teaUrl("/supply-orders"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(orderForm) });
    setOrderForm({ supplier_id: "", items: "", quantity: "", unit: "kg", unit_cost: "" });
    load();
  };
  const addFuel = async () => {
    if (!fuelForm.quantity_used) return;
    await fetch(teaUrl("/fuel-consumption"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(fuelForm) });
    setFuelForm({ fuel_type: "firewood", quantity_used: "", unit: "kg", cost: "", notes: "" });
    load();
  };
  const markOrderStatus = async (id: string, status: string) => {
    await fetch(teaUrl(`/supply-orders/${id}`), { method: "PUT", headers: teaAuthHeaders(), body: JSON.stringify({ status }) });
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center"><Package size={18} className="text-amber-600" /></div>
        <div><h1 className="text-xl font-bold text-gray-900 tracking-tight">Suppliers & Fuel</h1><p className="text-gray-500 text-xs">Firewood, packaging, chemicals, spares — and firing fuel consumption</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm p-1 w-fit">
        {([["suppliers", "Suppliers"], ["orders", "Supply Orders"], ["fuel", "Fuel Consumption"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-white text-emerald-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-900"}`}>{l}</button>
        ))}
      </div>

      {tab === "suppliers" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input placeholder="Name" value={supForm.name} onChange={e => setSupForm({ ...supForm, name: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <select value={supForm.category} onChange={e => setSupForm({ ...supForm, category: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Contact" value={supForm.contact} onChange={e => setSupForm({ ...supForm, contact: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input placeholder="Phone" value={supForm.phone} onChange={e => setSupForm({ ...supForm, phone: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <button onClick={addSupplier} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? <div className="p-8 text-center text-gray-600 text-sm">Loading...</div> : suppliers.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">No suppliers yet.</div>
            ) : (
              <table className="w-full"><tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-900 text-sm font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{s.category}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.contact}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.phone}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "orders" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 grid grid-cols-2 sm:grid-cols-6 gap-2">
            <select value={orderForm.supplier_id} onChange={e => setOrderForm({ ...orderForm, supplier_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              <option value="">Supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input placeholder="Items" value={orderForm.items} onChange={e => setOrderForm({ ...orderForm, items: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input type="number" placeholder="Qty" value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input placeholder="Unit" value={orderForm.unit} onChange={e => setOrderForm({ ...orderForm, unit: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input type="number" placeholder="Unit cost" value={orderForm.unit_cost} onChange={e => setOrderForm({ ...orderForm, unit_cost: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <button onClick={addOrder} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {orders.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No supply orders yet.</div> : (
              <table className="w-full"><tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-900 text-sm">{o.supplier_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.items}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.quantity} {o.unit}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">₹{o.total_cost || "—"}</td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={e => markOrderStatus(o.id, e.target.value)} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-2 py-1 text-xs text-gray-900">
                        {["ordered", "received", "paid", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "fuel" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <select value={fuelForm.fuel_type} onChange={e => setFuelForm({ ...fuelForm, fuel_type: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              {["firewood", "biomass", "lpg", "electricity", "other"].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input type="number" placeholder="Quantity" value={fuelForm.quantity_used} onChange={e => setFuelForm({ ...fuelForm, quantity_used: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input placeholder="Unit" value={fuelForm.unit} onChange={e => setFuelForm({ ...fuelForm, unit: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input type="number" placeholder="Cost ₹" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <button onClick={addFuel} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Log</button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {fuelRows.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm"><Fuel size={28} className="mx-auto mb-2 opacity-20" />No fuel consumption logged yet.</div>
            ) : (
              <table className="w-full"><tbody>
                {fuelRows.map(f => (
                  <tr key={f.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(f.consumption_date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-gray-900 text-sm capitalize">{f.fuel_type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{f.quantity_used} {f.unit}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">₹{f.cost || "—"}</td>
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
