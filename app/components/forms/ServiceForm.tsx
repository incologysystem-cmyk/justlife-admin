// components/forms/ServiceForm.tsx
"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { Category } from "@/types/catalog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VariantEditor from "./parts/VariantEditor";
import AddonEditor from "./parts/AddonEditor";

/* ----------------- Enums & core schemas ----------------- */

const BookingTypeEnum = z.enum(["HOURLY", "UNIT_BASED"]);
const QuantityUnitEnum = z.enum(["hours", "items"]);

// Variants
const VariantSchema = z.object({
  name: z.string().trim().min(1),
  priceDelta: z.coerce.number().default(0),
  durationDelta: z.coerce.number().default(0),
  code: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
});
export type Variant = z.infer<typeof VariantSchema>;

// Booking questions
const QuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(["text", "textarea", "number", "select", "boolean"]),
  required: z.coerce.boolean().default(false),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .default([]),
});
export type Question = z.infer<typeof QuestionSchema>;

// ✅ Global addons ke IDs store karne ke liye
const BaseServiceSchema = z.object({
  name: z.string().trim().min(2, "Service name is required"),
  slug: z.string().trim().min(2, "Slug is required"),
  skuCode: z.string().trim().optional(),
  categoryId: z.string().min(1, "Select category"),

  bookingType: BookingTypeEnum.default("HOURLY"),
  quantityUnit: QuantityUnitEnum.default("hours"),

  basePrice: z.coerce.number().min(0),
  durationMin: z.coerce.number().min(0).default(60),
  teamSize: z.coerce.number().min(1).default(1),

  minQty: z.coerce.number().min(1).default(1),
  maxQty: z.coerce.number().min(1).optional(),

  minProfessionals: z.coerce.number().min(1).default(1),
  maxProfessionals: z.coerce.number().min(1).default(4),

  materialsAddonPrice: z.coerce.number().min(0).default(0),

  images: z.array(z.string()).default([]),
  variants: z.array(VariantSchema).default([]),

  // ✅ Sirf global Addons ke IDs
  addonIds: z.array(z.string()).default([]),

  active: z.coerce.boolean().default(true),
  status: z.enum(["draft", "published"]).default("draft"),
});

const ServiceSchema = BaseServiceSchema.extend({
  formQuestions: z.array(QuestionSchema).default([]),
});
export type ServicePayload = z.infer<typeof ServiceSchema>;

const TAB_ORDER = [
  "basics",
  "media",
  "variants",
  "addons",
  "form",
  "review",
  "confirm",
] as const;
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
  const {
    value,
    onChange,
    placeholder,
    min,
    max,
    step,
    unit,
    name,
    defaultValue,
    disabled,
  } = props;
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
const toNumOr = (def: number, v: any) =>
  Number.isFinite(Number(v)) ? Number(v) : def;

function safeParseNumber(fd: FormData, name: string, def: number) {
  const raw = fd.get(name);
  if (raw == null || raw === "") return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

/* ----------------- Form → payload builder ----------------- */

function buildRawFromForm(
  form: HTMLFormElement | null,
  extras: {
    images: string[];
    variants: z.infer<typeof VariantSchema>[];
    addonIds: string[];
    formQuestions: Question[];
    flags: { active: boolean };
    status: ServicePayload["status"];
    defaultCategoryId?: string;
  }
): ServicePayload {
  const fd = form ? new FormData(form) : new FormData();

  const payload: ServicePayload = {
    name: String(fd.get("name") || ""),
    slug: String(fd.get("slug") || "").trim().toLowerCase(),
    skuCode: (String(fd.get("skuCode") || "") || undefined) as any,
    categoryId: String(fd.get("categoryId") || extras.defaultCategoryId || ""),

    bookingType: (String(
      fd.get("bookingType") || "HOURLY"
    ) as ServicePayload["bookingType"]) || "HOURLY",
    quantityUnit: (String(
      fd.get("quantityUnit") || "hours"
    ) as ServicePayload["quantityUnit"]) || "hours",

    basePrice: safeParseNumber(fd, "basePrice", 0),
    durationMin: safeParseNumber(fd, "durationMin", 60),
    teamSize: safeParseNumber(fd, "teamSize", 1),

    minQty: safeParseNumber(fd, "minQty", 1),
    maxQty: (fd.get("maxQty")
      ? safeParseNumber(fd, "maxQty", 1)
      : undefined) as any,

    minProfessionals: safeParseNumber(fd, "minProfessionals", 1),
    maxProfessionals: safeParseNumber(fd, "maxProfessionals", 4),

    materialsAddonPrice: safeParseNumber(fd, "materialsAddonPrice", 0),

    images: extras.images || [],
    variants: (extras.variants || []).map((v) => ({
      ...v,
      priceDelta: toNumOr(0, (v as any).priceDelta),
      durationDelta: toNumOr(0, (v as any).durationDelta),
    })),

    // ✅ sirf IDs
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
  if (!p.name || p.name.trim().length < 2)
    issues.push("Service name: minimum 2 characters.");
  if (!p.slug || p.slug.trim().length < 2)
    issues.push(
      "Slug: minimum 2 characters (auto-generates from name if left blank)."
    );
  if (!p.categoryId) issues.push("Category: please select a category.");
  if (!Number.isFinite(p.basePrice) || p.basePrice < 0)
    issues.push("Base price: must be a non-negative number.");
  if (!Number.isFinite(p.durationMin) || p.durationMin < 0)
    issues.push("Duration: must be a non-negative number.");
  if (!Number.isFinite(p.teamSize) || p.teamSize < 1)
    issues.push("Team size: must be at least 1.");
  if (!Number.isFinite(p.minQty) || p.minQty < 1)
    issues.push("Min qty: must be at least 1.");
  if (
    p.maxQty != null &&
    (!Number.isFinite(p.maxQty) || p.maxQty < p.minQty)
  )
    issues.push("Max qty: if set, must be >= min qty.");
  if (!Number.isFinite(p.minProfessionals) || p.minProfessionals < 1)
    issues.push("Min professionals: must be at least 1.");
  if (
    !Number.isFinite(p.maxProfessionals) ||
    p.maxProfessionals < p.minProfessionals
  )
    issues.push("Max professionals: must be >= min professionals.");
  if (!Number.isFinite(p.materialsAddonPrice) || p.materialsAddonPrice < 0)
    issues.push("Materials price: must be a non-negative number.");
  return issues;
}

/* ---------- VariantEditor adapter (delta ↔ unitPrice + image + description) ---------- */

type VariantDelta = z.infer<typeof VariantSchema>;
type VariantUnit = {
  name: string;
  unitPrice: number;
  sku?: string;
  description?: string;
  image?: string;
};

function toUnit(list: VariantDelta[]): VariantUnit[] {
  return (list || []).map((v) => ({
    name: v.name,
    unitPrice: Number.isFinite(v.priceDelta) ? Number(v.priceDelta) : 0,
    sku: v.code,
    description: v.description,
    image: v.image,
  }));
}
function toDelta(list: VariantUnit[]): VariantDelta[] {
  return (list || []).map((v) => ({
    name: v.name ?? "",
    priceDelta: Number.isFinite(v.unitPrice) ? Number(v.unitPrice) : 0,
    durationDelta: 0,
    code: v.sku || undefined,
    description: v.description || undefined,
    image: v.image || undefined,
  }));
}
function VariantEditorCompat({
  value,
  onChange,
}: {
  value: VariantDelta[];
  onChange: (v: VariantDelta[]) => void;
}) {
  return (
    <VariantEditor
      value={toUnit(value)}
      onChange={(u: VariantUnit[]) => onChange(toDelta(u))}
    />
  );
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
  const [status, setStatus] = useState<ServicePayload["status"]>("draft");
  const [images, setImages] = useState<string[]>([]);
  const [variants, _setVariants] = useState<z.infer<typeof VariantSchema>[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);
  const [active, setActive] = useState(true);
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
  const setVariants = useCallback(
    (v: z.infer<typeof VariantSchema>[]) => {
      _setVariants(Array.isArray(v) ? v.map((x) => ({ ...x })) : []);
      bump();
    },
    [bump]
  );

  const snapshot = useMemo(() => {
    return buildRawFromForm(formRef.current, {
      images,
      variants,
      addonIds,
      formQuestions,
      flags: { active },
      status,
      defaultCategoryId,
    });
  }, [images, variants, addonIds, formQuestions, active, status, defaultCategoryId]);

  const issues = useMemo(() => computeIssues(snapshot), [snapshot]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd0 = new FormData(e.currentTarget);
    const intent = (fd0.get("status") as string) || "draft";
    const desiredStatus: ServicePayload["status"] =
      intent === "published" ? "published" : "draft";

    const raw = buildRawFromForm(formRef.current, {
      images,
      variants,
      addonIds,
      formQuestions,
      flags: { active },
      status: desiredStatus,
      defaultCategoryId,
    });

    const parsed = ServiceSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(parsed.error);
      toast.error(
        parsed.error.issues[0]?.message || "Please fix validation errors"
      );
      setTab("review");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(parsed.data);
      toast.success(
        desiredStatus === "published" ? "Service published" : "Service saved"
      );
      formRef.current?.reset();
      setImages([]);
      setVariants([]);
      setAddonIds([]);
      setFormQuestions([]);
      setActive(true);
      setStatus("draft");
      setTab("basics");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  }

  const show = (key: TabKey) =>
    ({ display: tab === key ? "block" : "none" } as const);

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
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 rounded border border-border text-sm"
              >
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
            <div className="font-medium mb-1 text-gray-900">
              {issues.length} issue(s) found
            </div>
            <ul className="list-disc pl-5 space-y-1 text-gray-900">
              {issues.map((i, idx) => (
                <li key={`issue-${idx}`}>{i}</li>
              ))}
            </ul>
          </div>
        )}

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          className="w-full"
        >
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
          <TabsContent
            value="basics"
            forceMount
            style={show("basics")}
            className="space-y-4 pt-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Service name (shown to users)"
                helper="Add your service name customers will recognize."
              >
                <input
                  name="name"
                  required
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field
                label="Slug (used in URLs)"
                helper="Leave blank to auto-generate from name."
              >
                <input
                  name="slug"
                  placeholder="(auto)"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>

              <Field
                label="SKU Code (optional)"
                helper="Internal only; leave blank if unsure."
              >
                <input
                  name="skuCode"
                  placeholder="SOFA-DC-001"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>

              <Field
                label="Category"
                helper="Select the most relevant category."
              >
                <select
                  name="categoryId"
                  defaultValue={defaultCategoryId ?? ""}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((c, idx) => (
                    <option
                      key={`${
                        (c as any)._id ?? (c as any).id ?? (c as any).slug
                      }-${idx}`}
                      value={(c as any)._id}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Booking type"
                helper="Hourly (Home Cleaning) or unit-based (Sofa/Mattress etc.)."
              >
                <select
                  name="bookingType"
                  defaultValue="HOURLY"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="HOURLY">Hourly (e.g., Home Cleaning)</option>
                  <option value="UNIT_BASED">
                    Unit-based (e.g., Sofa/Mattress)
                  </option>
                </select>
              </Field>

              <Field
                label="Quantity unit label"
                helper="What does quantity represent? (shown to users)."
              >
                <select
                  name="quantityUnit"
                  defaultValue="hours"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="hours">Hours</option>
                  <option value="items">Items</option>
                </select>
              </Field>

              <Field
                label="Base price"
                helper="For hourly services, this is per hour (per professional)."
              >
                <NumberBox
                  name="basePrice"
                  min={0}
                  step={0.01}
                  placeholder="e.g., 35.00"
                  unit="AED"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Duration"
                  helper="Typical job duration in minutes."
                >
                  <NumberBox
                    name="durationMin"
                    min={0}
                    defaultValue={60}
                    unit="min"
                  />
                </Field>
                <Field
                  label="Team size"
                  helper="Number of staff typically assigned."
                >
                  <NumberBox
                    name="teamSize"
                    min={1}
                    defaultValue={1}
                    unit="people"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Min quantity"
                  helper="Minimum hours/units a customer must book."
                >
                  <NumberBox
                    name="minQty"
                    min={1}
                    defaultValue={1}
                    unit="qty"
                  />
                </Field>
                <Field
                  label="Max quantity (optional)"
                  helper="Maximum hours/units per booking; optional."
                >
                  <NumberBox name="maxQty" min={1} unit="qty" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Min professionals"
                  helper="Minimum number of professionals allowed."
                >
                  <NumberBox
                    name="minProfessionals"
                    min={1}
                    defaultValue={1}
                    unit="pros"
                  />
                </Field>
                <Field
                  label="Max professionals"
                  helper="Maximum number of professionals allowed."
                >
                  <NumberBox
                    name="maxProfessionals"
                    min={1}
                    defaultValue={4}
                    unit="pros"
                  />
                </Field>
              </div>

              <Field
                label="Materials addon price"
                helper='If customer selects "Yes, bring materials", how much extra to charge per booking.'
              >
                <NumberBox
                  name="materialsAddonPrice"
                  min={0}
                  step={0.01}
                  defaultValue={0}
                  unit="AED"
                />
              </Field>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span className="text-gray-900">
                  Active (visible in catalog)
                  <p className="text-[11px] text-gray-900 mt-1">
                    Make this service visible & bookable.
                  </p>
                </span>
              </label>
              <div className="text-xs text-gray-900">
                Status:{" "}
                <span className="text-gray-900 capitalize">{status}</span>
              </div>
            </div>

            <NavBar goPrev={goPrev} goNext={goNext} isFirst />
          </TabsContent>

          {/* ---------- MEDIA ---------- */}
          <TabsContent
            value="media"
            forceMount
            style={show("media")}
            className="space-y-4 pt-4"
          >
            <Field
              label="Images"
              helper="Upload high-quality photos; first image is the thumbnail."
            >
              <ImagePicker
                images={images}
                setImages={(v) => {
                  setImages(v);
                }}
              />
            </Field>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- VARIANTS ---------- */}
          <TabsContent
            value="variants"
            forceMount
            style={show("variants")}
            className="space-y-4 pt-4"
          >
            <p className="text-[11px] text-gray-900">
              For unit-based services (e.g., sofa sizes), create options with
              their own prices. For hourly services, you can leave this empty or
              use it for special levels (basic/deep clean).
            </p>
            <VariantEditorCompat value={variants} onChange={setVariants} />
            <div className="text-[11px] text-gray-900">
              Live variants count: <b>{variants.length}</b>
            </div>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- ADD-ONS (global addonIds) ---------- */}
          <TabsContent
            value="addons"
            forceMount
            style={show("addons")}
            className="space-y-4 pt-4"
          >
            <p className="text-[11px] text-gray-900">
              Select which global add-ons will be available for this service
              (e.g., materials kit, deep cleaning extras).
            </p>
            <AddonEditor value={addonIds} onChange={setAddonIds} />
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- FORM QUESTIONS ---------- */}
          <TabsContent
            value="form"
            forceMount
            style={show("form")}
            className="space-y-4 pt-4"
          >
            <p className="text-[11px] text-gray-900">
              Add booking questions to collect details from customers, like
              hours, professionals, materials, and instructions.
            </p>
            <QuestionEditor
              value={formQuestions}
              onChange={(v) => {
                setFormQuestions(v);
              }}
            />
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ---------- REVIEW ---------- */}
          <TabsContent
            value="review"
            forceMount
            style={show("review")}
            className="space-y-4 pt-4"
          >
            <ReviewStep snapshot={snapshot} issues={issues} onBack={goPrev} />
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={goPrev}
                className="px-3 py-2 rounded border border-border text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setTab("confirm")}
                className="px-3 py-2 rounded bg-white/10 border border-border text-sm"
              >
                Continue to Confirmation →
              </button>
            </div>
          </TabsContent>

          {/* ---------- CONFIRM ---------- */}
          <TabsContent
            value="confirm"
            forceMount
            style={show("confirm")}
            className="space-y-4 pt-4"
          >
            <ConfirmationStep
              snapshot={snapshot}
              issues={issues}
              loading={loading}
              onBack={() => setTab("review")}
            />
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

/* ----------------- Extra components ----------------- */

function NavBar({
  goPrev,
  goNext,
  isFirst = false,
}: {
  goPrev: () => void;
  goNext: () => void;
  isFirst?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        onClick={goPrev}
        className="px-3 py-2 rounded border border-border text-sm disabled:opacity-50"
        disabled={isFirst}
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={goNext}
        className="px-3 py-2 rounded bg-white/10 border border-border text-sm"
      >
        Next step →
      </button>
    </div>
  );
}

function ImagePicker({
  images,
  setImages,
}: {
  images: string[];
  setImages: (v: string[]) => void;
}) {
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
      // @ts-ignore – Buffer from bundler/polyfill
      arr.push(`data:${f.type};base64,${Buffer.from(buf).toString("base64")}`);
    }
    if (arr.length) setImages([...images, ...arr]);
  }
  function remove(i: number) {
    setImages(images.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-2">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => onFiles(e.target.files)}
      />
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div
              key={`${i}-${src.slice(0, 12)}`}
              className="relative border border-border rounded overflow-hidden"
            >
              <img
                src={src}
                alt={`img-${i}`}
                className="w-full h-28 object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-2 top-2 text-xs px-2 py-0.5 rounded bg-black/60"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionEditor({
  value,
  onChange,
}: {
  value: Question[];
  onChange: (v: Question[]) => void;
}) {
  function addQuestion() {
    const id =
      (globalThis as any)?.crypto?.randomUUID?.() ??
      `q_${Math.random().toString(36).slice(2, 10)}`;
    onChange([
      ...value,
      { id, label: "", key: "", type: "text", required: false, options: [] },
    ]);
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
        <div className="text-sm font-medium text-gray-900">
          Booking Questions
        </div>
        <button
          type="button"
          className="px-2 py-1 rounded border border-border text-xs"
          onClick={addQuestion}
        >
          + Add question
        </button>
      </div>

      {value.length === 0 ? (
        <div className="text-xs text-gray-900">No questions yet.</div>
      ) : (
        <div className="space-y-3">
          {value.map((q, i) => (
            <div
              key={q.id}
              className="rounded border border-border p-3 grid md:grid-cols-6 gap-3"
            >
              <Field
                label="Label (customer sees)"
                helper="Short, clear question customers can answer quickly."
              >
                <input
                  value={q.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  placeholder="How many hours do you need?"
                />
              </Field>
              <Field
                label="Key (stored as)"
                helper="Storage key used in your booking payload."
              >
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
                  onChange={(e) =>
                    update(i, { type: e.target.value as Question["type"] })
                  }
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
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) =>
                    update(i, { required: e.target.checked })
                  }
                />
                <span className="text-xs text-gray-900">
                  Required
                  <p className="text-[11px] text-gray-900 mt-1">
                    Customers must answer this to continue.
                  </p>
                </span>
              </div>

              {q.type === "select" && (
                <div className="md:col-span-6">
                  <label className="text-[11px] text-gray-900">
                    Options (value:label, comma separated)
                  </label>
                  <input
                    value={q.options
                      .map((o) => `${o.value}:${o.label}`)
                      .join(",")}
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
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="px-2 py-1 rounded border border-border text-xs"
                >
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="text-xs font-semibold mb-2">{title}</div>
      <div className="text-xs">{children}</div>
    </div>
  );
}

function ReviewStep({
  snapshot,
  issues,
  onBack,
}: {
  snapshot: ServicePayload;
  issues: string[];
  onBack: () => void;
}) {
  const {
    name,
    slug,
    skuCode,
    categoryId,
    active,
    status,
    bookingType,
    quantityUnit,
    basePrice,
    durationMin,
    teamSize,
    minQty,
    maxQty,
    minProfessionals,
    maxProfessionals,
    materialsAddonPrice,
    images,
    variants,
    addonIds,
    formQuestions,
  } = snapshot;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Review</div>
      <p className="text-xs text-gray-900">
        Review all fields below. If anything is missing, fix it before
        publishing.
      </p>

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

      <Section title="Basics">
        <div>Name: {name || "—"}</div>
        <div>Slug: {slug || "—"}</div>
        <div>SKU: {skuCode || "—"}</div>
        <div>Category: {categoryId || "—"}</div>
        <div>Booking type: {bookingType}</div>
        <div>Quantity unit: {quantityUnit}</div>
        <div>Active: {active ? "Yes" : "No"}</div>
        <div>Status: {status}</div>
      </Section>

      <Section title="Pricing & Time">
        <div>Base price (AED): {basePrice ?? "—"}</div>
        <div>Duration (min): {durationMin ?? "—"}</div>
        <div>Team size: {teamSize ?? "—"}</div>
        <div>
          Min qty ({quantityUnit}): {minQty ?? "—"}
        </div>
        <div>
          Max qty ({quantityUnit}): {maxQty ?? "—"}
        </div>
        <div>
          Professionals: {minProfessionals} – {maxProfessionals}
        </div>
        <div>Materials addon (AED): {materialsAddonPrice ?? "—"}</div>
      </Section>

      <Section title="Media / Variants / Add-ons">
        <div>Images: {images?.length || 0}</div>
        <div>
          Variants:
          {variants?.length ? (
            <ul className="list-disc pl-5">
              {variants.map((v, i) => (
                <li key={`var-${i}`}>
                  {v.name} — {v.priceDelta} AED
                  {v.code ? ` (${v.code})` : ""}
                  {v.description ? ` — ${v.description}` : ""}
                  {v.image ? " [image]" : ""}
                </li>
              ))}
            </ul>
          ) : (
            " — none"
          )}
        </div>
        <div>
          Add-ons:
          {addonIds?.length ? (
            <ul className="list-disc pl-5">
              {addonIds.map((id, i) => (
                <li key={`addon-${id}-${i}`}>{id}</li>
              ))}
            </ul>
          ) : (
            " — none"
          )}
        </div>
      </Section>

      <Section title="Booking Questions">
        {formQuestions?.length ? (
          <ul className="list-disc pl-5">
            {formQuestions.map((q, i) => (
              <li key={`q-${q.id}`}>
                #{i + 1} {q.label || "—"} | key: {q.key || "—"} | type:{" "}
                {q.type} | required: {q.required ? "Yes" : "No"}
              </li>
            ))}
          </ul>
        ) : (
          "— No questions"
        )}
      </Section>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 rounded border border-border text-sm"
        >
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
      <p className="text-xs text-gray-900">
        Confirm the details below and publish. If issues are listed, go back and
        fix them.
      </p>

      {issues.length > 0 ? (
        <div className="rounded border border-yellow-600/40 bg-yellow-900/20 p-3 text-xs">
          <div className="font-medium mb-1 text-gray-900">
            {issues.length} issue(s) found
          </div>
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
          <span className="font-medium">Service:</span>{" "}
          {snapshot.name || "—"} ({snapshot.slug || "—"})
        </div>
        <div>
          <span className="font-medium">Category:</span>{" "}
          {snapshot.categoryId || "—"}
        </div>
        <div>
          <span className="font-medium">Base price:</span>{" "}
          {snapshot.basePrice ?? "—"} AED
        </div>
        <div>
          <span className="font-medium">Booking type:</span>{" "}
          {snapshot.bookingType}
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <span className="text-gray-900">
          I confirm these fields are correct and complete
          <p className="text-[11px] text-gray-900 mt-1">
            This will publish the service with the details above.
          </p>
        </span>
      </label>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 rounded border border-border text-sm"
        >
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
