// src/components/inventory/InventoryTable.tsx
'use client';

import { useState } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import type { Medicine } from './../types/medicine';
import { InventoryCard } from './InventoryCard';
import { MedicineRow } from './MedicineRow';
import { AddMedicineDialog } from './AddMedicineDialog';

interface InventoryTableProps {
  medicines: Medicine[];
}

export function InventoryTable({ medicines }: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    console.log('Edit medicine:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete medicine:', id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Medicine Inventory
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {filteredMedicines.length} items tracked
            </p>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">All Medicines</span>
            <span className="text-gray-400">({filteredMedicines.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile: Card view */}
        <div className="p-4 sm:hidden">
          <div className="space-y-3">
            {filteredMedicines.map((medicine) => (
              <InventoryCard
                key={medicine.id}
                medicine={medicine}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* Tablet and up: Table view */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead className="bg-gray-50/80 sticky top-0">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="py-3 pl-4 pr-3 sm:pl-6">Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3 text-center">Stock</th>
                <th className="px-3 py-3 text-center">Reorder</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Expiry</th>
                <th className="py-3 pl-3 pr-4 text-right sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMedicines.map((medicine) => (
                <MedicineRow
                  key={medicine.id}
                  medicine={medicine}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredMedicines.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-gray-100 p-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              No medicines found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or add a new medicine.
            </p>
          </div>
        )}
      </div>

      {/* Add Medicine Dialog */}
      <AddMedicineDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  );
}
