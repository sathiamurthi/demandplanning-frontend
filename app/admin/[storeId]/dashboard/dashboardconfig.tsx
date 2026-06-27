// dynamic/configs/dashboardConfig.ts

import type { DashboardConfig } from "./dynamicdashboard";

export const dashboardConfig: Omit<DashboardConfig, "storeId"> = {
  title: "Dashboard",
  refreshInterval: 30_000,
  sections: {
    kpis: true,
    salesTrend: true,
    lowStockItems: true,
    alerts: true,
    forecast: true,
  },
};