// src/components/inventory/MedicineRow.tsx
'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { Medicine } from './../types/medicine';
import { StockStatusBadge, ExpiryStatusBadge } from './StatusBadge';

interface MedicineRowProps {
  medicine: Medicine;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MedicineRow({ medicine, onEdit, onDelete }: MedicineRowProps) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="py-4 pl-4 pr-3">
        <div>
          <div className="font-medium text-gray-900">{medicine.name}</div>
          <div className="text-sm text-gray-500">{medicine.brand}</div>
        </div>
      </td>
      <td className="px-3 py-4">
        <span className="text-emerald-600">{medicine.category}</span>
      </td>
      <td className="px-3 py-4 text-center">
        {medicine.stock} {medicine.stockUnit}
      </td>
      <td className="px-3 py-4 text-center">
        {medicine.reorderLevel}
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center justify-center gap-1.5">
          <StockStatusBadge status={medicine.status} />
          <ExpiryStatusBadge status={medicine.expiryStatus} />
        </div>
      </td>
      <td className="px-3 py-4 text-center text-gray-500">
        {medicine.expiryDate || '—'}
      </td>
      <td className="py-4 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(medicine.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(medicine.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
