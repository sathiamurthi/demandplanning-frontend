import { apiGet, apiPost } from "./api";
import { ApiResponse, Industry, LoginPayload } from "./types";

export interface Store {
  id: string;
  name: string;
  location?: string;
  createdAt?: string;
}

// Get all stores
export async function getStores(): Promise<ApiResponse> {
  return apiGet<ApiResponse>("/industries");
}

export async function getIndustries(): Promise<ApiResponse<Industry[]>> {
  return apiGet<ApiResponse<Industry[]>>("/industries");
}
export async function loginUser(
  payload: LoginPayload
): Promise<ApiResponse<{ accessToken: string; user: any }>> {
  return apiPost<ApiResponse<{ accessToken: string; user: any }>>("/auth/login", payload);
}

// types/auth.ts
export interface RegisterEmployerPayload {
  firstName: string;
  lastName: string;
  industry_id: string;
  companyName: string;
  email: string;
  password: string;
}

export interface TenantResponse {
  tenantId: string;
  companyName: string;
  industry: string;
  adminEmail: string;
}


// services/auth.service.ts

export async function registerEmployer(
  payload: RegisterEmployerPayload
): Promise<ApiResponse<TenantResponse>> {
  return apiPost<ApiResponse<TenantResponse>>("/ext/tenant/register", {
    ...payload,
    // backend may require defaults
    role: "owner",   // ensure admin role is set
  });
}
