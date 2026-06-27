// src/lib/tenant.users.ts
import { apiGet, apiPost, apiPut, apiDelete } from "./../api";
import { ApiResponse, User } from "./../types";

// -----------------------------
// Queries
// -----------------------------
export async function getUsers(
  tenantId: string,
  filter?: string,
  search?: string,
  storeId?: string,
  role?: string,
  isActive?: string,
): Promise<ApiResponse<User[]>> {
  const params = new URLSearchParams();
  if (filter) params.append("filter", filter);
  if (search) params.append("search", search);
  if (storeId) params.append("storeId", storeId);
  if (role) params.append("role", role);
  if (isActive !== undefined && isActive !== "") params.append("isActive", isActive);
  const qs = params.toString();
  return apiGet<ApiResponse<User[]>>(`/tenants/${tenantId}/users${qs ? `?${qs}` : ""}`);
}

export async function getUserById(
  tenantId: string,
  userId: string
): Promise<ApiResponse<User>> {
  return apiGet<ApiResponse<User>>(`/tenants/${tenantId}/users/${userId}`);
}

// -----------------------------
// Commands
// -----------------------------
export async function createUser(
  tenantId: string,
  payload: Partial<User>
): Promise<ApiResponse<User>> {
  return apiPost<ApiResponse<User>>(`/tenants/${tenantId}/users`, payload);
}

export async function updateUser(
  tenantId: string,
  userId: string,
  payload: Partial<User>
): Promise<ApiResponse<User>> {
  return apiPut<ApiResponse<User>>(
    `/tenants/${tenantId}/users/${userId}`,
    payload
  );
}

export async function deleteUser(
  tenantId: string,
  userId: string
): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`/tenants/${tenantId}/users/${userId}`);
}

export async function changePassword(
  tenantId: string,
  userId: string,
  newPassword: string
): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(
    `/tenants/${tenantId}/users/${userId}/change-password`,
    { newPassword }
  );
}
