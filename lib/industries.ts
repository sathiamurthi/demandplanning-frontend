import { apiGet, apiPost } from "./api";
import { ApiResponse, Industry } from "./types";

export async function getIndustries(): Promise<ApiResponse<Industry[]>> {
  return apiGet<ApiResponse<Industry[]>>("/superadmin/industries");
}

export async function createIndustry(industry: Partial<Industry>): Promise<ApiResponse<Industry>> {
  return apiPost<ApiResponse<Industry>>("/superadmin/industries", industry);
}
