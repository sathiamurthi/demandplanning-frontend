"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, BookOpen, Package,
  ArrowUpRight, ArrowDownLeft, RotateCcw, AlertTriangle, Search,
} from "lucide-react";
import { Button, useToast } from "../../dynamic/ui";
import { getTenantId } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { useStore } from "../appshell";

/* ───────────── TYPES ───────────── */

type LedgerEntry = {
  id: string;
  item_id: string;
  store_id: string;
  movement_type: string;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  unit_symbol: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

type Item = {
  id: string;
  name: string;
  sku: string | null;
  current_stock: number;
  reorder_level: number;
  unit_symbol: string | null;
  category_name: string | null;
  is_low_stock: boolean;
};

/* ───────────── MOVEMENT ICONS ───────────── */

function MovementBadge({ type }: { type: string }) {
  const t = type?.toUpperCase();
  if (t === "IN" || t === "PURCHASE" || t === "RECEIPT") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <ArrowDownLeft className="h-3 w-3" /> {type}
      </span>
    );
  }
  if (t === "OUT" || t === "SALE" || t === "DISPATCH") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
        <ArrowUpRight className="h-3 w-3" /> {type}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      <RotateCcw className="h-3 w-3" /> {type}
    </span>
  );
}

function StockBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const color = pct < 25 ? "bg-rose-500" : pct < 50 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
        <span>{current}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ───────────── PAGE ───────────── */

export default function ManageLedger() {
  const { show } = useToast();
  const { storeId } = useStore();
  const tenantId = getTenantId() ?? "";

  const [items,        setItems]        = useState<Item[]>([]);
  const [ledger,       setLedger]       = useState<LedgerEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [ledgerLoading,setLedgerLoading]= useState(false);
  const [search,       setSearch]       = useState("");

  const loadItems = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiGet<ApiResponse<Item[]>>(`/stores/${storeId}/items?limit=500`);
      setItems(res.data ?? []);
    } catch {
      show("Failed to load items", "error");
    } finally {
      setLoading(false);
    }
  }, [storeId, show]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const loadLedger = useCallback(async (item: Item) => {
    if (!storeId) return;
    setSelectedItem(item);
    setLedger([]);
    setLedgerLoading(true);
    try {
      const res = await apiGet<ApiResponse<LedgerEntry[]>>(
        `/stores/${storeId}/items/${item.id}/ledger?limit=200&offset=0`
      );
      setLedger(res.data ?? []);
    } catch {
      show("Failed to load ledger", "error");
    } finally {
      setLedgerLoading(false);
    }
  }, [storeId, show]);

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter(i => i.is_low_stock).length;

  if (!storeId) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="text-center text-gray-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
          <p className="font-semibold text-gray-700">No store selected</p>
          <p className="text-sm mt-1">Select a store from the top bar to view the ledger.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold-500" /> Stock Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} items · {lowStockCount > 0 && (
              <span className="text-rose-600 font-medium">{lowStockCount} low stock</span>
            )}
          </p>
        </div>
        <Button onClick={loadItems} className="self-start sm:self-auto">
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-sm text-rose-700 font-medium">
            {lowStockCount} item{lowStockCount > 1 ? "s are" : " is"} below reorder level
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Items list */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" /> Items
            </h2>
            <div className="w-48">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs
                           focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading items…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No items found
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => loadLedger(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors
                    ${selectedItem?.id === item.id ? "bg-gold-50 border-r-2 border-r-gold-400" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      {item.is_low_stock && (
                        <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 uppercase">
                          Low
                        </span>
                      )}
                    </div>
                    {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                    <div className="mt-1.5 w-32">
                      <StockBar current={item.current_stock} max={item.reorder_level * 3 || 100} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.current_stock} <span className="text-xs font-normal text-gray-400">{item.unit_symbol ?? "pcs"}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ledger entries */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" />
              {selectedItem ? (
                <span>Ledger — <span className="text-gold-600">{selectedItem.name}</span></span>
              ) : (
                "Select an item to view its ledger"
              )}
            </h2>
          </div>

          {!selectedItem ? (
            <div className="p-8 text-center text-gray-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Click any item on the left</p>
            </div>
          ) : ledgerLoading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading ledger…
            </div>
          ) : ledger.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No ledger entries yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {ledger.map((e, idx) => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="shrink-0 mt-0.5">
                    <MovementBadge type={e.movement_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {e.qty_before} → {e.qty_after}
                      </span>
                      <span className={`text-xs font-medium ${e.qty_change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {e.qty_change >= 0 ? "+" : ""}{e.qty_change} {e.unit_symbol ?? ""}
                      </span>
                    </div>
                    {e.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{e.notes}</p>}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {e.created_by_name ?? "System"} · {new Date(e.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
