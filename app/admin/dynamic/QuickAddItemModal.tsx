"use client";

/**
 * QuickAddItemModal — Create an item with 4 minimal fields.
 * Includes Claude AI suggestions: type a name → AI fills SKU,
 * category hint, reorder level, and price range.
 */

import React, { useState, useCallback } from "react";
import { Sparkles, Loader2, X, Zap } from "lucide-react";
import { getAuthHeaders } from "./usercrud";
import { getTenantId, getStoreId } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type AISuggestion = {
  suggestedSku: string;
  suggestedCategory: string;
  suggestedReorderLevel: number;
  estimatedPriceRange: { min: number; max: number };
  isSeasonal: boolean;
  notes: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function QuickAddItemModal({ isOpen, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [showDates, setShowDates] = useState(false);

  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");

  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tenantId = getTenantId();
  const storeId  = getStoreId();

  const reset = () => {
    setName(""); setSku(""); setPrice(""); setStock("");
    setDiscountType("none"); setDiscountValue("");
    setMfgDate(""); setExpiryDate(""); setShowDates(false);
    setSuggestion(null); setAiError(""); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  /* ── AI Suggest ── */
  const fetchSuggestions = useCallback(async () => {
    if (!name.trim() || name.trim().length < 2) {
      setAiError("Type at least 2 characters first.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setSuggestion(null);
    try {
      const res = await fetch(`${BASE}/stores/${storeId}/report/suggest`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI suggestion failed");
      setSuggestion(json.data);
      // Apply suggested SKU only if user hasn't typed one
      if (!sku && json.data.suggestedSku) setSku(json.data.suggestedSku);
      if (!price && json.data.estimatedPriceRange) {
        const mid = ((json.data.estimatedPriceRange.min + json.data.estimatedPriceRange.max) / 2).toFixed(2);
        setPrice(mid);
      }
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }, [name, sku, price, storeId]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE}/tenants/${tenantId}/stores/${storeId}/items/quick`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: name.trim(),
            sku: sku.trim() || undefined,
            sellingPrice: parseFloat(price) || 0,
            currentStock: parseInt(stock) || 0,
            manufactureDate: mfgDate || undefined,
            expiryDate: expiryDate || undefined,
            discountType,
            discountValue: parseFloat(discountValue) || 0,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create item");
      onCreated();
      handleClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md rounded-2xl bg-white shadow-2xl
                      animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400/15">
              <Zap className="h-4 w-4 text-gold-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Quick add item</h2>
              <p className="text-[11px] text-gray-400">Fill 4 fields • AI can help</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Name + AI button */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Item name <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setSuggestion(null); }}
                placeholder="e.g. Paracetamol 500mg"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm
                           placeholder-gray-400 focus:border-gold-400 focus:outline-none
                           focus:ring-2 focus:ring-gold-400/20"
                autoFocus
              />
              <button
                type="button"
                onClick={fetchSuggestions}
                disabled={aiLoading || name.trim().length < 2}
                title="Get AI suggestions"
                className="flex items-center gap-1.5 rounded-lg border border-gold-300 bg-gold-50
                           px-3 py-2 text-xs font-medium text-gold-700 transition-colors
                           hover:bg-gold-100 disabled:opacity-40 disabled:cursor-not-allowed
                           whitespace-nowrap"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">AI suggest</span>
              </button>
            </div>
            {aiError && <p className="mt-1 text-xs text-red-500">{aiError}</p>}
          </div>

          {/* AI Suggestion card */}
          {suggestion && (
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-3 text-xs space-y-1.5">
              <p className="font-semibold text-gold-800 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> AI suggestions applied
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gold-700">
                <span>Category: <strong>{suggestion.suggestedCategory}</strong></span>
                <span>Reorder at: <strong>{suggestion.suggestedReorderLevel}</strong></span>
                <span>Price range: <strong>₹{suggestion.estimatedPriceRange.min}–{suggestion.estimatedPriceRange.max}</strong></span>
                <span>Seasonal: <strong>{suggestion.isSeasonal ? "Yes" : "No"}</strong></span>
              </div>
              {suggestion.notes && (
                <p className="text-gold-600 italic border-t border-gold-200 pt-1.5">{suggestion.notes}</p>
              )}
            </div>
          )}

          {/* SKU */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              SKU <span className="text-gray-400 font-normal">(leave blank to auto-generate)</span>
            </label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. MED-PARA-500"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono
                         placeholder-gray-400 focus:border-gold-400 focus:outline-none
                         focus:ring-2 focus:ring-gold-400/20"
            />
          </div>

          {/* Price + Stock (2 columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Selling price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           placeholder-gray-400 focus:border-gold-400 focus:outline-none
                           focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Opening stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           placeholder-gray-400 focus:border-gold-400 focus:outline-none
                           focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
          </div>

          {/* Discount details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Discount type</label>
              <select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value);
                  if (e.target.value === "none") setDiscountValue("");
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 bg-white"
              >
                <option value="none">None</option>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            {discountType !== "none" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Discount value {discountType === "percentage" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                             placeholder-gray-400 focus:border-gold-400 focus:outline-none
                             focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
            )}
          </div>

          {/* Dates toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowDates(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <span>{showDates ? "▾" : "▸"}</span>
              Manufacture / Expiry dates (optional)
            </button>
            {showDates && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mfg. date</label>
                  <input type="date" value={mfgDate} onChange={e => setMfgDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Expiry date</label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm
                         font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg
                         bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                         theme-btn-primary transition-colors hover:bg-gray-800
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
