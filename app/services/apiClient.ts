// admin/services/apiClient.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: any,
  extraInit?: RequestInit
): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "include", // send cookies for admin auth
    headers: {
      "Content-Type": "application/json",
      ...(extraInit?.headers || {}),
    },
    ...extraInit,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, init);

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  // some 204 responses have no body
  if (res.status === 204) return undefined as unknown as T;

  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>("GET", path, undefined, init),
  post: <T>(path: string, body?: any, init?: RequestInit) =>
    request<T>("POST", path, body, init),
  patch: <T>(path: string, body?: any, init?: RequestInit) =>
    request<T>("PATCH", path, body, init),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>("DELETE", path, undefined, init),
};
