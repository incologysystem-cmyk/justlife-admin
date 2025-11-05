// ============================
// Core shared enums / aliases
// ============================
export type CurrencyCode = "AED" | "USD" | "PKR" | "EUR";
export type Segment = "Sofa" | "Mattress" | "Carpet" | "Curtain" | "Combos";
export type YesNo = 0 | 1;

// Useful when backend returns snake_case or _id-only objects
export type IdLike = string;

// ============================
// Category
// ============================
export type CategoryStatus = "active" | "inactive" | "archived";

export type Category = {
  id: string;                 // canonical app id
  _id?: string;               // optional backend id
  name: string;
  slug: string;
  image?: string;
  description?: string;
  active: boolean;            // UI-friendly flag
  status?: CategoryStatus;    // optional richer state
  order: number;              // sort
  tags?: string[];            // for marketing/filters
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;         // ISO
  updatedAt?: string;         // ISO
  deletedAt?: string | null;  // soft delete
};

// Payloads (client → API)
export type CreateCategoryPayload = {
  name: string;
  slug?: string;
  image?: string;             // URL or data: URL you’ll upload
  description?: string;
  active?: boolean;
  order?: number;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & {
  id: string;
};

// ============================
// Service (detail + card)
// ============================
export type ServiceStatus = "draft" | "active" | "inactive" | "archived";

export type ServiceVariant = {
  _id: string;
  name: string;

  // Pricing deltas (relative to base)
  priceDelta?: number;
  durationDelta?: number;

  // Flags for UI
  defaultSelected?: boolean;
  isPopular?: boolean;

  // Optional/legacy
  code?: string;
  image?: string;
  absolutePrice?: number;     // if backend sometimes returns absolute price
  compareAtPrice?: number;
  segment?: Segment;
};

export type ServiceCard = {
  id: string;
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  currency?: CurrencyCode;
  isVariant: boolean;

  // For variants:
  segment?: Segment;
  parentServiceId?: string;
  compareAtPrice?: number;

  // Optional for listing UIs:
  categoryId?: string;
  status?: ServiceStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ServiceDetail = {
  id: string;
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  images?: string[];
  categoryId?: string;

  // Pricing + configuration
  pricingModelId?: string;
  formTemplateId?: string;
  variants: ServiceVariant[];
  basePrice?: number;
  currency?: CurrencyCode;

  // Ops
  status?: ServiceStatus;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// Payloads
export type CreateServicePayload = {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  images?: string[];
  categoryId: string;
  basePrice: number;
  currency?: CurrencyCode;
  pricingModelId?: string;
  formTemplateId?: string;
  variants?: ServiceVariant[];
  status?: ServiceStatus;
  active?: boolean;
};

export type UpdateServicePayload = Partial<CreateServicePayload> & {
  id: string;
};

// ============================
// Dynamic form templates
// ============================
export type FormStep = { title: string; description?: string };
export type FormField = any; // keep if you already handle dynamic schema runtime

export type FormTemplate = {
  _id: string;
  title: string;
  version: number;
  steps: FormStep[];
  fields: FormField[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ============================
// Quoting
// ============================
export type QuoteRequest = {
  serviceId: string;
  formValues: Record<string, any>;
  variantId?: string;
  qty?: number;
  hours?: number;
  cityId?: string;            // if you support city pricing overrides
  currency?: CurrencyCode;
};

export type QuoteLineItem = {
  label: string;
  amount: number;
  qty?: number;
};

export type QuoteResponse = {
  currency: CurrencyCode;
  subtotal?: number;
  discount?: number;
  tax?: number;
  fees?: number;
  total: number;

  // more structured breakdown (keeps your original fields too)
  breakdown: {
    baseType: string;
    base: number;
    hours?: number;
    qty?: number;
    tax?: number;
    variantId?: string;
  };

  // optional detailed items for UI
  lineItems?: QuoteLineItem[];
};

// ============================
// Generic API response helpers
// ============================
export type ApiError = { ok: false; message: string; code?: string | number };

export type ApiListResponse<T> = {
  ok: true;
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
    hasNext?: boolean;
  };
};

export type ApiItemResponse<T> = { ok: true; data: T };

// ============================
// Normalizers (snake_case → camel)
// ============================
export function normalizeCategory(input: any): Category {
  if (!input) {
    throw new Error("Empty category payload");
  }
  // accept both id and _id, order and sort
  const id = String(input.id ?? input._id ?? crypto.randomUUID());
  return {
    id,
    _id: input._id,
    name: String(input.name ?? input.title ?? "Untitled"),
    slug: String(input.slug ?? ""),
    image: input.image ?? input.icon ?? undefined,
    description: input.description ?? undefined,
    active:
      typeof input.active === "boolean"
        ? input.active
        : input.status
        ? String(input.status).toLowerCase() === "active"
        : true,
    status: input.status ?? (input.active ? "active" : "inactive"),
    order:
      typeof input.order === "number"
        ? input.order
        : typeof input.sort === "number"
        ? input.sort
        : 0,
    tags: Array.isArray(input.tags) ? input.tags : undefined,
    seoTitle: input.seoTitle ?? input.seo_title ?? undefined,
    seoDescription: input.seoDescription ?? input.seo_description ?? undefined,
    createdAt: input.createdAt ?? input.created_at ?? undefined,
    updatedAt: input.updatedAt ?? input.updated_at ?? undefined,
    deletedAt: input.deletedAt ?? input.deleted_at ?? null,
  };
}

export function normalizeService(input: any): ServiceDetail {
  if (!input) throw new Error("Empty service payload");
  const id = String(input.id ?? input._id ?? crypto.randomUUID());
  const variants: ServiceVariant[] = Array.isArray(input.variants)
    ? input.variants.map((v: any) => ({
        _id: String(v._id ?? v.id ?? crypto.randomUUID()),
        name: String(v.name ?? "Variant"),
        priceDelta:
          typeof v.priceDelta === "number"
            ? v.priceDelta
            : typeof v.price_delta === "number"
            ? v.price_delta
            : undefined,
        durationDelta:
          typeof v.durationDelta === "number"
            ? v.durationDelta
            : typeof v.duration_delta === "number"
            ? v.duration_delta
            : undefined,
        defaultSelected:
          typeof v.defaultSelected === "boolean"
            ? v.defaultSelected
            : v.default_selected ?? false,
        isPopular:
          typeof v.isPopular === "boolean" ? v.isPopular : v.is_popular ?? false,
        code: v.code,
        image: v.image,
        absolutePrice:
          typeof v.absolutePrice === "number"
            ? v.absolutePrice
            : typeof v.absolute_price === "number"
            ? v.absolute_price
            : undefined,
        compareAtPrice:
          typeof v.compareAtPrice === "number"
            ? v.compareAtPrice
            : typeof v.compare_at_price === "number"
            ? v.compare_at_price
            : undefined,
        segment: v.segment,
      }))
    : [];

  return {
    id,
    _id: input._id,
    name: String(input.name ?? "Untitled Service"),
    slug: String(input.slug ?? ""),
    description: String(input.description ?? ""),
    image: String(input.image ?? ""),
    images: Array.isArray(input.images) ? input.images : undefined,
    categoryId: input.categoryId ?? input.category_id ?? undefined,
    pricingModelId: input.pricingModelId ?? input.pricing_model_id ?? undefined,
    formTemplateId: input.formTemplateId ?? input.form_template_id ?? undefined,
    variants,
    basePrice:
      typeof input.basePrice === "number"
        ? input.basePrice
        : typeof input.base_price === "number"
        ? input.base_price
        : undefined,
    currency: input.currency as CurrencyCode | undefined,
    status: input.status as ServiceStatus | undefined,
    active:
      typeof input.active === "boolean"
        ? input.active
        : input.status
        ? String(input.status).toLowerCase() === "active"
        : undefined,
    createdAt: input.createdAt ?? input.created_at ?? undefined,
    updatedAt: input.updatedAt ?? input.updated_at ?? undefined,
  };
}
