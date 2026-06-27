"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, RefreshCw, TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react";
import {
  Modal, Button, Badge, FullPageLoader,
  SearchInput, PageHeader, useToast,
} from "../../dynamic/ui";
import { getTenantId } from "@/lib/utils";
import { apiGet, apiPut } from "@/lib/api";
import { ApiResponse } from "@/lib/types";

/* ───────────────── TYPES ───────────────── */

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

/* ───────────────── API ───────────────── */

async function fetchItems(storeId: string): Promise<Item[]> {
  console.log("🌐 fetchItems CALLED");
  console.log("➡️ storeId:", storeId);

  const url = `/stores/${storeId}/items?limit=500`;
  console.log("➡️ API URL:", url);

  const result = await apiGet<ApiResponse<any[]>>(url);

  console.log("⬅️ API RESULT:", result);

  return result.data ?? [];
}

async function fetchItemLedger(storeId: string, itemId: string): Promise<LedgerEntry[]> {
  console.log("🌐 fetchItemLedger CALLED");
  console.log("➡️ storeId:", storeId, "itemId:", itemId);

  const url = `/stores/${storeId}/items/${itemId}/ledger?limit=200&offset=0`;
  console.log("➡️ API URL:", url);

  const result = await apiGet<ApiResponse<any[]>>(url);

  console.log("⬅️ Ledger RESULT:", result);

  return result.data ?? [];
}

/* ───────────────── PAGE ───────────────── */

export default function ManageLedger() {
  const { show } = useToast();

  const params = useParams();
  const storeId = params?.storeId as string;

  const tenantId = getTenantId() ?? "";

  const [items, setItems] = useState<Item[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  /* ─────────── INIT LOG ─────────── */

  useEffect(() => {
    console.log("🚀 ManageLedger MOUNTED");
    console.log("📍 storeId:", storeId);
    console.log("🏢 tenantId:", tenantId);
  }, []);

  /* ─────────── LOAD ITEMS ─────────── */

  const loadItems = useCallback(async () => {
    console.log("🟡 loadItems START");

    if (!storeId) {
      console.error("❌ storeId is MISSING → API NOT CALLED");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Calling fetchItems...");
      const data = await fetchItems(storeId);

      console.log("✅ Items loaded:", data.length);

      setItems(data);
    } catch (err) {
      console.error("❌ loadItems ERROR:", err);
      show("Failed to load items", "error");
    } finally {
      console.log("🟢 loadItems END");
      setLoading(false);
    }
  }, [storeId, show]);

  useEffect(() => {
    console.log("🔁 useEffect TRIGGERED");
    loadItems();
  }, [loadItems]);

  /* ─────────── LOAD LEDGER ─────────── */

  const loadLedger = useCallback(async (item: Item) => {
    console.log("🟡 loadLedger START for:", item.name);

    if (!storeId) {
      console.error("❌ storeId missing → ledger not called");
      return;
    }

    setLedgerLoading(true);

    try {
      const data = await fetchItemLedger(storeId, item.id);
      console.log("✅ Ledger loaded:", data.length);

      setLedger(data);
    } catch (err) {
      console.error("❌ loadLedger ERROR:", err);
      show("Failed to load ledger", "error");
    } finally {
      console.log("🟢 loadLedger END");
      setLedgerLoading(false);
    }
  }, [storeId, show]);

  /* ─────────── SELECT ITEM ─────────── */

  const selectItem = (item: Item) => {
    console.log("👉 Item selected:", item.name);

    setSelectedItem(item);
    loadLedger(item);
  };

  /* ─────────── RENDER ─────────── */

  return (
    <div className="p-6">

      {!storeId && (
        <div className="text-red-500 font-bold mb-4">
          ❌ Store ID missing — check URL
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Button onClick={loadItems}>
          <RefreshCw className="h-4 w-4 mr-1" /> Reload
        </Button>
      </div>

      {loading ? <FullPageLoader /> : (
        <div className="space-y-4">

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-2">Items ({items.length})</h2>

            {items.map(item => (
              <div key={item.id} className="flex justify-between border-b py-2">
                <span>{item.name}</span>
                <Button onClick={() => selectItem(item)}>View Ledger</Button>
              </div>
            ))}
          </div>

          {ledgerLoading && <FullPageLoader />}

          {selectedItem && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold mb-2">
                Ledger: {selectedItem.name}
              </h2>

              {ledger.map(e => (
                <div key={e.id} className="border-b py-2 text-sm">
                  {e.movement_type} | {e.qty_before} → {e.qty_after}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}