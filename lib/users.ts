// api/users.ts
import { apiGet , apiPost} from "./api";
import { ApiResponse, User } from "./types";

export async function getUsers(): Promise<ApiResponse<User[]>> {
  return apiGet<ApiResponse<User[]>>("/superadmin/users");
}

export async function createUser(user: Partial<User>): Promise<ApiResponse<User>> {
  return apiPost<ApiResponse<User>>("/superadmin/users", user);
}

export async function updateUser(id: string, user: Partial<User>): Promise<ApiResponse<User>> {
  return apiPost<ApiResponse<User>>(`/superadmin/users/${id}`, user);
}