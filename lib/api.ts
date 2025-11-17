// lib/api.ts
// Central mock API for the Justlife-style admin. Safe to use in both
// server components and client components.

import type {
  ServiceDetail,
  ServiceVariant,
  CurrencyCode,
  ServiceStatus,
  Category as CatalogCategory, // <-- alias to avoid conflict
} from "@/types/catalog";
import { withOrigin } from "@/lib/url";
import { withServerCookies } from "@/lib/url";

// ----------------------
// Service (rich type used in some places)
// ----------------------
export type Service = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  skuCode?: string;
  basePrice: number;
  durationMin?: number;
  teamSize?: number;
  minQty?: number;
  maxQty?: number | null;
  leadTimeMin?: number;
  bufferAfterMin?: number;
  taxClass?: "standard" | "reduced" | "zero";
  isInstantBookable?: boolean;
  requiresAddress?: boolean;
  requiresSlot?: boolean;
  active?: boolean;
  status?: "draft" | "published";
  images?: string[];
  tags?: string[];
  cities?: string[];
  variants?: Array<{
    _id?: string;
    name: string;
    priceDelta?: number;
    durationDelta?: number;
    defaultSelected?: boolean;
    isPopular?: boolean;
    code?: string;
    absolutePrice?: number;
    compareAtPrice?: number;
    image?: string;
    segment?: "Sofa" | "Mattress" | "Carpet" | "Curtain" | "Combos" | string;
  }>;
  addons?: Array<{
    _id?: string;
    name: string;
    perUnitPrice: number;
    durationDelta?: number;
    maxQty?: number;
  }>;
  priceMatrix?: Array<{
    _id?: string;
    label?: string;
    fromQty?: number;
    toQty?: number;
    price?: number;
  }>;
  formTemplateId?: string;
  formQuestions?: Array<any>;
  policy?: {
    cancellationHours: number;
    rescheduleHours: number;
    sameDayCutoffMin: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type CreateServicePayload = {
  name: string;
  basePrice: number;
  categoryId: string;
  slug?: string;
  description?: string;
  image?: string;
  images?: string[];
  currency?: CurrencyCode;
  pricingModelId?: string;
  formTemplateId?: string;
  variants?: ServiceVariant[];
  status?: ServiceStatus;
  active?: boolean;
};

export type ServiceLite = {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number;
  image?: string;
};

export type CategoryWithServices = {
  category: CatalogCategory; // <-- uses alias from types/catalog
  services: ServiceLite[];
};

export type CreateCategoryPayload = {
  name: string;
  icon?: string;
  sort?: number;
  active?: boolean;
  slug?: string;
  tags?: string[];
};

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1"; // optional flag

// Small helper to simulate network latency
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ----------------------
// Shared Types (exports)
// ----------------------
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled";

export type BookingItem = any;

export type Order = {
  id: string;
  createdAt: string; // ISO
  customer: string;
  service: string;
  total: number;
  status: OrderStatus;
};

export type Provider = {
  id: string;
  name: string;
  city: string;
  phone: string;
  status: OrderStatus | "pending" | "confirmed";
};

// Local light Category used only in this file / old parts of the UI
export type Category = {
  id: string;
  name: string;
  icon?: string;
};

// ⚠️ NOTE: previously there was a second `export type Service` here.
// It’s been removed to avoid duplicate identifier errors.

export type Booking = {
  id: string;
  date: string; // ISO date
  title: string;
  status: OrderStatus | "pending" | "confirmed";
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
};

// Useful when you later swap to a real backend
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// ----------------------
// Dashboard
// ----------------------
export async function fetchDashboard() {
  await sleep(200);
  return {
    kpis: { gmv: 324_560, orders: 1_280, aov: 45.6, repeat: 37 },
    revenue: [
      { week: "W-8", value: 32 },
      { week: "W-7", value: 36 },
      { week: "W-6", value: 31 },
      { week: "W-5", value: 44 },
      { week: "W-4", value: 47 },
      { week: "W-3", value: 52 },
      { week: "W-2", value: 49 },
      { week: "W-1", value: 58 },
    ],
    serviceMix: [
      { name: "Sofa Cleaning", percent: 34 },
      { name: "Mattress Cleaning", percent: 22 },
      { name: "Carpet Cleaning", percent: 18 },
      { name: "Curtain Cleaning", percent: 11 },
      { name: "Combos", percent: 15 },
    ],
  };
}

// ----------------------
// Orders
// ----------------------
export async function fetchOrders(
  opts: { limit?: number } = {}
): Promise<Order[]> {
  const { limit = 20 } = opts;
  await sleep(150);

  return Array.from({ length: limit }).map((_, i) => ({
    id: `JL-${1000 + i}`,
    createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
    customer: ["Ayesha Khan", "Mohammed Ali", "Sara Ahmed", "John Doe"][i % 4]!,
    service: ["Sofa Cleaning", "Mattress Cleaning", "Carpet Cleaning"][i % 3]!,
    total: 40 + (i % 7) * 5,
    status:
      (["pending", "confirmed", "assigned", "completed"][i % 4] as OrderStatus) ??
      "pending",
  }));
}

// ----------------------
// Providers
// ----------------------
export async function fetchProviders(): Promise<Provider[]> {
  await sleep(120);
  return [
    {
      id: "p1",
      name: "Sparkle Squad",
      city: "Dubai",
      phone: "+971 50 123 4567",
      status: "pending",
    },
    {
      id: "p2",
      name: "FreshNest",
      city: "Abu Dhabi",
      phone: "+971 55 987 6543",
      status: "confirmed",
    },
  ];
}

// ----------------------
// Categories
// ----------------------
export async function createCategory(
  payload: CreateCategoryPayload
): Promise<Category> {
  if (USE_MOCK) {
    await sleep(150);
    return {
      id: `c_${Math.random().toString(36).slice(2, 7)}`,
      name: payload.name,
      icon: payload.icon,
    };
  }

  const res = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  // ✅ Parse safely: if not JSON, read as text
  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  // normalize the created category shape
  const raw =
    (data as any)?.data?.category ??
    (data as any)?.category ??
    (data as any);
  const created: Category = {
    id: String(raw?.id ?? crypto.randomUUID()),
    name: String(raw?.name ?? raw?.title ?? payload.name ?? "Untitled"),
    icon: raw?.icon,
    // extra fields ignored by the light Category type, but kept for runtime:
    sort:
      typeof raw?.sort === "number"
        ? raw.sort
        : typeof raw?.order === "number"
        ? raw.order
        : 0,
    active: typeof raw?.active === "boolean" ? raw.active : true,
  } as Category;

  return created;
}

// ----------------------
// Services
// ----------------------
export async function createService(
  payload: CreateServicePayload
): Promise<ServiceDetail> {
  const res = await fetch("/api/admin/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  // Common response shapes: { data: { service } } | { service } | raw object
  const raw = (isJSON
    ? (data as any)?.data?.service ?? (data as any)?.service ?? (data as any)
    : undefined) as any | undefined;

  // Optional external normalizer (for flexibility)
  const maybeNormalize = (globalThis as any)?.normalizeService as
    | ((input: any) => ServiceDetail)
    | undefined;

  if (raw && typeof maybeNormalize === "function") {
    try {
      return maybeNormalize(raw);
    } catch {
      // fall through to manual normalization
    }
  }

  // Fallback manual normalization
  const id =
    String(
      raw?.id ??
        raw?._id ??
        (globalThis.crypto?.randomUUID?.() ??
          Math.random().toString(36).slice(2))
    );
  const _id = String(raw?._id ?? id);

  const variants: ServiceVariant[] = Array.isArray(raw?.variants)
    ? raw.variants.map((v: any) => ({
        _id: String(
          v?._id ??
            v?.id ??
            (globalThis.crypto?.randomUUID?.() ??
              Math.random().toString(36).slice(2))
        ),
        name: String(v?.name ?? "Variant"),
        priceDelta:
          typeof v?.priceDelta === "number"
            ? v.priceDelta
            : typeof v?.price_delta === "number"
            ? v.price_delta
            : undefined,
        durationDelta:
          typeof v?.durationDelta === "number"
            ? v.durationDelta
            : typeof v?.duration_delta === "number"
            ? v.duration_delta
            : undefined,
        defaultSelected:
          typeof v?.defaultSelected === "boolean"
            ? v.defaultSelected
            : !!v?.default_selected,
        isPopular:
          typeof v?.isPopular === "boolean" ? v.isPopular : !!v?.is_popular,
        code: v?.code,
        image: v?.image,
        absolutePrice:
          typeof v?.absolutePrice === "number"
            ? v.absolutePrice
            : typeof v?.absolute_price === "number"
            ? v.absolute_price
            : undefined,
        compareAtPrice:
          typeof v?.compareAtPrice === "number"
            ? v.compareAtPrice
            : typeof v?.compare_at_price === "number"
            ? v.compare_at_price
            : undefined,
        segment: v?.segment,
      }))
    : (payload.variants as ServiceVariant[]) ?? [];

  const created: ServiceDetail = {
    id,
    _id,
    name: String(raw?.name ?? payload.name ?? "Untitled Service"),
    slug: String(raw?.slug ?? payload.slug ?? ""),
    description: String(raw?.description ?? payload.description ?? ""),

    image: String(raw?.image ?? payload.image ?? ""),
    images: Array.isArray(raw?.images) ? raw.images : payload.images,
    categoryId: String(
      raw?.categoryId ?? raw?.category_id ?? payload.categoryId
    ),
    pricingModelId:
      raw?.pricingModelId ?? raw?.pricing_model_id ?? payload.pricingModelId,
    formTemplateId:
      raw?.formTemplateId ?? raw?.form_template_id ?? payload.formTemplateId,
    variants,
    basePrice: Number(
      (typeof raw?.basePrice === "number"
        ? raw.basePrice
        : raw?.base_price) ??
        payload.basePrice ??
        0
    ),
    currency: (raw?.currency ?? payload.currency) as CurrencyCode | undefined,
    status: raw?.status as ServiceStatus | undefined,
    active:
      typeof raw?.active === "boolean"
        ? raw.active
        : typeof raw?.status === "string" &&
          raw.status.toLowerCase() === "active"
        ? true
        : payload.active,
    createdAt: raw?.createdAt ?? raw?.created_at,
    updatedAt: raw?.updatedAt ?? raw?.updated_at,
  };

  return created;
}

export async function fetchCategoriesWithServices(): Promise<
  CategoryWithServices[]
> {
  const res = await fetch("/api/admin/categories-with-services", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const data = await res.json();
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows.map((row: any) => {
    const c = row.category ?? {};
    const services = Array.isArray(row.services) ? row.services : [];
    return {
      category: {
        id: String(c.id ?? c._id ?? ""),
        name: String(c.name ?? ""),
        slug: String(c.slug ?? ""),
        order: Number.isFinite(Number(c.order)) ? Number(c.order) : 0,
      } as CatalogCategory,
      services: services.map((s: any) => ({
        id: String(s.id ?? s._id ?? ""), // ✅ ensure id
        name: String(s.name ?? ""),
        categoryId: String(s.categoryId ?? s.category_id ?? ""),
        basePrice: Number(s.basePrice ?? 0),
        image:
          Array.isArray(s.images) && s.images[0]
            ? String(s.images[0])
            : undefined,
      })),
    } as CategoryWithServices;
  });
}

export async function fetchService(
  idOrSlug: string
): Promise<Service> {
  const res = await fetch(
    `/api/admin/services/${encodeURIComponent(idOrSlug)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    }
  );

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  // backend returns the service doc directly (per your controller)
  return data as Service;
}

/** ----------------------
 *  Bookings (server/client-safe)
 *  ---------------------- */

export async function fetchBookings(): Promise<BookingItem[]> {
  if (typeof window !== "undefined") {
    throw new Error("fetchBookings must be called from the server.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const url = withOrigin("/api/admin/bookings");
    const init = await withServerCookies({
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain;q=0.9",
      },
      signal: controller.signal,
    });

    const res = await fetch(url, init);
    const ct = res.headers.get("content-type") ?? "";
    const isJSON = ct.includes("application/json");

    const body = isJSON
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => "");

    if (!res.ok) {
      const message =
        (isJSON ? (body as any)?.message : undefined) ||
        (typeof body === "string" && body) ||
        `HTTP ${res.status}`;
      throw new Error(message);
    }

    const items =
      (isJSON && (body as any)?.data?.items) ??
      (isJSON && (body as any)?.items) ??
      (isJSON && (body as any)?.data) ??
      (Array.isArray(body) ? body : []);

    if (!Array.isArray(items)) {
      throw new Error("Bad response shape: expected array of bookings.");
    }

    return items as BookingItem[];
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out while fetching bookings.");
    }
    throw new Error(err?.message || "Failed to fetch bookings.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchBookingById(id: string): Promise<any> {
  const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (data as any)?.data?.booking ?? (data as any)?.booking ?? data;
}

export async function createBooking(payload: any): Promise<any> {
  const res = await fetch("/api/admin/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (data as any)?.data?.booking ?? (data as any)?.booking ?? data;
}

export async function updateBooking(id: string, patch: any): Promise<any> {
  const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(patch),
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (data as any)?.data?.booking ?? (data as any)?.booking ?? data;
}

export async function deleteBooking(id: string): Promise<any> {
  const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (data as any)?.success === true ? true : data;
}

// ----------------------
// Customers
// ----------------------
export async function fetchCustomers(): Promise<Customer[]> {
  await sleep(80);
  return [
    { id: "u1", name: "Ayesha Khan", phone: "+971 50 111 2222" },
    { id: "u2", name: "Mohammed Ali", phone: "+971 55 333 4444" },
  ];
}

// ----------------------
// Earnings
// ----------------------
export async function fetchEarnings(): Promise<{
  today: number;
  thisWeek: number;
  thisMonth: number;
  series: { date: string; amount: number }[];
}> {
  await sleep(120);

  const now = new Date();
  const series: { date: string; amount: number }[] = [];
  let thisWeek = 0;
  let thisMonth = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const base = 700 + Math.round(Math.random() * 600); // 700–1300 / day
    series.push({ date: d.toLocaleDateString(), amount: base });

    // rough weekly & monthly buckets
    if (i <= now.getDay()) thisWeek += base;
    if (d.getMonth() === now.getMonth()) thisMonth += base;
  }

  const today = series[series.length - 1]!.amount;

  return {
    today,
    thisWeek,
    thisMonth,
    series,
  };
}
