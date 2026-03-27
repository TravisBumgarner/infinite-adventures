import { getToken } from "../auth/service.js";
import config from "../config.js";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const result = await getToken();
  if (result.success) {
    return { Authorization: `Bearer ${result.data}` };
  }
  return {};
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  const body: ApiResponse<T> = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.errorCode || `HTTP ${res.status}`);
  }
  return body.data as T;
}
