// src/types/medicine.ts
export interface Medicine {
  id: string;
  name: string;
  brand: string;
  category: string;
  stock: number;
  stockUnit: string;
  reorderLevel: number;
  status: 'ok' | 'low';
  expiryStatus: 'expiring' | 'ok';
  expiryDate: string | null;
}

export type StockStatus = 'ok' | 'low';
export type ExpiryStatus = 'expiring' | 'ok';
