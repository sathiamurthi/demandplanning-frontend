import { apiGet, apiPost } from "./api";
import { ApiResponse, Tenant, DashboardData } from "./types";
import { getTenantId } from "./utils";
export async function getTenants(): Promise<ApiResponse<Tenant[]>> {
  return apiGet<ApiResponse<Tenant[]>>("/superadmin/tenants");
}

export async function createTenant(tenant: Partial<Tenant>): Promise<ApiResponse<Tenant>> {
  return apiPost<ApiResponse<Tenant>>("/superadmin/tenants", tenant);
}

export async function getTenantDashboard(): Promise<ApiResponse<DashboardData>> {
  return apiGet<ApiResponse<DashboardData>>(`/tenants/${getTenantId()}/dashboard`);
}

