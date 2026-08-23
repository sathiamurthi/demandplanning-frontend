"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormBuilder } from "./formbuilder";
import { getStoreId, getTenantId } from "@/lib/utils";
import { apiGet } from "@/lib/api";

export function PipelineDocumentForm({ data, onChange, errors, onSubmit, onCancel, configFields }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [searchStr, setSearchStr] = useState("");

  // Populate line items
  const lineItems = data.items || [];

  const handleAddItem = (item: any) => {
    const newItems = [...lineItems, { 
      item_id: item.id, 
      name: item.name, 
      qty: 1, 
      unit_price: Number(item.selling_price || 0), 
      discount_pct: 0, 
      gst_rate: Number(item.gst_rate || 0),
      unit_id: item.primary_unit_id || undefined,
      description: "" 
    }];
    onChange({ ...data, items: newItems });
    setSearchStr("");
    setItems([]);
  };

  const updateLineItem = (idx: number, key: string, val: any) => {
    const arr = [...lineItems];
    arr[idx][key] = val;
    onChange({ ...data, items: arr });
  };

  const removeLineItem = (idx: number) => {
    const arr = [...lineItems];
    arr.splice(idx, 1);
    onChange({ ...data, items: arr });
  };

  const [allItems, setAllItems] = useState<any[]>([]);

  useEffect(() => {
    const tId = getTenantId();
    const sId = getStoreId();
    if (!sId) return; // tenantId can be missing in some setups
    
    const url = tId 
      ? `/tenants/${tId}/stores/${sId}/items?limit=1000`
      : `/stores/${sId}/items?limit=1000`;

    apiGet<any>(url)
      .then(res => {
        const data = res.data || res || [];
        setAllItems(Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!searchStr || searchStr.trim().length < 2) {
      setItems([]);
      return;
    }
    const q = searchStr.toLowerCase().trim();
    
    // Search locally against allItems like the sales page
    const filtered = allItems.filter((it: any) => 
      (it.name || "").toLowerCase().includes(q) || 
      (it.sku || "").toLowerCase().includes(q)
    ).slice(0, 8);
    setItems(filtered);
  }, [searchStr, allItems]);

  return (
    <div className="space-y-6">
      {/* Standard Form Builder for Header Fields */}
      <FormBuilder
        fields={configFields}
        data={data}
        onChange={(k, v) => onChange({ ...data, [k]: v })}
        errors={errors}
      />

      <div className="border-t pt-4 mt-6">
        <h3 className="font-semibold text-lg mb-2">Line Items</h3>
        
        {/* Search & Add */}
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search items to add..." 
            className="w-full border p-2 rounded" 
            value={searchStr}
            onChange={e => setSearchStr(e.target.value)}
          />
          {items.length > 0 && (
            <div className="absolute z-10 w-full bg-white border shadow-lg max-h-60 overflow-y-auto">
              {items.map(it => (
                <div 
                  key={it.id} 
                  className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  onClick={() => handleAddItem(it)}
                >
                  <span>{it.name}</span>
                  <span className="text-gray-500 text-sm">₹{Number(it.selling_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grid / Table */}
        {lineItems.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2 w-20">Qty</th>
                <th className="text-right p-2 w-24">Price</th>
                <th className="text-right p-2 w-20">Disc %</th>
                <th className="text-right p-2 w-20">GST %</th>
                <th className="text-right p-2 w-24">Total</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li: any, i: number) => {
                const total = Number(li.qty) * Number(li.unit_price) * (1 - Number(li.discount_pct || 0)/100) * (1 + Number(li.gst_rate || 0)/100);
                return (
                  <tr key={i} className="border-b">
                    <td className="p-2">{li.name || li.item_name}</td>
                    <td className="p-2"><input type="number" value={li.qty} onChange={e => updateLineItem(i, 'qty', e.target.value)} className="w-full border p-1 rounded text-right" /></td>
                    <td className="p-2"><input type="number" value={li.unit_price} onChange={e => updateLineItem(i, 'unit_price', e.target.value)} className="w-full border p-1 rounded text-right" /></td>
                    <td className="p-2"><input type="number" value={li.discount_pct} onChange={e => updateLineItem(i, 'discount_pct', e.target.value)} className="w-full border p-1 rounded text-right" /></td>
                    <td className="p-2"><input type="number" value={li.gst_rate} onChange={e => updateLineItem(i, 'gst_rate', e.target.value)} className="w-full border p-1 rounded text-right" /></td>
                    <td className="p-2 text-right font-mono">₹{total.toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeLineItem(i)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-4 border border-dashed rounded text-center text-gray-500">
            No items added yet. Search above to add items.
          </div>
        )}
      </div>
    </div>
  );
}
