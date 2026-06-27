// Use relative /v1 so Next.js rewrites proxy it to the backend — no NEXT_PUBLIC_API_URL needed
const API_BASE = '/v1';

// Build common headers
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// Decode JWT expiry
function decodeJwtExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp; // seconds since epoch
  } catch {
    return 0;
  }
}

// Refresh token logic
async function refreshToken(): Promise<boolean> {
  try {
    const API_BASE = '/v1';
    const TOKEN_STRATEGY = (process.env.NEXT_PUBLIC_TOKEN_STRATEGY || "localStorage") as "cookie" | "localStorage";

    let body: string | undefined = undefined;
    let headers: Record<string, string> = { "Content-Type": "application/json" };

    // Decide based on env
    if (TOKEN_STRATEGY === "localStorage") {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.warn("No refresh token found in localStorage");
        return false;
      }
      body = JSON.stringify({ refreshToken });
    } else if (TOKEN_STRATEGY === "cookie") {
      // No body needed, backend should read from req.cookies.refreshToken
      body = undefined;
    }

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers,
      body,
      credentials: "include", // required for cookie strategy
    });

    if (!res.ok) {
      console.error("Refresh request failed:", res.status);
      return false;
    }

    const data = await res.json();

    const accessToken = data.accessToken ?? data.data?.accessToken;
    if (accessToken) {
      localStorage.setItem("token", accessToken);

      const exp = decodeJwtExp(accessToken);
      const timeLeft = exp - Date.now() / 1000;
      if (timeLeft <= 5) {
        alert("⚠️ Your session will expire in 5 seconds!");
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error("Error refreshing token:", err);
    return false;
  }
}


// Handle responses with retry on 401
async function handleResponse<T>(
  res: Response,
  endpoint: string,
  retry?: () => Promise<T>
): Promise<T> {
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed && retry) {
      return retry();
    }
    if (typeof window !== "undefined") {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
    throw new Error(`Unauthorized: ${endpoint}`);
  }
  if (!res.ok) {
    let message = `${res.status} ${endpoint} failed`;
    try {
      const body = await res.json();
      message = body.error || body.message || body?.error?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json();
}

// Generic GET
export async function apiGet<T>(endpoint: string): Promise<T> {
  const retry = () => apiGet<T>(endpoint);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, endpoint, retry);
}

// Generic POST
export async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  const retry = () => apiPost<T>(endpoint, body);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse(res, endpoint, retry);
}

// Generic PUT
export async function apiPut<T>(endpoint: string, body: any): Promise<T> {
  const retry = () => apiPut<T>(endpoint, body);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse(res, endpoint, retry);
}

// Generic DELETE
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const retry = () => apiDelete<T>(endpoint);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return handleResponse(res, endpoint, retry);
}
