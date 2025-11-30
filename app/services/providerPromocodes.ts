// src/app/services/providerPromocodes.ts
"use client";

export type PromoStatus = "active" | "scheduled" | "expired" | "disabled";
export type DiscountType = "percentage" | "fixed";

export type ProviderPromocode = {
  _id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  amount: number;
  currency?: string;
  maxUsage?: number;
  usedCount?: number;
  startsAt?: string;
  endsAt?: string;
  status: PromoStatus;
};

// ✅ LIST: GET /api/provider/promocodes?status=active
export async function fetchProviderPromocodes(
  status?: "" | PromoStatus
): Promise<{ promocodes: ProviderPromocode[] }> {
  const query = status ? `?status=${status}` : "";

  const res = await fetch(`/api/provider/promocodes${query}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to load promocodes");
  }

  const data = await res.json();
  return {
    promocodes: (data.promocodes || []) as ProviderPromocode[],
  };
}

// ✅ CREATE: POST /api/provider/promocodes  → backend POST {{baseUrl}}/api/promo
export type CreatePromocodePayload = {
  code: string;
  description?: string;
  serviceId: string;
  discountType: DiscountType;
  amount: number;
  currency?: string;
  maxUsage?: number;
  startsAt?: string; // ISO string
  endsAt?: string;   // ISO string
};

export async function createProviderPromocode(
  payload: CreatePromocodePayload
): Promise<{ promocode: ProviderPromocode }> {
  const res = await fetch(`/api/provider/promocodes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to create promocode");
  }

  const data = await res.json();
  return {
    promocode: data.promocode as ProviderPromocode,
  };
}
