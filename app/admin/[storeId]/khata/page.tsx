"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Plus, Search, X, User, Phone, Calendar,
  CheckCircle, Clock, TrendingDown, Printer, Send,
  ChevronRight, ReceiptText, Wallet,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  created_at: string;
}

interface Transaction {
  id: string;
  customer_id: string;
  date: string;
  type: "purchase" | "payment";
  amount: number;
  note: string;
  created_at: string;
}

// ── localStorage helpers ───────────────────────────────────────────────────────
const CUSTOMERS_KEY = (sid: string) => `khata_customers_${sid}`;
const TXN_KEY       = (sid: string) => `khata_txns_${sid}`;

function loadCustomers(sid: string): Customer[] {
  try { return JSON.parse(localStorage.getItem(CUSTOMERS_KEY(sid)) || "[]"); } catch { return []; }
}
function saveCustomers(sid: string, data: Customer[]) {
  localStorage.setItem(CUSTOMERS_KEY(sid), JSON.stringify(data));
}
function loadTxns(sid: string): Transaction[] {
  try { return JSON.parse(localStorage.getItem(TXN_KEY(sid)) || "[]"); } catch { return []; }
}
function saveTxns(sid: string, data: Transaction[]) {
  localStorage.setItem(TXN_KEY(sid), JSON.stringify(data));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid  = () => `k${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);

function balance(cid: string, txns: Transaction[]): number {
  return txns
    .filter(t => t.customer_id === cid)
    .reduce((acc, t) => t.type === "purchase" ? acc + t.amount : acc - t.amount, 0);
}

// ── Add Customer Modal ─────────────────────────────────────────────────────────
function AddCustomerModal({ onClose, onAdd }: { onClose: ()=>void; onAdd: (c: Customer)=>void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!name.trim()) { setErr("Customer name is required."); return; }
    onAdd({ id: uid(), name: name.trim(), phone: phone.trim(), address: address.trim(), created_at: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Add Customer</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Name *</label>
            <input autoFocus className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="Customer name" value={name} onChange={e => setName(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="Mobile number" value={phone} onChange={e => setPhone(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Address</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="Optional" value={address} onChange={e => setAddress(e.target.value)}/>
          </div>
        </div>
        {err && <p className="text-red-500 text-xs mt-2">{err}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={submit} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition">Add Customer</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Purchase Modal ─────────────────────────────────────────────────────────
function AddPurchaseModal({ customer, onClose, onAdd }: { customer: Customer; onClose: ()=>void; onAdd: (ts: Transaction[])=>void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [payType, setPayType] = useState<"credit"|"paid">("credit");
  const [err, setErr] = useState("");

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setErr("Enter a valid amount."); return; }
    const purchase: Transaction = { id: uid(), customer_id: customer.id, date, type: "purchase", amount: amt, note: note.trim() || "Purchase", created_at: new Date().toISOString() };
    if (payType === "credit") {
      onAdd([purchase]);
    } else {
      const payment: Transaction = { id: uid(), customer_id: customer.id, date, type: "payment", amount: amt, note: "Paid at time of purchase", created_at: new Date().toISOString() };
      onAdd([purchase, payment]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-900">Add Purchase</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{customer.name}</p>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button onClick={()=>setPayType("credit")} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${payType==="credit"?"bg-red-500 text-white":"text-gray-500"}`}>Credit (Udhaar)</button>
          <button onClick={()=>setPayType("paid")} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${payType==="paid"?"bg-emerald-500 text-white":"text-gray-500"}`}>Paid Now</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (Rs.)</label>
            <input autoFocus type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={date} onChange={e => setDate(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Note (items / description)</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="e.g. Atta 10kg, Dal 5kg" value={note} onChange={e => setNote(e.target.value)}/>
          </div>
        </div>
        {err && <p className="text-red-500 text-xs mt-2">{err}</p>}
        {payType === "credit" && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-700">
            This will be added as <strong>credit (udhaar)</strong> — customer owes you this amount.
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={submit} className={`flex-1 py-2 text-white rounded-lg text-sm font-semibold transition ${payType==="credit"?"bg-red-500 hover:bg-red-600":"bg-emerald-500 hover:bg-emerald-600"}`}>
            {payType==="credit"?"Add Credit":"Mark Paid"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Payment Modal ─────────────────────────────────────────────────────────
function AddPaymentModal({ customer, bal, onClose, onAdd }: { customer: Customer; bal: number; onClose: ()=>void; onAdd: (t: Transaction)=>void }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setErr("Enter a valid amount."); return; }
    if (amt > bal) { setErr(`Payment (${fmtINR(amt)}) exceeds balance (${fmtINR(bal)}).`); return; }
    onAdd({ id: uid(), customer_id: customer.id, date, type: "payment", amount: amt, note: note.trim() || "Payment received", created_at: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-900">Record Payment</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <p className="text-xs text-gray-500 mb-1">{customer.name}</p>
        <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 mb-4 flex items-center justify-between">
          <span className="text-xs text-gray-600">Current balance</span>
          <span className="text-sm font-bold text-red-600">{fmtINR(bal)}</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount received (Rs.)</label>
            <div className="relative">
              <input autoFocus type="number" min="0" max={bal} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}/>
              <button onClick={()=>setAmount(String(bal))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 font-semibold transition">Full</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" value={date} onChange={e => setDate(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Note</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" placeholder="e.g. Cash received, UPI, etc." value={note} onChange={e => setNote(e.target.value)}/>
          </div>
        </div>
        {err && <p className="text-red-500 text-xs mt-2">{err}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={submit} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition">Collect Payment</button>
        </div>
      </div>
    </div>
  );
}

// ── Customer Detail Panel ──────────────────────────────────────────────────────
function CustomerDetail({ customer, txns, onAddPurchase, onAddPayment, onBack }: {
  customer: Customer; txns: Transaction[];
  onAddPurchase: ()=>void; onAddPayment: ()=>void; onBack: ()=>void;
}) {
  const cTxns = txns.filter(t => t.customer_id === customer.id).sort((a, b) => b.date.localeCompare(a.date));
  const bal = balance(customer.id, txns);

  const printStatement = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = cTxns.map(t => {
      const isP = t.type === "purchase";
      return `<tr>
        <td>${fmtDate(t.date)}</td>
        <td>${t.note}</td>
        <td style="color:${isP?"#dc2626":"#16a34a"};font-weight:600">${isP?"+ ":"- "}${fmtINR(t.amount)}</td>
        <td>${isP?"Credit":"Payment"}</td>
      </tr>`;
    }).join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Khata - ${customer.name}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;padding:24px;color:#111}
h1{font-size:20px;font-weight:900}h2{font-size:14px;color:#666;margin:4px 0 4px}
.bal{font-size:24px;font-weight:900;color:#dc2626;margin:12px 0}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
th{text-align:left;padding:8px;background:#f3f4f6;border-bottom:2px solid #e5e7eb}
td{padding:8px;border-bottom:1px solid #f3f4f6}</style></head><body>
<h1>Khata Statement</h1>
<h2>${customer.name}${customer.phone ? " · " + customer.phone : ""}</h2>
${customer.address ? `<p style="color:#666;font-size:12px">${customer.address}</p>` : ""}
<div class="bal">Balance Due: ${fmtINR(bal)}</div>
<table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th></tr></thead>
<tbody>${rows}</tbody></table>
<p style="margin-top:20px;font-size:11px;color:#999">Printed on ${new Date().toLocaleString("en-IN")}</p>
</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  };

  const waReminder = () => {
    if (!customer.phone) { alert("No phone number saved for this customer."); return; }
    const msg = `Hi ${customer.name}! Your balance at our store is *${fmtINR(bal)}*. Please settle at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/91${customer.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition">
          <ChevronRight size={16} className="rotate-180"/>Back
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">{customer.name}</span>
      </div>

      {/* Customer card */}
      <div className={`rounded-2xl p-4 mb-4 ${bal > 0 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-base">{customer.name[0]}</div>
              <div>
                <p className="font-bold text-gray-900 text-base">{customer.name}</p>
                {customer.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/>{customer.phone}</p>}
              </div>
            </div>
            {customer.address && <p className="text-xs text-gray-500 mt-1">{customer.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{bal > 0 ? "Balance Due" : "Clear"}</p>
            <p className={`text-2xl font-black ${bal > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtINR(bal)}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={onAddPurchase} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition">
            <Plus size={13}/>Add Purchase
          </button>
          {bal > 0 && (
            <button onClick={onAddPayment} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition">
              <Wallet size={13}/>Collect Payment
            </button>
          )}
          <button onClick={printStatement} className="px-3 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs text-gray-600 transition" title="Print statement">
            <Printer size={14}/>
          </button>
          {customer.phone && (
            <button onClick={waReminder} className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs transition" title="Send WhatsApp reminder">
              <Send size={14}/>
            </button>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Transaction History ({cTxns.length})</p>
        {cTxns.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No transactions yet. Add a purchase to start.</div>
        ) : (
          <div className="space-y-2">
            {cTxns.map(t => (
              <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border ${t.type==="purchase"?"border-red-100 bg-red-50/50":"border-emerald-100 bg-emerald-50/50"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type==="purchase"?"bg-red-100":"bg-emerald-100"}`}>
                  {t.type==="purchase" ? <ReceiptText size={14} className="text-red-600"/> : <CheckCircle size={14} className="text-emerald-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.note}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10}/>{fmtDate(t.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${t.type==="purchase"?"text-red-600":"text-emerald-600"}`}>
                    {t.type==="purchase" ? "+" : "-"}{fmtINR(t.amount)}
                  </p>
                  <p className={`text-[10px] ${t.type==="purchase"?"text-red-400":"text-emerald-400"}`}>{t.type==="purchase"?"Credit":"Payment"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KhataPage() {
  const params  = useParams();
  const storeId = params?.storeId as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [txns,      setTxns]      = useState<Transaction[]>([]);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"all"|"pending"|"clear">("all");
  const [selected,  setSelected]  = useState<Customer|null>(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showPayment,  setShowPayment]  = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (!storeId) return;
    setCustomers(loadCustomers(storeId));
    setTxns(loadTxns(storeId));
  }, [storeId]);

  const persistCustomers = useCallback((data: Customer[]) => {
    setCustomers(data); saveCustomers(storeId, data);
  }, [storeId]);

  const persistTxns = useCallback((data: Transaction[]) => {
    setTxns(data); saveTxns(storeId, data);
  }, [storeId]);

  const addCustomer = (c: Customer) => {
    const updated = [...customers, c];
    persistCustomers(updated);
    setShowAdd(false);
    setSelected(c);
  };

  const addTxn = (t: Transaction) => {
    const updated = [...txns, t];
    persistTxns(updated);
    setShowPayment(false);
  };

  // Summary stats
  const stats = useMemo(() => {
    const pendingCustomers = customers.filter(c => balance(c.id, txns) > 0);
    const totalPending = pendingCustomers.reduce((s, c) => s + balance(c.id, txns), 0);
    const totalCustomers = customers.length;
    return { pendingCustomers: pendingCustomers.length, totalPending, totalCustomers };
  }, [customers, txns]);

  // Filtered + sorted customer list
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const q = search.toLowerCase();
        if (q && !c.name.toLowerCase().includes(q) && !(c.phone||"").includes(q)) return false;
        const bal = balance(c.id, txns);
        if (filter === "pending" && bal <= 0) return false;
        if (filter === "clear"   && bal > 0) return false;
        return true;
      })
      .sort((a, b) => {
        const bA = balance(a.id, txns);
        const bB = balance(b.id, txns);
        return bB - bA; // highest balance first
      });
  }, [customers, txns, search, filter]);

  if (!storeId) return <div className="p-6 text-red-500">Store ID missing.</div>;

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* ── Left: Customer list ── */}
      <div className={`flex flex-col ${selected ? "hidden lg:flex lg:w-80 lg:shrink-0" : "flex-1"} border-r border-gray-100 bg-white`}>
        {/* Top summary */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-black text-gray-900">Khata Book</h1>
            <button onClick={()=>setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition">
              <Plus size={13}/>Add Customer
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-black text-gray-900">{stats.totalCustomers}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Customers</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-black text-red-600">{stats.pendingCustomers}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Pending</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center">
              <p className="text-xs font-black text-red-700">{stats.totalPending >= 1000 ? `${(stats.totalPending/1000).toFixed(1)}k` : stats.totalPending.toFixed(0)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Total Due</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-orange-300" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)}/>
            {search && <button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400"/></button>}
          </div>

          {/* Filter tabs */}
          <div className="flex bg-gray-50 rounded-xl p-1">
            {([["all","All"],["pending","Pending"],["clear","Clear"]] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)} className={`flex-1 py-1 rounded-lg text-xs font-semibold transition ${filter===v?"bg-white shadow text-gray-900":"text-gray-400"}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {customers.length === 0
                ? <><User size={32} className="mx-auto mb-2 opacity-40"/><p>No customers yet.</p><p className="text-xs mt-1">Add your first customer to start tracking.</p></>
                : "No customers match your filter."}
            </div>
          ) : (
            filteredCustomers.map(c => {
              const bal = balance(c.id, txns);
              const active = selected?.id === c.id;
              return (
                <button key={c.id} onClick={()=>setSelected(c)} className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-orange-50/50 transition text-left ${active?"bg-orange-50 border-l-2 border-l-orange-400":""}`}>
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-base shrink-0">{c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    {c.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={9}/>{c.phone}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {bal > 0 ? (
                      <><p className="text-sm font-bold text-red-600">{fmtINR(bal)}</p><p className="text-[10px] text-red-400 flex items-center justify-end gap-0.5"><Clock size={9}/>Due</p></>
                    ) : (
                      <><p className="text-xs text-emerald-600 font-semibold">Clear</p><CheckCircle size={12} className="text-emerald-400 ml-auto mt-0.5"/></>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Customer detail ── */}
      <div className={`flex-1 overflow-y-auto p-4 ${!selected ? "hidden lg:flex lg:items-center lg:justify-center" : "flex flex-col"}`}>
        {selected ? (
          <CustomerDetail
            customer={selected}
            txns={txns}
            onAddPurchase={()=>setShowPurchase(true)}
            onAddPayment={()=>setShowPayment(true)}
            onBack={()=>setSelected(null)}
          />
        ) : (
          <div className="text-center text-gray-400">
            <TrendingDown size={48} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">Select a customer to view their khata</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && <AddCustomerModal onClose={()=>setShowAdd(false)} onAdd={addCustomer}/>}
      {showPurchase && selected && (
        <AddPurchaseModal
          customer={selected}
          onClose={()=>setShowPurchase(false)}
          onAdd={newTxns => {
            persistTxns([...txns, ...newTxns]);
            setShowPurchase(false);
          }}
        />
      )}
      {showPayment && selected && (
        <AddPaymentModal
          customer={selected}
          bal={balance(selected.id, txns)}
          onClose={()=>setShowPayment(false)}
          onAdd={addTxn}
        />
      )}
    </div>
  );
}
