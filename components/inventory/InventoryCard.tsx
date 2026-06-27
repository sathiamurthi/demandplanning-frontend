// src/components/inventory/InventoryCard.tsx
'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { Medicine } from './../types/medicine';
import { StockStatusBadge, ExpiryStatusBadge } from './StatusBadge';

interface InventoryCardProps {
  medicine: Medicine;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InventoryCard({ medicine, onEdit, onDelete }: InventoryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate">
            {medicine.name}
          </h3>
          <p className="text-sm text-gray-500">{medicine.brand}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(medicine.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(medicine.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 active:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Category</span>
          <p className="font-medium text-emerald-600">{medicine.category}</p>
        </div>
        <div>
          <span className="text-gray-500">Stock</span>
          <p className="font-medium">{medicine.stock} {medicine.stockUnit}</p>
        </div>
        <div>
          <span className="text-gray-500">Reorder Level</span>
          <p className="font-medium">{medicine.reorderLevel}</p>
        </div>
        <div>
          <span className="text-gray-500">Expiry</span>
          <p className="font-medium">{medicine.expiryDate || '—'}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StockStatusBadge status={medicine.status} />
        <ExpiryStatusBadge status={medicine.expiryStatus} />
      </div>
    </div>
  );
}
