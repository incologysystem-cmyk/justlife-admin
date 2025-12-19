"use client";

import type { AddonPayload } from "../(provider)/addons/AddAddonModal";

export type AddonDto = {
  _id: string;
  title: string;
  description?: string;
  summary?: string;
  included: string[];
  excluded: string[];
  safetyNotice?: string;
  learnMore: string;
  imageUrl?: string;

  // ✅ required by backend
  categoryId: string;
  price: number;
  currency?: string;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function pickMsg(json: any, fallback: string) {
  if (!json) return fallback;
  if (typeof json === "string") return json || fallback;
  return json?.message || json?.error || json?.msg || fallback;
}

function normalizeAddon(json: any): AddonDto {
  // possible shapes: { ok, addon } | { data: { addon } } | { addon } | raw
  const raw =
    json?.addon ??
    json?.data?.addon ??
    json?.data ??
    json;

  return raw as AddonDto;
}

export async function fetchAddons(onlyActive = false): Promise<AddonDto[]> {
  const query = onlyActive ? "?onlyActive=true" : "";

  const res = await fetch(`/api/provider/addons${query}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const json = isJSON ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    console.error("[fetchAddons] HTTP error:", res.status);
    console.dir(json, { depth: 20 });
    throw new Error(pickMsg(json, `Failed to fetch addons (HTTP ${res.status})`));
  }

  // backend shapes: { ok:true, items:[] } | { data:{items:[]} } | { items:[] }
  const items =
    (json as any)?.items ??
    (json as any)?.data?.items ??
    (json as any)?.data ??
    [];

  if (!Array.isArray(items)) return [];

  return items as AddonDto[];
}

export async function createAddon(payload: AddonPayload): Promise<AddonDto> {
  const res = await fetch(`/api/provider/addons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      // ✅ required fields (your backend schema)
      title: payload.title,
      learnMore: payload.learnMore,
      categoryId: payload.categoryId,     // ✅ FIX
      price: payload.price,               // ✅ FIX
      currency: "PKR",                    // optional (backend default PKR; keep or remove)

      // optional fields
      description: payload.description,
      summary: payload.summary,
      included: payload.included ?? [],
      excluded: payload.excluded ?? [],
      safetyNotice: payload.safetyNotice,

      // image for S3 flow (if your backend supports it)
      imageBase64: payload.imageBase64,
    }),
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const json = isJSON ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    console.error("[createAddon] HTTP error:", res.status);
    console.dir(json, { depth: 20 });

    // your proxy route returns: { ok:false, message, details }
    const message = pickMsg(json, `Failed to create addon (HTTP ${res.status})`);
    const details = (json as any)?.details ?? null;

    const err = new Error(message) as Error & { status?: number; details?: any; body?: any };
    err.status = res.status;
    err.details = details;
    err.body = json;
    throw err;
  }

  return normalizeAddon(json);
}

export async function deleteAddon(id: string): Promise<void> {
  const res = await fetch(`/api/provider/addons/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const json = isJSON ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    console.error("[deleteAddon] HTTP error:", res.status);
    console.dir(json, { depth: 20 });
    throw new Error(pickMsg(json, `Failed to delete addon (HTTP ${res.status})`));
  }
}
