import { apiPost } from "./api";
import { ApiResponse } from "./types";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  industryId: string;   // ✅ changed
  tenantId?: string | null;
  role?: string;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<ApiResponse<{ userId: string }>> {
  return apiPost<ApiResponse<{ userId: string }>>("/auth/register", {
    ...payload,
    role: payload.role ?? "guest",   // backend required
    tenantId: payload.tenantId ?? null,
  });
}
