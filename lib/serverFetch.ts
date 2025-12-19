// lib/serverFetch.ts
import "server-only";
import { cookies } from "next/headers";

const API_BASE =
  process.env.API_BASE?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ??
  "";

function pickErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload || fallback;

  // common shapes
  return (
    payload?.message ||
    payload?.error ||
    payload?.msg ||
    payload?.errors?.message ||
    fallback
  );
}

export async function serverFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!API_BASE && !/^https?:\/\//i.test(path)) {
    throw new Error("API_BASE is not configured and path is not absolute");
  }

  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`;
  const headers = new Headers(init.headers || {});

  const cookieStore = await cookies();

  if (!headers.has("Cookie")) {
    const all = cookieStore.getAll();
    if (all.length) {
      headers.set(
        "Cookie",
        all.map((c) => `${c.name}=${c.value}`).join("; ")
      );
    }
  }

  const tokenCookie = cookieStore.get("token");
  if (tokenCookie && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${tokenCookie.value}`);
  }

  const body = init.body as any;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
  const isArrayBuffer =
    typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer;

  if (!headers.has("Content-Type") && !isFormData && !isBlob && !isArrayBuffer) {
    if (body && typeof body === "object" && !(body instanceof URLSearchParams)) {
      init = { ...init, body: JSON.stringify(body) };
      headers.set("Content-Type", "application/json");
    } else if (!init.body && (init.method ?? "GET").toUpperCase() !== "GET") {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(url, { ...init, headers, cache: "no-store" });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const payload = isJSON ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message = pickErrorMessage(payload, `Request failed (${res.status})`);

    console.error("========== serverFetch ERROR ==========");
    console.error("URL:", url);
    console.error("METHOD:", init.method ?? "GET");
    console.error("STATUS:", res.status);
    console.error("MESSAGE:", message);
    console.error("BODY:");
    console.dir(payload, { depth: 20 });
    console.error("========== END ERROR ==========");

    const err = new Error(message) as Error & { status?: number; body?: any };
    err.status = res.status;
    err.body = payload;
    throw err;
  }

  return payload as T;
}
