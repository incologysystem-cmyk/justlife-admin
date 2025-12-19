// ============================
// Core shared enums / aliases
// ============================
export type CurrencyCode = "AED" | "USD" | "PKR" | "EUR";
export type Segment = "Sofa" | "Mattress" | "Carpet" | "Curtain" | "Combos";
export type YesNo = 0 | 1;
export type IdLike = string;

// ============================
// Category
// ============================
export type CategoryStatus = "active" | "inactive" | "archived";

export type Category = {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  active: boolean;
  status?: CategoryStatus;
  order: number;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type CreateCategoryPayload = {
  name: string;
  slug?: string;
  image?: string;
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
// Service (aligned with backend)
// ============================

// Backend uses status: "draft" | "published"
export type ServiceStatus = "draft" | "published" | "active" | "inactive" | "archived"; // keep extras for compatibility

export type BookingType = "HOURLY" | "UNIT_BASED";
export type QuantityUnit = "hours" | "items";
export type TaxClass = "standard" | "reduced" | "zero";

export type ServiceVariant = {
  _id: string;
  name: string;

  priceDelta?: number;
  durationDelta?: number;

  defaultSelected?: boolean;
  isPopular?: boolean;

  code?: string;
  image?: string;
  description?: string;

  // optional/legacy
  absolutePrice?: number;
  compareAtPrice?: number;
  segment?: Segment;
};

export type ServiceAddon = {
  addonId?: string;          // IMPORTANT: ObjectId string
  name: string;
  price: number;             // per-unit or flat (your backend uses "price")
  maxQty?: number;
  durationDelta?: number;
  perTeamMultiplier?: number;
  requiresBaseVariant?: boolean;
  code?: string;
};

export type ServicePolicy = {
  cancellationHours: number;
  rescheduleHours: number;
  sameDayCutoffMin: number;
};

export type ServiceFormQuestion = {
  id: string;
  label: string;
  key: string;
  type: "text" | "textarea" | "number" | "select" | "boolean";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

export type ServicePriceMatrixRow = any; // if you have a strict schema, replace this

export type ServiceDetail = {
  id: string;
  _id: string;

  name: string;
  slug: string;
  description?: string;

  // media
  image?: string;         // some UIs use single thumbnail
  images?: string[];

  // relations
  categoryId?: string;
  providerId?: string | null;

  // booking/pricing
  bookingType?: BookingType;
  quantityUnit?: QuantityUnit;

  basePrice?: number;
  currency?: CurrencyCode;

  durationMin?: number;
  teamSize?: number;

  minQty?: number;
  maxQty?: number | null;

  leadTimeMin?: number;
  bufferAfterMin?: number;

  minProfessionals?: number;
  maxProfessionals?: number;

  materialsAddonPrice?: number;

  // promo/tax
  promoCode?: string | null;
  promoPercent?: number;
  taxClass?: TaxClass;

  // flags
  isInstantBookable?: boolean;
  requiresAddress?: boolean;
  requiresSlot?: boolean;

  // visibility
  active?: boolean;
  status?: ServiceStatus;

  // catalog meta
  tags?: string[];
  cities?: string[];

  // variants/addons
  variants: ServiceVariant[];

  // FE sends addonIds (global addons selected). Backend stores addons[] embedded too.
  addonIds?: string[];
  addons?: ServiceAddon[];

  // advanced
  priceMatrix?: ServicePriceMatrixRow[];
  formTemplateId?: string;
  formQuestions?: ServiceFormQuestion[];
  policy?: ServicePolicy;

  createdAt?: string;
  updatedAt?: string;
};

// Minimal card (optional)
export type ServiceCard = {
  id: string;
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  price: number;
  currency?: CurrencyCode;

  categoryId?: string;
  status?: ServiceStatus;
  active?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

// ============================
// Payloads (client → API)
// ============================

export type CreateServicePayload = {
  name: string;
  slug?: string;
  skuCode?: string;

  categoryId: string;
  description?: string;

  bookingType?: BookingType;
  quantityUnit?: QuantityUnit;

  basePrice: number;
  durationMin?: number;
  teamSize?: number;

  minQty?: number;
  maxQty?: number | null;

  leadTimeMin?: number;
  bufferAfterMin?: number;

  minProfessionals?: number;
  maxProfessionals?: number;

  materialsAddonPrice?: number;

  promoCode?: string | null;
  promoPercent?: number;
  taxClass?: TaxClass;

  isInstantBookable?: boolean;
  requiresAddress?: boolean;
  requiresSlot?: boolean;

  images?: string[];
  tags?: string[];
  cities?: string[];

  variants?: Array<{
    name: string;
    priceDelta?: number;
    durationDelta?: number;
    code?: string;
    description?: string;
    image?: string;
  }>;

  // ✅ Global addon ids selected in UI
  addonIds?: string[];

  // legacy/direct addons (optional)
  addons?: ServiceAddon[];

  priceMatrix?: ServicePriceMatrixRow[];

  formTemplateId?: string;
  formQuestions?: ServiceFormQuestion[];
  policy?: ServicePolicy;

  active?: boolean;
  status?: "draft" | "published";
};

export type UpdateServicePayload = Partial<CreateServicePayload> & {
  id: string;
};

// ============================
// Dynamic form templates
// ============================
export type FormStep = { title: string; description?: string };
export type FormField = any;

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
// Quoting (UPDATED to backend)
// ============================

export type RecurrenceFrequency = "once" | "weekly" | "every_2_weeks" | "every_3_weeks";

export type SchedulePayload = {
  // backend normalizeSchedule supports either:
  // schedule: { startAt, timeSlot, tz, frequency, until?, count? }
  // OR legacy: date/startAt at top-level
  schedule?: {
    startAt: string; // ISO
    timeSlot?: string;
    tz?: string;
    frequency?: RecurrenceFrequency;
    until?: string; // ISO
    count?: number;
  };

  // legacy fallbacks:
  date?: string;    // ISO
  startAt?: string; // ISO
  timeSlot?: string;
  tz?: string;
  frequency?: RecurrenceFrequency;
  until?: string;
  count?: number;
};

export type VariantSelection = { variantId: string; qty?: number };
export type AddonSelection = { addonId: string; qty?: number };

export type QuoteRequest = SchedulePayload & {
  serviceIdOrSlug: string;
  qty?: number;

  // NEW selections arrays
  variantSelections?: VariantSelection[];
  addonSelections?: AddonSelection[];

  formAnswers?: Record<string, any>;
  currency?: CurrencyCode;
  promoCode?: string;

  // backend requires city string
  city: string;
};

export type QuoteLineItem = {
  label: string;
  amount: number;
  qty?: number;
};

export type QuoteResponse = {
  ok?: boolean;
  currency: CurrencyCode;
  total: number;

  // backend returns breakdown object (you used breakdown in controller)
  breakdown: any;

  // optional for UI
  lineItems?: QuoteLineItem[];
  schedule?: any;
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

const asStr = (v: any, def = "") => (v == null ? def : String(v));
const asNum = (v: any, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export function normalizeCategory(input: any): Category {
  if (!input) throw new Error("Empty category payload");

  // ✅ always derive both id and _id
  const id = asStr(input.id ?? input._id ?? crypto.randomUUID());
  const _id = asStr(input._id ?? input.id ?? id);

  return {
    id,
    _id, // ✅ FIX: ensure mongo-style id exists too

    name: asStr(input.name ?? input.title ?? "Untitled"),
    slug: asStr(input.slug ?? ""),
    image: input.image ?? input.icon ?? undefined,
    description: input.description ?? undefined,

    active:
      typeof input.active === "boolean"
        ? input.active
        : input.status
        ? asStr(input.status).toLowerCase() === "active"
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

  const id = asStr(input.id ?? input._id ?? crypto.randomUUID());
  const _id = asStr(input._id ?? id);

  const variants: ServiceVariant[] = Array.isArray(input.variants)
    ? input.variants.map((v: any) => ({
        _id: asStr(v._id ?? v.id ?? crypto.randomUUID()),
        name: asStr(v.name ?? "Variant"),
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
            : !!v.default_selected,
        isPopular:
          typeof v.isPopular === "boolean" ? v.isPopular : !!v.is_popular,
        code: v.code ?? undefined,
        image: v.image ?? undefined,
        description: v.description ?? undefined,
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
        segment: v.segment ?? undefined,
      }))
    : [];

  const addons: ServiceAddon[] = Array.isArray(input.addons)
    ? input.addons.map((a: any) => ({
        addonId: a.addonId ? asStr(a.addonId) : a.addon_id ? asStr(a.addon_id) : a._id ? asStr(a._id) : undefined,
        name: asStr(a.name ?? a.title ?? ""),
        price: asNum(a.price ?? a.perUnitPrice ?? a.per_unit_price ?? 0, 0),
        maxQty: a.maxQty != null ? asNum(a.maxQty, 1) : a.max_qty != null ? asNum(a.max_qty, 1) : undefined,
        durationDelta: a.durationDelta != null ? asNum(a.durationDelta, 0) : a.duration_delta != null ? asNum(a.duration_delta, 0) : undefined,
        perTeamMultiplier: a.perTeamMultiplier != null ? asNum(a.perTeamMultiplier, 0) : a.per_team_multiplier != null ? asNum(a.per_team_multiplier, 0) : undefined,
        requiresBaseVariant: typeof a.requiresBaseVariant === "boolean" ? a.requiresBaseVariant : !!a.requires_base_variant,
        code: a.code ? asStr(a.code) : undefined,
      }))
    : [];

  // addonIds: accept directly OR compute from addons.addonId
  const addonIdsFromPayload = Array.isArray(input.addonIds) ? input.addonIds.map(asStr) : Array.isArray(input.addon_ids) ? input.addon_ids.map(asStr) : [];
  const addonIdsFromAddons = addons.map((x) => x.addonId).filter(Boolean) as string[];
  const addonIds = [...new Set([...(addonIdsFromPayload || []), ...(addonIdsFromAddons || [])])];

  const policy =
    input.policy ??
    (input.policy ? input.policy : undefined) ??
    (input.policy ?? undefined);

  return {
    id,
    _id,

    name: asStr(input.name ?? "Untitled Service"),
    slug: asStr(input.slug ?? ""),
    description: input.description ?? undefined,

    image: input.image ?? undefined,
    images: Array.isArray(input.images) ? input.images : undefined,

    categoryId: input.categoryId ?? input.category_id ?? undefined,
    providerId: input.providerId ?? input.provider_id ?? undefined,

    bookingType: input.bookingType ?? input.booking_type ?? undefined,
    quantityUnit: input.quantityUnit ?? input.quantity_unit ?? undefined,

    basePrice:
      typeof input.basePrice === "number"
        ? input.basePrice
        : typeof input.base_price === "number"
        ? input.base_price
        : undefined,
    currency: (input.currency ?? undefined) as CurrencyCode | undefined,

    durationMin: input.durationMin ?? input.duration_min ?? undefined,
    teamSize: input.teamSize ?? input.team_size ?? undefined,
    minQty: input.minQty ?? input.min_qty ?? undefined,
    maxQty: input.maxQty ?? input.max_qty ?? undefined,

    leadTimeMin: input.leadTimeMin ?? input.lead_time_min ?? undefined,
    bufferAfterMin: input.bufferAfterMin ?? input.buffer_after_min ?? undefined,

    minProfessionals: input.minProfessionals ?? input.min_professionals ?? undefined,
    maxProfessionals: input.maxProfessionals ?? input.max_professionals ?? undefined,

    materialsAddonPrice: input.materialsAddonPrice ?? input.materials_addon_price ?? undefined,

    promoCode: input.promoCode ?? input.promo_code ?? undefined,
    promoPercent: input.promoPercent ?? input.promo_percent ?? undefined,
    taxClass: input.taxClass ?? input.tax_class ?? undefined,

    isInstantBookable: input.isInstantBookable ?? input.is_instant_bookable ?? undefined,
    requiresAddress: input.requiresAddress ?? input.requires_address ?? undefined,
    requiresSlot: input.requiresSlot ?? input.requires_slot ?? undefined,

    tags: Array.isArray(input.tags) ? input.tags : undefined,
    cities: Array.isArray(input.cities) ? input.cities : undefined,

    variants,
    addons,
    addonIds: addonIds.length ? addonIds : undefined,

    priceMatrix: Array.isArray(input.priceMatrix) ? input.priceMatrix : Array.isArray(input.price_matrix) ? input.price_matrix : undefined,
    formTemplateId: input.formTemplateId ?? input.form_template_id ?? undefined,
    formQuestions: Array.isArray(input.formQuestions) ? input.formQuestions : Array.isArray(input.form_questions) ? input.form_questions : undefined,

    policy:
      policy
        ? {
            cancellationHours: asNum(policy.cancellationHours ?? policy.cancellation_hours ?? 0, 0),
            rescheduleHours: asNum(policy.rescheduleHours ?? policy.reschedule_hours ?? 0, 0),
            sameDayCutoffMin: asNum(policy.sameDayCutoffMin ?? policy.same_day_cutoff_min ?? 0, 0),
          }
        : undefined,

    status: (input.status ?? undefined) as ServiceStatus | undefined,
    active:
      typeof input.active === "boolean"
        ? input.active
        : typeof input.status === "string"
        ? asStr(input.status).toLowerCase() === "active"
        : undefined,

    createdAt: input.createdAt ?? input.created_at ?? undefined,
    updatedAt: input.updatedAt ?? input.updated_at ?? undefined,
  };
}
