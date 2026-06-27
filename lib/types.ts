// lib/types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  filters?: Record<string, string | number | boolean>;
}

export interface LoginPayload {
  email: string;
  password: string;
}


export interface Industry {
  id: string;
  industry_id: string;
  display_name: string;
  item_noun: string;
  default_unit_symbol: string;
  domain_keywords: string[];
  off_topic_keywords: string[];
  seasonal_signals: string[];
  prompt_context: string;
  low_stock_days: number;
  expiry_warn_days: number;
  allowed_plan_types: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  industry: string;
  status: string;
}

export interface Tenant {
  id: string;
  companyName: string;
  adminEmail: string;
  status: string;
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface DashboardData {
  summary: {
    totalItems: number;
    lowStock: number;
    criticalAlerts: number;
    ordersNeeded: number;
  };
  recentSales: { item: string; quantity: number; sale_id:string; itemId:string; }[];
  alerts: { id: string; message: string }[];
  forecasts: {
    item: string;
    predicted_qty_30d: number;
    confidence: number;
    orderQty: number;
    note: string;
  }[];
}