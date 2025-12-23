// components/forms/ServiceForm.tsx
"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { Category } from "@/types/catalog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VariantEditor, { type VariantPayload } from "./parts/VariantEditor";
import AddonEditor from "./parts/AddonEditor";

/* ----------------- Enums & core schemas ----------------- */

const BookingTypeEnum = z.enum(["HOURLY", "UNIT_BASED"]);
const QuantityUnitEnum = z.enum(["hours", "items"]);
const StatusEnum = z.enum(["draft", "published"]);

// Booking questions (frontend simplified)
const QuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(["text", "textarea", "number", "select", "boolean"]),
  required: z.coerce.boolean().default(false),
  options: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
});
export type Question = z.infer<typeof QuestionSchema>;

/**
 * ✅ Base schema (variant-based pricing)
 */
const BaseServiceSchema = z.object({
  // Core
  name: z.string().trim().min(2, "Service name is required"),
  slug: z.string().trim().min(2, "Slug is required"),
  categoryId: z.string().min(1, "Select category"),
  description: z.string().trim().optional().default(""),

  bookingType: BookingTypeEnum.default("HOURLY"),
  quantityUnit: QuantityUnitEnum.default("hours"),

  // Flags
  requiresAddress: z.coerce.boolean().default(true),
  requiresSlot: z.coerce.boolean().default(true),

  // Visibility
  active: z.coerce.boolean().default(true),
  status: StatusEnum.default("draft"),

  // Media & meta
  images: z.array(z.string()).default([]),
  cities: z.array(z.string()).default([]),

  // ✅ variants required (use editor shape)
  variants: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        unitPrice: z.coerce.number().min(0),
        durationMin: z.coerce.number().min(0).default(60),
        tags: z.array(z.string().trim().min(1)).min(1),
        compareAtPrice: z.coerce.number().min(0).optional(),
        sku: z.string().trim().optional(),
        description: z.string().trim().optional(),
        image: z.string().trim().optional(),
      })
    )
    .min(1, "At least 1 variant is required")
    .default([]),

  addonIds: z.array(z.string()).default([]),

  // Form
  formQuestions: z.array(QuestionSchema).default([]),
});

const ServiceSchema = BaseServiceSchema;
export type ServicePayload = z.infer<typeof ServiceSchema>;

const TAB_ORDER = ["basics", "media", "variants", "addons", "form", "review", "confirm"] as const;
type TabKey = (typeof TAB_ORDER)[number];

/* ----------------- Small UI helpers ----------------- */

function UnitChip({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800/10 border border-gray-800 text-gray-800">
      {text}
    </span>
  );
}

function Field({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-900">{label}</label>
      {children}
      {helper && <p className="text-[11px] text-gray-900 mt-1">{helper}</p>}
    </div>
  );
}

function NumberBox(props: {
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  unit: string;
  name?: string;
  defaultValue?: number | string;
  disabled?: boolean;
}) {
  const { value, onChange, placeholder, min, max, step, unit, name, defaultValue, disabled } = props;
  return (
    <div className="relative">
      <input
        name={name}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step ?? "1"}
        value={value as any}
        defaultValue={defaultValue as any}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded border border-border bg-background px-3 pr-12 py-2 text-sm"
      />
      <UnitChip text={unit} />
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const toNumOr = (def: number, v: any) => (Number.isFinite(Number(v)) ? Number(v) : def);

function safeParseString(fd: FormData, name: string, def = "") {
  const raw = fd.get(name);
  if (raw == null) return def;
  return String(raw);
}

function parseCsvList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ----------------- Categories fetch ----------------- */

function isObjectId(s: string) {
  return /^[a-fA-F0-9]{24}$/.test(String(s || ""));
}

async function fetchProviderCategories(): Promise<Category[]> {
  const res = await fetch("/api/provider/categories?onlyActive=true", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || json?.error || `Failed to fetch categories (HTTP ${res.status})`);
  }

  const list: any[] =
    (Array.isArray(json?.items) && json.items) ||
    (Array.isArray(json?.categories) && json.categories) ||
    (Array.isArray(json?.data) && json.data) ||
    (Array.isArray(json?.data?.categories) && json.data.categories) ||
    [];

  const normalized = list
    .map((c: any) => {
      const id = String(c?._id ?? c?.id ?? "");
      const name = String(c?.name ?? "");
      if (!id || !name) return null;
      return { ...(c as any), id, _id: id, name, slug: c?.slug } as any;
    })
    .filter(Boolean);

  return normalized as Category[];
}

/* ----------------- Form → payload builder ----------------- */

function buildRawFromForm(
  form: HTMLFormElement | null,
  extras: {
    images: string[];
    variants: VariantPayload[];
    addonIds: string[];
    formQuestions: Question[];
    flags: {
      active: boolean;
      requiresAddress: boolean;
      requiresSlot: boolean;
    };
    status: ServicePayload["status"];
    defaultCategoryId?: string;
  }
): ServicePayload {
  const fd = form ? new FormData(form) : new FormData();
  const citiesCsv = safeParseString(fd, "citiesCsv", "");

  const payload: ServicePayload = {
    name: safeParseString(fd, "name", ""),
    slug: safeParseString(fd, "slug", "").trim().toLowerCase(),
    categoryId: safeParseString(fd, "categoryId", extras.defaultCategoryId || ""),
    description: safeParseString(fd, "description", ""),

    bookingType: (safeParseString(fd, "bookingType", "HOURLY") as any) || "HOURLY",
    quantityUnit: (safeParseString(fd, "quantityUnit", "hours") as any) || "hours",

    requiresAddress: extras.flags.requiresAddress,
    requiresSlot: extras.flags.requiresSlot,

    images: extras.images || [],
    cities: parseCsvList(citiesCsv),

    variants: (extras.variants || []).map((v) => ({
      name: String(v.name ?? "").trim(),
      unitPrice: toNumOr(0, v.unitPrice),
      durationMin: toNumOr(60, v.durationMin),
      tags: Array.isArray(v.tags) ? v.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      compareAtPrice: v.compareAtPrice != null ? toNumOr(0, v.compareAtPrice) : undefined,
      sku: v.sku ? String(v.sku).trim() : undefined,
      description: v.description ? String(v.description).trim() : undefined,
      image: v.image ? String(v.image).trim() : undefined,
    })),

    addonIds: extras.addonIds || [],

    active: extras.flags.active,
    status: extras.status,

    formQuestions: extras.formQuestions || [],
  };

  if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
  return payload;
}

function computeIssues(p: ServicePayload): string[] {
  const issues: string[] = [];

  if (!p.name || p.name.trim().length < 2) issues.push("Service name: minimum 2 characters.");
  if (!p.slug || p.slug.trim().length < 2)
    issues.push("Slug: minimum 2 characters (auto-generates from name if left blank).");
  if (!p.categoryId) issues.push("Category: please select a category.");

  if (!p.variants || p.variants.length === 0) {
    issues.push("Variants: at least 1 variant is required.");
  } else {
    p.variants.forEach((v, i) => {
      if (!v.name || !v.name.trim()) issues.push(`Variant #${i + 1}: name is required.`);

      const d = (v as any).durationMin;
      if (!Number.isFinite(d) || d < 0) issues.push(`Variant "${v.name || `#${i + 1}`}": duration must be >= 0.`);

      const price = (v as any).unitPrice;
      if (!Number.isFinite(price) || price < 0)
        issues.push(`Variant "${v.name || `#${i + 1}`}": price must be >= 0.`);

      if (!Array.isArray((v as any).tags) || (v as any).tags.length === 0)
        issues.push(`Variant "${v.name || `#${i + 1}`}": at least 1 tag is required.`);
    });
  }

  return issues;
}

/* ----------------- Main ServiceForm ----------------- */

export default function ServiceForm({
  categories,
  defaultCategoryId,
  onSubmit,
  onCancel,
}: {
  categories: Category[];
  defaultCategoryId?: string;
  onSubmit: (payload: ServicePayload) => Promise<void>;
  onCancel?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  const [cats, setCats] = useState<Category[]>(Array.isArray(categories) ? categories : []);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(categories) && categories.length) setCats(categories);
  }, [categories]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setCatsError(null);
      setCatsLoading(true);
      try {
        const list = await fetchProviderCategories();
        if (!mounted) return;
        setCats(list);
      } catch (e: any) {
        if (!mounted) return;
        setCats([]);
        setCatsError(e?.message || "Failed to load categories");
      } finally {
        if (!mounted) return;
        setCatsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const [status, setStatus] = useState<ServicePayload["status"]>("draft");
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantPayload[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);

  const [active, setActive] = useState(true);
  const [requiresAddress, setRequiresAddress] = useState(true);
  const [requiresSlot, setRequiresSlot] = useState(true);

  const [tab, setTab] = useState<TabKey>("basics");

  const goNext = () => {
    const i = TAB_ORDER.indexOf(tab);
    if (i < TAB_ORDER.length - 1) setTab(TAB_ORDER[i + 1]);
  };
  const goPrev = () => {
    const i = TAB_ORDER.indexOf(tab);
    if (i > 0) setTab(TAB_ORDER[i - 1]);
  };

  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  const snapshot = useMemo(() => {
    return buildRawFromForm(formRef.current, {
      images,
      variants,
      addonIds,
      formQuestions,
      flags: { active, requiresAddress, requiresSlot },
      status,
      defaultCategoryId,
    });
  }, [images, variants, addonIds, formQuestions, active, requiresAddress, requiresSlot, status, defaultCategoryId]);

  const issues = useMemo(() => computeIssues(snapshot), [snapshot]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd0 = new FormData(e.currentTarget);
    const intent = (fd0.get("status") as string) || "draft";
    const desiredStatus: ServicePayload["status"] = intent === "published" ? "published" : "draft";

    const raw = buildRawFromForm(formRef.current, {
      images,
      variants,
      addonIds,
      formQuestions,
      flags: { active, requiresAddress, requiresSlot },
      status: desiredStatus,
      defaultCategoryId,
    });

    const parsed = ServiceSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please fix validation errors");
      setTab("review");
      return;
    }

    try {
      setLoading(true);

      // ✅ helpful debug
      // console.log("SUBMIT variants:", parsed.data.variants);

      await onSubmit(parsed.data);
      toast.success(desiredStatus === "published" ? "Service published" : "Service saved");

      formRef.current?.reset();
      setImages([]);
      setVariants([]);
      setAddonIds([]);
      setFormQuestions([]);
      setActive(true);
      setRequiresAddress(true);
      setRequiresSlot(true);
      setStatus("draft");
      setTab("basics");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  }

  const show = (key: TabKey) => ({ display: tab === key ? "block" : "none" } as const);
  const canSelectCategory = cats.length > 0 && !catsLoading;

  return (
    <div className="flex justify-center">
      <form
        id="service-form"
        ref={formRef}
        onSubmit={handleSubmit}
        onInput={bump}
        onChange={bump}
        className="w-full max-w-[1000px] bg-card border border-border rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-xl"
      >
        <div className="flex items-center justify-between sticky top-0 bg-card z-10 pb-3">
          <div className="text-base font-semibold">Service Editor (Justlife)</div>
          <div className="flex gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel} className="px-3 py-2 rounded border border-border text-sm">
                Cancel
              </button>
            )}
            <button
              type="submit"
              name="status"
              value="draft"
              disabled={loading}
              className="px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm disabled:opacity-50"
              onClick={() => setStatus("draft")}
            >
              {loading && status === "draft" ? "Saving..." : "Save draft"}
            </button>
            <button
              type="button"
              disabled={loading}
              className="px-3 py-2 rounded bg-emerald-500/30 border border-emerald-500/50 text-sm disabled:opacity-50"
              onClick={() => setTab("confirm")}
            >
              Publish…
            </button>
          </div>
        </div>

        {issues.length > 0 && tab !== "confirm" && (
          <div className="rounded border border-yellow-600/40 bg-yellow-900/20 p-3 text-xs">
            <div className="font-medium mb-1 text-gray-900">{issues.length} issue(s) found</div>
            <ul className="list-disc pl-5 space-y-1 text-gray-900">
              {issues.map((i, idx) => (
                <li key={`issue-${idx}`}>{i}</li>
              ))}
            </ul>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full sticky top-[52px] bg-card z-10">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="confirm">Confirmation</TabsTrigger>
          </TabsList>

          {/* ---------- BASICS ---------- */}
          <TabsContent value="basics" forceMount style={show("basics")} className="space-y-4 pt-4">
            {catsError && (
              <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {catsError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Service name (shown to users)" helper="Add your service name customers will recognize.">
                <input name="name" required className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </Field>

              <Field label="Slug (used in URLs)" helper="Leave blank to auto-generate from name.">
                <input name="slug" placeholder="(auto)" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </Field>

              <Field label="Description" helper="Short description shown on service page/cards (optional).">
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Describe what’s included..."
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>

              <div className="space-y-4">
                <Field label="Category" helper="Select the most relevant category.">
                  {catsLoading ? (
                    <div className="mt-1 rounded border px-3 py-2 text-xs text-slate-600 bg-slate-50">Loading categories...</div>
                  ) : !canSelectCategory ? (
                    <div className="mt-1 rounded border px-3 py-2 text-xs text-slate-600 bg-slate-50">
                      No categories available. Please create a category first.
                    </div>
                  ) : (
                    <select
                      name="categoryId"
                      defaultValue={defaultCategoryId && isObjectId(defaultCategoryId) ? defaultCategoryId : ""}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {cats.map((c: any, idx) => {
                        const id = String(c?._id ?? c?.id ?? "");
                        return (
                          <option key={`${id}-${idx}`} value={id}>
                            {c?.name ?? "Untitled"}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </Field>
              </div>

              <Field label="Booking type" helper="Hourly (Home Cleaning) or unit-based (Sofa/Mattress etc.).">
                <select name="bookingType" defaultValue="HOURLY" className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                  <option value="HOURLY">Hourly (e.g., Home Cleaning)</option>
                  <option value="UNIT_BASED">Unit-based (e.g., Sofa/Mattress)</option>
                </select>
              </Field>

              <Field label="Quantity unit label" helper="What does quantity represent? (shown to users).">
                <select name="quantityUnit" defaultValue="hours" className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                  <option value="hours">Hours</option>
                  <option value="items">Items</option>
                </select>
              </Field>

              <Field label="Cities" helper="Comma separated (e.g., Dubai, Abu Dhabi).">
                <input name="citiesCsv" placeholder="Dubai, Abu Dhabi" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-start gap-2 text-xs">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                  <span className="text-gray-900">
                    Active (visible in catalog)
                    <p className="text-[11px] text-gray-900 mt-1">Make this service visible & bookable.</p>
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs">
                  <input type="checkbox" checked={requiresAddress} onChange={(e) => setRequiresAddress(e.target.checked)} />
                  <span className="text-gray-900">
                    Requires address
                    <p className="text-[11px] text-gray-900 mt-1">Customer must provide address for this service.</p>
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs">
                  <input type="checkbox" checked={requiresSlot} onChange={(e) => setRequiresSlot(e.target.checked)} />
                  <span className="text-gray-900">
                    Requires time slot
                    <p className="text-[11px] text-gray-900 mt-1">Customer must pick date/time slot to continue.</p>
                  </span>
                </label>
              </div>

              <div className="text-xs text-gray-900">
                Status: <span className="text-gray-900 capitalize">{status}</span>
              </div>
            </div>

            <NavBar goPrev={goPrev} goNext={goNext} isFirst />
          </TabsContent>

          {/* ---------- MEDIA ---------- */}
          <TabsContent value="media" forceMount style={show("media")} className="space-y-4 pt-4">
            <Field label="Images" helper="Upload high-quality photos; first image is the thumbnail.">
              <ImagePicker images={images} setImages={(v) => setImages(v)} />
            </Field>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- VARIANTS ---------- */}
          <TabsContent value="variants" forceMount style={show("variants")} className="space-y-4 pt-4">
            <p className="text-[11px] text-gray-900">
              Price + duration + tags are <b>per-variant</b>. Tags are <b>required</b>.
            </p>

            {/* ✅ NO MORE compat adapters */}
            <VariantEditor value={variants} onChange={setVariants} />

            <div className="text-[11px] text-gray-900">
              Live variants count: <b>{variants.length}</b>
            </div>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- ADD-ONS ---------- */}
          <TabsContent value="addons" forceMount style={show("addons")} className="space-y-4 pt-4">
            <AddonEditor value={addonIds} onChange={setAddonIds} />
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- FORM QUESTIONS ---------- */}
          <TabsContent value="form" forceMount style={show("form")} className="space-y-4 pt-4">
            <QuestionEditor value={formQuestions} onChange={(v) => setFormQuestions(v)} />
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- REVIEW ---------- */}
          <TabsContent value="review" forceMount style={show("review")} className="space-y-4 pt-4">
            <ReviewStep snapshot={snapshot} issues={issues} onBack={goPrev} />
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={goPrev} className="px-3 py-2 rounded border border-border text-sm">
                ← Back
              </button>
              <button type="button" onClick={() => setTab("confirm")} className="px-3 py-2 rounded bg-white/10 border border-border text-sm">
                Continue to Confirmation →
              </button>
            </div>
          </TabsContent>

          {/* ---------- CONFIRM ---------- */}
          <TabsContent value="confirm" forceMount style={show("confirm")} className="space-y-4 pt-4">
            <ConfirmationStep snapshot={snapshot} issues={issues} loading={loading} onBack={() => setTab("review")} />
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

/* ----------------- Extra components ----------------- */

function NavBar({ goPrev, goNext, isFirst = false }: { goPrev: () => void; goNext: () => void; isFirst?: boolean }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button type="button" onClick={goPrev} className="px-3 py-2 rounded border border-border text-sm disabled:opacity-50" disabled={isFirst}>
        ← Back
      </button>
      <button type="button" onClick={goNext} className="px-3 py-2 rounded bg-white/10 border border-border text-sm">
        Next step →
      </button>
    </div>
  );
}

function ImagePicker({ images, setImages }: { images: string[]; setImages: (v: string[]) => void }) {
  async function onFiles(files?: FileList | null) {
    if (!files || files.length === 0) return;
    const arr: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`"${f.name}" is over 5MB`);
        continue;
      }
      const buf = await f.arrayBuffer();
      // @ts-ignore
      arr.push(`data:${f.type};base64,${Buffer.from(buf).toString("base64")}`);
    }
    if (arr.length) setImages([...images, ...arr]);
  }
  function remove(i: number) {
    setImages(images.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-2">
      <input type="file" multiple accept="image/*" onChange={(e) => onFiles(e.target.files)} />
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div key={`${i}-${src.slice(0, 12)}`} className="relative border border-border rounded overflow-hidden">
              <img src={src} alt={`img-${i}`} className="w-full h-28 object-cover" />
              <button type="button" onClick={() => remove(i)} className="absolute right-2 top-2 text-xs px-2 py-0.5 rounded bg-black/60">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ value, onChange }: { value: Question[]; onChange: (v: Question[]) => void }) {
  function addQuestion() {
    const id = (globalThis as any)?.crypto?.randomUUID?.() ?? `q_${Math.random().toString(36).slice(2, 10)}`;
    onChange([...value, { id, label: "", key: "", type: "text", required: false, options: [] }]);
  }
  function update(i: number, patch: Partial<Question>) {
    onChange(value.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">Booking Questions</div>
        <button type="button" className="px-2 py-1 rounded border border-border text-xs" onClick={addQuestion}>
          + Add question
        </button>
      </div>

      {value.length === 0 ? (
        <div className="text-xs text-gray-900">No questions yet.</div>
      ) : (
        <div className="space-y-3">
          {value.map((q, i) => (
            <div key={q.id} className="rounded border border-border p-3 grid md:grid-cols-6 gap-3">
              <Field label="Label (customer sees)" helper="Short, clear question customers can answer quickly.">
                <input
                  value={q.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  placeholder="How many hours do you need?"
                />
              </Field>
              <Field label="Key (stored as)" helper="Storage key used in your booking payload.">
                <input
                  value={q.key}
                  onChange={(e) => update(i, { key: e.target.value })}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  placeholder="hours"
                />
              </Field>
              <Field label="Type" helper="Choose the input type.">
                <select
                  value={q.type}
                  onChange={(e) => update(i, { type: e.target.value as Question["type"] })}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="boolean">Yes/No</option>
                </select>
              </Field>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} />
                <span className="text-xs text-gray-900">
                  Required
                  <p className="text-[11px] text-gray-900 mt-1">Customers must answer this to continue.</p>
                </span>
              </div>

              {q.type === "select" && (
                <div className="md:col-span-6">
                  <label className="text-[11px] text-gray-900">Options (value:label, comma separated)</label>
                  <input
                    value={q.options.map((o) => `${o.value}:${o.label}`).join(",")}
                    onChange={(e) => {
                      const arr = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((tok) => {
                          const [value, label] = tok.split(":");
                          const v = (value ?? "").trim();
                          const l = (label ?? value ?? "").trim();
                          return { value: v, label: l };
                        });
                      update(i, { options: arr });
                    }}
                    placeholder="1:1 hour,2:2 hours,3:3 hours"
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
              )}

              <div className="md:col-span-6 flex justify-end">
                <button type="button" onClick={() => remove(i)} className="px-2 py-1 rounded border border-border text-xs">
                  Remove question
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({ snapshot, issues, onBack }: { snapshot: ServicePayload; issues: string[]; onBack: () => void }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Review</div>
      <p className="text-xs text-gray-900">Review all fields below. If anything is missing, fix it before publishing.</p>

      <div className="text-xs">
        {issues.length > 0 ? (
          <div className="mb-2">
            <span className="font-medium">{issues.length} issue(s) found</span>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              {issues.map((msg, idx) => (
                <li key={`rev-issue-${idx}`}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mb-2 text-emerald-700">No issues found.</div>
        )}
      </div>

      <div className="border border-border rounded-lg p-3 text-xs space-y-1">
        <div>Name: {snapshot.name || "—"}</div>
        <div>Slug: {snapshot.slug || "—"}</div>
        <div>Category: {snapshot.categoryId || "—"}</div>
        <div>Description: {snapshot.description || "—"}</div>
        <div>Booking type: {snapshot.bookingType}</div>
        <div>Quantity unit: {snapshot.quantityUnit}</div>
        <div>Active: {snapshot.active ? "Yes" : "No"}</div>
        <div>Status: {snapshot.status}</div>
        <div>Cities: {snapshot.cities?.length ? snapshot.cities.join(", ") : "—"}</div>

        <div className="pt-2">
          <div className="font-semibold">Variants</div>
          {snapshot.variants?.length ? (
            <ul className="list-disc pl-5">
              {snapshot.variants.map((v, i) => (
                <li key={`var-${i}`}>
                  {v.name} — {v.unitPrice} AED — {v.durationMin} min — tags: {v.tags.join(", ")}
                </li>
              ))}
            </ul>
          ) : (
            "— none"
          )}
        </div>

        <div className="pt-2">
          <div className="font-semibold">Add-ons</div>
          {snapshot.addonIds?.length ? (
            <ul className="list-disc pl-5">
              {snapshot.addonIds.map((id, i) => (
                <li key={`addon-${id}-${i}`}>{id}</li>
              ))}
            </ul>
          ) : (
            "— none"
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="px-3 py-2 rounded border border-border text-sm">
          ← Back
        </button>
      </div>
    </div>
  );
}

function ConfirmationStep({
  snapshot,
  issues,
  loading,
  onBack,
}: {
  snapshot: ServicePayload;
  issues: string[];
  loading: boolean;
  onBack: () => void;
}) {
  const [ack, setAck] = useState(false);
  const disabled = loading || issues.length > 0 || !ack;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Confirmation</div>

      {issues.length > 0 ? (
        <div className="rounded border border-yellow-600/40 bg-yellow-900/20 p-3 text-xs">
          <div className="font-medium mb-1 text-gray-900">{issues.length} issue(s) found</div>
          <ul className="list-disc pl-5 space-y-1 text-gray-900">
            {issues.map((i, idx) => (
              <li key={`cf-issue-${idx}`}>{i}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded border border-emerald-600/40 bg-emerald-900/10 p-3 text-xs text-emerald-800">
          All required checks passed. You can publish.
        </div>
      )}

      <div className="border border-border rounded-lg p-3 text-xs">
        <div>
          <span className="font-medium">Service:</span> {snapshot.name || "—"} ({snapshot.slug || "—"})
        </div>
        <div>
          <span className="font-medium">Category:</span> {snapshot.categoryId || "—"}
        </div>
        <div>
          <span className="font-medium">Booking type:</span> {snapshot.bookingType}
        </div>
        <div>
          <span className="font-medium">Requires address:</span> {snapshot.requiresAddress ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium">Requires time slot:</span> {snapshot.requiresSlot ? "Yes" : "No"}
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span className="text-gray-900">
          I confirm these fields are correct and complete
          <p className="text-[11px] text-gray-900 mt-1">This will publish the service with the details above.</p>
        </span>
      </label>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="px-3 py-2 rounded border border-border text-sm">
          ← Back to Review
        </button>
        <button
          type="submit"
          form="service-form"
          name="status"
          value="published"
          disabled={disabled}
          className="px-3 py-2 rounded bg-emerald-500/30 border border-emerald-500/50 text-sm disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish now"}
        </button>
      </div>
    </div>
  );
}
