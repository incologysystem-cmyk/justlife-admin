"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { Category } from "@/types/catalog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VariantEditor from "./parts/VariantEditor";
import AddonEditor from "./parts/AddonEditor";

const VariantSchema = z.object({
  name: z.string().trim().min(1),
  priceDelta: z.coerce.number().default(0),
  durationDelta: z.coerce.number().default(0),
  defaultSelected: z.coerce.boolean().default(false),
  isPopular: z.coerce.boolean().default(false),
  code: z.string().trim().optional(),
});

const AddonSchema = z.object({
  name: z.string().trim().min(1),
  perUnitPrice: z.coerce.number().min(0),
  durationDelta: z.coerce.number().default(0),
  maxQty: z.coerce.number().min(1).default(1),
  perTeamMultiplier: z.coerce.number().min(0).default(0),
  requiresBaseVariant: z.coerce.boolean().default(false),
  code: z.string().trim().optional(),
});

const MatrixRowSchema = z.object({
  keys: z.record(z.string().min(1), z.string().min(1)),
  price: z.coerce.number().min(0),
  minQty: z.coerce.number().min(1).default(1),
});

const QuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(["text","textarea","number","select","multiselect","boolean","date","time"]),
  required: z.coerce.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  matrixKey: z.string().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

const BaseServiceSchema = z.object({
  name: z.string().trim().min(2, "Service name is required"),
  slug: z.string().trim().min(2, "Slug is required"),
  skuCode: z.string().trim().optional(),
  categoryId: z.string().min(1, "Select category"),
  basePrice: z.coerce.number().min(0),
  durationMin: z.coerce.number().min(0).default(60),
  teamSize: z.coerce.number().min(1).default(1),
  minQty: z.coerce.number().min(1).default(1),
  maxQty: z.coerce.number().min(1).optional(),
  leadTimeMin: z.coerce.number().min(0).default(0),
  bufferAfterMin: z.coerce.number().min(0).default(0),
  taxClass: z.enum(["standard","reduced","zero"]).default("standard"),
  isInstantBookable: z.coerce.boolean().default(true),
  requiresAddress: z.coerce.boolean().default(true),
  requiresSlot: z.coerce.boolean().default(true),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  cities: z.array(z.string()).default([]),
  variants: z.array(VariantSchema).default([]),
  addons: z.array(AddonSchema).default([]),
  priceMatrix: z.array(MatrixRowSchema).default([]),
  formTemplateId: z.string().optional(),
  active: z.coerce.boolean().default(true),
  status: z.enum(["draft","published"]).default("draft"),
});

const ServiceSchema = BaseServiceSchema.extend({
  formQuestions: z.array(QuestionSchema).default([]),
});
export type ServicePayload = z.infer<typeof ServiceSchema>;

const ALL_CITIES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain"];
const SUGGESTED_TAGS = ["female_only","sofa_skill","carpet_skill","licensed","premium_team"];

const TAB_ORDER = [
  "basics","media","variants","addons","pricing","form","policies","cities","review","confirm",
] as const;
type TabKey = typeof TAB_ORDER[number];

function UnitChip({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800/10 border border-gray-800 text-gray-800">
      {text}
    </span>
  );
}
function Field({ label, children, helper }: { label: string; children: React.ReactNode; helper?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-900">{label}</label>
      {children}
      {helper && <p className="text-[11px] text-gray-900 mt-1">{helper}</p>}
    </div>
  );
}
function NumberBox(props: {
  value?: number | string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; min?: number; max?: number; step?: number | string; unit: string;
  name?: string; defaultValue?: number | string; disabled?: boolean;
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
  return s.toLowerCase().trim().replace(/["']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const toNumOr = (def: number, v: any) => (Number.isFinite(Number(v)) ? Number(v) : def);

function safeParseNumber(fd: FormData, name: string, def: number) {
  const raw = fd.get(name);
  if (raw == null || raw === "") return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

function buildRawFromForm(
  form: HTMLFormElement | null,
  extras: {
    images: string[]; tags: string[]; cities: string[];
    variants: z.infer<typeof VariantSchema>[]; addons: z.infer<typeof AddonSchema>[];
    priceMatrix: z.infer<typeof MatrixRowSchema>[]; formQuestions: Question[];
    flags: { isInstantBookable: boolean; requiresAddress: boolean; requiresSlot: boolean; active: boolean; };
    status: ServicePayload["status"]; defaultCategoryId?: string;
  }
): ServicePayload {
  const fd = form ? new FormData(form) : new FormData();

  const payload: ServicePayload = {
    name: String(fd.get("name") || ""),
    slug: String(fd.get("slug") || "").trim().toLowerCase(),
    skuCode: (String(fd.get("skuCode") || "") || undefined) as any,
    categoryId: String(fd.get("categoryId") || extras.defaultCategoryId || ""),
    basePrice: safeParseNumber(fd, "basePrice", 0),
    durationMin: safeParseNumber(fd, "durationMin", 60),
    teamSize: safeParseNumber(fd, "teamSize", 1),
    minQty: safeParseNumber(fd, "minQty", 1),
    maxQty: (fd.get("maxQty") ? safeParseNumber(fd, "maxQty", 1) : undefined) as any,
    leadTimeMin: safeParseNumber(fd, "leadTimeMin", 0),
    bufferAfterMin: safeParseNumber(fd, "bufferAfterMin", 0),
    taxClass: (String(fd.get("taxClass") || "standard") as ServicePayload["taxClass"]) ?? "standard",
    isInstantBookable: extras.flags.isInstantBookable,
    requiresAddress: extras.flags.requiresAddress,
    requiresSlot: extras.flags.requiresSlot,
    images: extras.images || [],
    tags: extras.tags || [],
    cities: extras.cities || [],
    variants: (extras.variants || []).map((v) => ({
      ...v,
      priceDelta: toNumOr(0, (v as any).priceDelta),
      durationDelta: toNumOr(0, (v as any).durationDelta),
    })),
    addons: (extras.addons || [])
      .filter((a) => (a?.name ?? "").trim().length > 0)
      .map((a) => ({
        ...a,
        perUnitPrice: toNumOr(0, (a as any).perUnitPrice),
        durationDelta: toNumOr(0, (a as any).durationDelta),
        maxQty: toNumOr(1, (a as any).maxQty),
        perTeamMultiplier: toNumOr(0, (a as any).perTeamMultiplier),
      })),
    priceMatrix: (extras.priceMatrix || []).map((r) => ({
      ...r,
      price: toNumOr(0, (r as any).price),
      minQty: toNumOr(1, (r as any).minQty),
    })),
    formTemplateId: (String(fd.get("formTemplateId") || "") || undefined) as any,
    active: extras.flags.active,
    status: extras.status,
    formQuestions: extras.formQuestions || [],
  };

  const policy = {
    cancellationHours: safeParseNumber(fd, "cancellationHours", 0),
    rescheduleHours: safeParseNumber(fd, "rescheduleHours", 0),
    sameDayCutoffMin: safeParseNumber(fd, "sameDayCutoffMin", 0),
  } as any;

  (payload as any).policy = policy;

  if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
  return payload;
}

function computeIssues(p: ServicePayload): string[] {
  const issues: string[] = [];
  if (!p.name || p.name.trim().length < 2) issues.push("Service name: minimum 2 characters.");
  if (!p.slug || p.slug.trim().length < 2) issues.push("Slug: minimum 2 characters (auto-generates from name if left blank).");
  if (!p.categoryId) issues.push("Category: please select a category.");
  if (!Number.isFinite(p.basePrice) || p.basePrice < 0) issues.push("Base price: must be a non-negative number.");
  if (!Number.isFinite(p.durationMin) || p.durationMin < 0) issues.push("Duration: must be a non-negative number.");
  if (!Number.isFinite(p.teamSize) || p.teamSize < 1) issues.push("Team size: must be at least 1.");
  if (!Number.isFinite(p.minQty) || p.minQty < 1) issues.push("Min qty: must be at least 1.");
  if (p.maxQty != null && (!Number.isFinite(p.maxQty) || p.maxQty < 1)) issues.push("Max qty: if set, must be at least 1.");
  return issues;
}

/** ---------- VariantEditor adapter (delta ↔ unitPrice) ---------- */
type VariantDelta = z.infer<typeof VariantSchema>;
type VariantUnit = { name: string; unitPrice: number; compareAtPrice?: number; sku?: string };

function toUnit(list: VariantDelta[]): VariantUnit[] {
  return (list || []).map(v => ({
    name: v.name,
    unitPrice: Number.isFinite(v.priceDelta) ? Number(v.priceDelta) : 0,
    compareAtPrice: undefined,
    sku: v.code,
  }));
}
function toDelta(list: VariantUnit[]): VariantDelta[] {
  return (list || []).map(v => ({
    name: v.name ?? "",
    priceDelta: Number.isFinite(v.unitPrice) ? Number(v.unitPrice) : 0,
    durationDelta: 0,
    defaultSelected: false,
    isPopular: false,
    code: v.sku || undefined,
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

/** ---------- AddonEditor adapter (rich add-on ↔ simple {price,maxQty}) ---------- */
type AddonDelta = z.infer<typeof AddonSchema>;
type AddonUnit = { name: string; price: number; maxQty: number };

function addonsToUnit(list: AddonDelta[]): AddonUnit[] {
  return (list || []).map(a => ({
    name: a.name,
    price: Number.isFinite(a.perUnitPrice) ? Number(a.perUnitPrice) : 0,
    maxQty: Number.isFinite(a.maxQty) ? Number(a.maxQty) : 1,
  }));
}

function addonsToDelta(units: AddonUnit[], prev: AddonDelta[]): AddonDelta[] {
  return (units || []).map((u, idx) => {
    const byName = prev?.find(p => p.name === u.name);
    const base = byName ?? prev?.[idx];
    return {
      name: u.name ?? "",
      perUnitPrice: Number.isFinite(u.price) ? Number(u.price) : 0,
      maxQty: Number.isFinite(u.maxQty) ? Number(u.maxQty) : 1,
      // Preserve extra fields when possible
      durationDelta: base?.durationDelta ?? 0,
      perTeamMultiplier: base?.perTeamMultiplier ?? 0,
      requiresBaseVariant: base?.requiresBaseVariant ?? false,
      code: base?.code,
    };
  });
}

function AddonEditorCompat({
  value,
  onChange,
}: {
  value: AddonDelta[];
  onChange: (v: AddonDelta[]) => void;
}) {
  return (
    <AddonEditor
      value={addonsToUnit(value)}
      onChange={(u: AddonUnit[]) => onChange(addonsToDelta(u, value))}
    />
  );
}

export default function ServiceForm({
  categories, defaultCategoryId, onSubmit, onCancel,
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
  const [tags, setTags] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [variants, _setVariants] = useState<z.infer<typeof VariantSchema>[]>([]);
  const [addons, _setAddons] = useState<z.infer<typeof AddonSchema>[]>([]);
  const [matrix, setMatrix] = useState<z.infer<typeof MatrixRowSchema>[]>([]);
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);
  const [isInstantBookable, setIsInstantBookable] = useState(true);
  const [requiresAddress, setRequiresAddress] = useState(true);
  const [requiresSlot, setRequiresSlot] = useState(true);
  const [active, setActive] = useState(true);
  const [tab, setTab] = useState<TabKey>("basics");
  const goNext = () => { const i = TAB_ORDER.indexOf(tab); if (i < TAB_ORDER.length - 1) setTab(TAB_ORDER[i + 1]); };
  const goPrev = () => { const i = TAB_ORDER.indexOf(tab); if (i > 0) setTab(TAB_ORDER[i - 1]); };
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const setVariants = useCallback((v: z.infer<typeof VariantSchema>[]) => {
    _setVariants(Array.isArray(v) ? v.map((x) => ({ ...x })) : []);
    bump();
  }, [bump]);
  const setAddons = useCallback((v: z.infer<typeof AddonSchema>[]) => {
    _setAddons(Array.isArray(v) ? v.map((x) => ({ ...x })) : []);
    bump();
  }, [bump]);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
    bump();
  }

  const snapshot = useMemo(() => {
    return buildRawFromForm(formRef.current, {
      images, tags, cities, variants, addons,
      priceMatrix: matrix, formQuestions,
      flags: { isInstantBookable, requiresAddress, requiresSlot, active },
      status, defaultCategoryId,
    });
  }, [images, tags, cities, variants, addons, matrix, formQuestions, isInstantBookable, requiresAddress, requiresSlot, active, status, defaultCategoryId]);

  const issues = useMemo(() => computeIssues(snapshot), [snapshot]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd0 = new FormData(e.currentTarget);
    const intent = (fd0.get("status") as string) || "draft";
    const desiredStatus: ServicePayload["status"] =
      intent === "published" ? "published" : "draft";

    const raw = buildRawFromForm(formRef.current, {
      images, tags, cities, variants, addons,
      priceMatrix: matrix, formQuestions,
      flags: { isInstantBookable, requiresAddress, requiresSlot, active },
      status: desiredStatus,
      defaultCategoryId,
    });

    const parsed = ServiceSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(parsed.error);
      toast.error(parsed.error.issues[0]?.message || "Please fix validation errors");
      setTab("review");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(parsed.data);
      toast.success(desiredStatus === "published" ? "Service published" : "Service saved");
      formRef.current?.reset();
      setImages([]); setTags([]); setCities([]); setVariants([]); setAddons([]);
      setMatrix([]); setFormQuestions([]); setIsInstantBookable(true);
      setRequiresAddress(true); setRequiresSlot(true); setActive(true);
      setStatus("draft"); setTab("basics");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  }

  const show = (key: TabKey) => ({ display: tab === key ? "block" : "none" } as const);

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
          <div className="text-base font-semibold">Service Editor (Slim)</div>
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
              {issues.map((i, idx) => <li key={`issue-${idx}`}>{i}</li>)}
            </ul>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="grid grid-cols-5 md:grid-cols-10 w-full sticky top-[52px] bg-card z-10">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="confirm">Confirmation</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" forceMount style={show("basics")} className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Service name (shown to users)" helper="Add your service name customers will recognize.">
                <input name="name" required className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </Field>
              <Field label="Slug (used in URLs)" helper="Leave blank to auto-generate from name.">
                <input name="slug" placeholder="(auto)" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </Field>
              <Field label="SKU Code (optional)" helper="Internal only; leave blank if unsure.">
                <input name="skuCode" placeholder="SOFA-DC-001" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </Field>
              <Field label="Category" helper="Select the most relevant category.">
                <select name="categoryId" defaultValue={defaultCategoryId ?? ""} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                  <option value="" disabled>Select category</option>
                  {categories.map((c, idx) => (
                    <option key={`${c.id}-${idx}`} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Base price" helper="Price before variants/add-ons.">
                <NumberBox name="basePrice" min={0} step={0.01} placeholder="e.g., 35.00" unit="AED" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration" helper="Typical job duration in minutes.">
                  <NumberBox name="durationMin" min={0} defaultValue={60} unit="min" />
                </Field>
                <Field label="Team size" helper="Number of staff typically assigned.">
                  <NumberBox name="teamSize" min={1} defaultValue={1} unit="people" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Min quantity" helper="Minimum units a customer must book.">
                  <NumberBox name="minQty" min={1} defaultValue={1} unit="units" />
                </Field>
                <Field label="Max quantity (optional)" helper="Maximum units per booking; optional.">
                  <NumberBox name="maxQty" min={1} unit="units" />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Lead time before booking" helper="Minimum notice required.">
                  <NumberBox name="leadTimeMin" min={0} defaultValue={0} unit="min" />
                </Field>
                <Field label="Buffer after job" helper="Rest time before next booking.">
                  <NumberBox name="bufferAfterMin" min={0} defaultValue={0} unit="min" />
                </Field>
                <Field label="Tax class" helper="VAT class for this service.">
                  <select name="taxClass" defaultValue="standard" className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                    <option value="standard">Standard</option>
                    <option value="reduced">Reduced</option>
                    <option value="zero">Zero</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" checked={isInstantBookable} onChange={(e) => setIsInstantBookable(e.target.checked)} />
                <span className="text-gray-900">Instant bookable<p className="text-[11px] text-gray-900 mt-1">Immediate confirmation (no manual approval).</p></span>
              </label>
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" checked={requiresAddress} onChange={(e) => setRequiresAddress(e.target.checked)} />
                <span className="text-gray-900">Requires address<p className="text-[11px] text-gray-900 mt-1">Customer must provide service location.</p></span>
              </label>
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" checked={requiresSlot} onChange={(e) => setRequiresSlot(e.target.checked)} />
                <span className="text-gray-900">Requires time slot<p className="text-[11px] text-gray-900 mt-1">Customer must choose a booking time.</p></span>
              </label>
            </div>

            <Field label="Tags (press Enter to add)" helper="Add keywords to improve search & filtering.">
              <TagInput value={tags} onChange={(v)=>{setTags(v);}} suggestions={SUGGESTED_TAGS} />
            </Field>

            <Field label="Form template (optional)" helper="Enter template ID if using an external dynamic form builder.">
              <input name="formTemplateId" placeholder="template id (optional)" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </Field>

            <div className="flex items-center gap-4">
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span className="text-gray-900">Active (visible in catalog)<p className="text-[11px] text-gray-900 mt-1">Make this service visible & bookable.</p></span>
              </label>
              <div className="text-xs text-gray-900">Status: <span className="text-gray-900 capitalize">{status}</span></div>
            </div>

            <NavBar goPrev={goPrev} goNext={goNext} isFirst />
          </TabsContent>

          <TabsContent value="media" forceMount style={show("media")} className="space-y-4 pt-4">
            <Field label="Images" helper="Upload high-quality photos; first image is the thumbnail.">
              <ImagePicker images={images} setImages={(v)=>{setImages(v);}} />
            </Field>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          {/* ===== Use the adapters here ===== */}
          <TabsContent value="variants" forceMount style={show("variants")} className="space-y-4 pt-4">
            <p className="text-[11px] text-gray-900">Create variant options that change price or time.</p>
            <VariantEditorCompat value={variants} onChange={setVariants} />
            <div className="text-[11px] text-gray-900">Live variants count: <b>{variants.length}</b></div>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          <TabsContent value="addons" forceMount style={show("addons")} className="space-y-4 pt-4">
            <p className="text-[11px] text-gray-900">Create optional extras customers can add during booking.</p>
            {/* FIX: Use the compat adapter so types match AddonEditor expectations */}
            <AddonEditorCompat value={addons} onChange={setAddons} />
            <div className="text-[11px] text-gray-900">Live add-ons count: <b>{addons.length}</b></div>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          <TabsContent value="pricing" forceMount style={show("pricing")} className="space-y-4 pt-4">
            <p className="text-[11px] text-gray-900">Add rows mapping dimension keys to price and minimum quantity.</p>
            <MatrixEditor rows={matrix} setRows={(v)=>{setMatrix(v);}} />
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          <TabsContent value="form" forceMount style={show("form")} className="space-y-4 pt-4">
            <p className="text-[11px] text-gray-900">Add booking questions to collect details from customers.</p>
            <QuestionEditor value={formQuestions} onChange={(v)=>{setFormQuestions(v);}} />
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          <TabsContent value="policies" forceMount style={show("policies")} className="space-y-4 pt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Cancellation window" helper="Hours before start when free cancellation applies.">
                <NumberBox name="cancellationHours" min={0} defaultValue={0} unit="hours" />
              </Field>
              <Field label="Reschedule window" helper="Hours before start when reschedule is allowed.">
                <NumberBox name="rescheduleHours" min={0} defaultValue={0} unit="hours" />
              </Field>
              <Field label="Same-day cutoff" helper="Minimum notice for same-day bookings.">
                <NumberBox name="sameDayCutoffMin" min={0} defaultValue={0} unit="min" />
              </Field>
            </div>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          <TabsContent value="cities" forceMount style={show("cities")} className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="text-xs text-gray-900">Available in cities</div>
              <div className="flex flex-wrap gap-2">
                {ALL_CITIES.map((c, idx) => {
                  const on = cities.includes(c);
                  return (
                    <button
                      key={`${c}-${idx}`}
                      type="button"
                      onClick={() => toggle(cities, c, setCities)}
                      className={`px-2 py-1 rounded border text-xs ${on ? "bg-emerald-500/20 border-emerald-500/30" : "border-border"}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-900">Toggle cities where this service is available.</p>
            </div>
            <NavBar goPrev={goPrev} goNext={goNext} />
          </TabsContent>

          <TabsContent value="review" forceMount style={show("review")} className="space-y-4 pt-4">
            <ReviewStep snapshot={snapshot} issues={issues} onBack={goPrev} variantsState={variants} addonsState={addons} />
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={goPrev} className="px-3 py-2 rounded border border-border text-sm">← Back</button>
              <button type="button" onClick={() => setTab("confirm")} className="px-3 py-2 rounded bg-white/10 border border-border text-sm">
                Continue to Confirmation →
              </button>
            </div>
          </TabsContent>

          <TabsContent value="confirm" forceMount style={show("confirm")} className="space-y-4 pt-4">
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

function TagInput({ value, onChange, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; }) {
  const [input, setInput] = useState("");
  function add(val: string) {
    const v = val.trim();
    if (!v) return;
    onChange(Array.from(new Set([...value, v])));
    setInput("");
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  return (
    <div className="rounded border border-border p-2">
      <div className="flex flex-wrap gap-2">
        {value.map((t, i) => (
          <span key={`${t}-${i}`} className="px-2 py-1 rounded bg-white/10 text-xs border border-border">
            {t}
            <button type="button" className="ml-1 text-gray-900" onClick={() => remove(i)}>×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
          placeholder="type & press Enter"
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {suggestions.map((s, i) => (
            <button key={`${s}-${i}`} type="button" className="px-2 py-1 rounded border border-border text-xs" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImagePicker({ images, setImages }: { images: string[]; setImages: (v: string[]) => void }) {
  async function onFiles(files?: FileList | null) {
    if (!files || files.length === 0) return;
    const arr: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 5 * 1024 * 1024) { toast.error(`"${f.name}" is over 5MB`); continue; }
      const buf = await f.arrayBuffer();
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

function MatrixEditor({ rows, setRows }: { rows: z.infer<typeof MatrixRowSchema>[]; setRows: (v: z.infer<typeof MatrixRowSchema>[]) => void; }) {
  function update(i: number, patch: Partial<z.infer<typeof MatrixRowSchema>>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateKey(i: number, key: string, value: string) {
    const next = { ...rows[i], keys: { ...rows[i].keys, [key]: value } };
    setRows(rows.map((r, idx) => (idx === i ? next : r)));
  }
  function remove(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-900">Define dimensioned rows (e.g., seats=3 → price 149, minQty 1)</div>
        <button type="button" onClick={() => setRows([...rows, { keys: {}, price: 0, minQty: 1 }])} className="px-2 py-1 rounded border border-border text-xs">
          + Add row
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-xs text-gray-900">No rows yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={`row-${i}`} className="grid md:grid-cols-5 gap-3 rounded border border-border p-3">
              <Field label="Key 1 (e.g., seats)" helper="Enter a dimension value used to compute pricing.">
                <input
                  value={(r.keys as any).seats ?? ""}
                  onChange={(e) => updateKey(i, "seats", e.target.value)}
                  placeholder="2 | 3 | 4"
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                />
              </Field>
              <Field label="Key 2 (optional)" helper="Add another dimension if needed.">
                <input
                  value={(r.keys as any).level ?? ""}
                  onChange={(e) => updateKey(i, "level", e.target.value)}
                  placeholder="basic | deep"
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                />
              </Field>
              <Field label="Price" helper="Price for this combination (AED).">
                <NumberBox min={0} value={r.price} onChange={(e) => update(i, { price: Number(e.target.value || 0) })} unit="AED" />
              </Field>
              <Field label="Min qty" helper="Minimum units required for this combo.">
                <NumberBox min={1} value={r.minQty} onChange={(e) => update(i, { minQty: Number(e.target.value || 1) })} unit="units" />
              </Field>
              <div className="md:col-span-5 flex justify-end">
                <button type="button" onClick={() => remove(i)} className="px-2 py-1 rounded border border-border text-xs">
                  Remove row
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ value, onChange }: { value: Question[]; onChange: (v: Question[]) => void; }) {
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
                  placeholder="How many seats?"
                />
              </Field>
              <Field label="Key (stored as)" helper="Storage key used in your booking payload.">
                <input
                  value={q.key}
                  onChange={(e) => update(i, { key: e.target.value })}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  placeholder="seats"
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
                  <option value="multiselect">Multi-select</option>
                  <option value="boolean">Yes/No</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                </select>
              </Field>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} />
                <span className="text-xs text-gray-900">Required<p className="text-[11px] text-gray-900 mt-1">Customers must answer this to continue.</p></span>
              </div>
              <Field label="Matrix key (optional)" helper="Link this to pricing matrix by matching the key.">
                <input
                  value={q.matrixKey ?? ""}
                  onChange={(e) => update(i, { matrixKey: e.target.value || undefined })}
                  placeholder="seats / level"
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                />
              </Field>

              {q.type === "number" && (
                <>
                  <Field label="Min (number)" helper="Smallest allowed number.">
                    <NumberBox value={q.min ?? ""} onChange={(e) => update(i, { min: e.target.value ? Number(e.target.value) : undefined })} unit="min" />
                  </Field>
                  <Field label="Max (number)" helper="Largest allowed number.">
                    <NumberBox value={q.max ?? ""} onChange={(e) => update(i, { max: e.target.value ? Number(e.target.value) : undefined })} unit="max" />
                  </Field>
                  <Field label="Step (increment)" helper="Increment size when increasing values.">
                    <NumberBox value={q.step ?? ""} onChange={(e) => update(i, { step: e.target.value ? Number(e.target.value) : undefined })} unit="step" />
                  </Field>
                </>
              )}

              {(q.type === "select" || q.type === "multiselect") && (
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
                    placeholder="2:Two-seater, 3:Three-seater, 4:Four-seater"
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
              )}

              <div className="md:col-span-6 flex justify-end">
                <button type="button" onClick={() => remove(i)} className="px-2 py-1 rounded border border-border text-xs">Remove question</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="text-xs font-semibold mb-2">{title}</div>
      <div className="text-xs">{children}</div>
    </div>
  );
}

function ReviewStep({ snapshot, issues, onBack, variantsState, addonsState }: { snapshot: ServicePayload; issues: string[]; onBack: () => void; variantsState: z.infer<typeof VariantSchema>[]; addonsState: z.infer<typeof AddonSchema>[]; }) {
  const {
    name, slug, skuCode, categoryId, active, status,
    basePrice, durationMin, teamSize, minQty, maxQty, leadTimeMin, bufferAfterMin,
    taxClass, isInstantBookable, requiresAddress, requiresSlot,
    images, tags, cities, variants, addons, priceMatrix, formQuestions,
  } = snapshot;

  const variantsShow = variants?.length ? variants : variantsState;
  const addonsShow = addons?.length ? addons : addonsState;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Review</div>
      <p className="text-xs text-gray-900">Review all fields below. If anything is missing, fix it before publishing.</p>

      <div className="text-xs">
        {issues.length > 0 ? (
          <div className="mb-2">
            <span className="font-medium">{issues.length} issue(s) found</span>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              {issues.map((msg, idx) => (<li key={`rev-issue-${idx}`}>{msg}</li>))}
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
        <div>Active: {active ? "Yes" : "No"}</div>
        <div>Status: {status}</div>
      </Section>

      <Section title="Pricing & Time">
        <div>Base price (AED): {basePrice ?? "—"}</div>
        <div>Duration (min): {durationMin ?? "—"}</div>
        <div>Team size: {teamSize ?? "—"}</div>
        <div>Min qty: {minQty ?? "—"}</div>
        <div>Max qty: {maxQty ?? "—"}</div>
        <div>Lead time (min): {leadTimeMin ?? "—"}</div>
        <div>Buffer after (min): {bufferAfterMin ?? "—"}</div>
        <div>Tax class: {taxClass}</div>
        <div>Instant bookable: {isInstantBookable ? "Yes" : "No"}</div>
        <div>Requires address: {requiresAddress ? "Yes" : "No"}</div>
        <div>Requires time slot: {requiresSlot ? "Yes" : "No"}</div>
      </Section>

      <Section title="Media / Tags / Cities">
        <div>Images: {images?.length || 0}</div>
        <div>Tags: {tags?.length ? tags.join(", ") : "—"}</div>
        <div>Cities: {cities?.length ? cities.join(", ") : "—"}</div>
      </Section>

      <Section title="Variants">
        {variantsShow?.length ? (
          <ul className="list-disc pl-5">
            {variantsShow.map((v, i) => (
              <li key={`var-${i}`}>{v.name} (Δprice {v.priceDelta}, Δmin {v.durationDelta}){v.code ? ` — ${v.code}` : ""}</li>
            ))}
          </ul>
        ) : "— No variants"}
      </Section>

      <Section title="Add-ons">
        {addonsShow?.length ? (
          <ul className="list-disc pl-5">
            {addonsShow.map((a, i) => (
              <li key={`add-${i}`}>{a.name} — {a.perUnitPrice} AED (max {a.maxQty}){a.requiresBaseVariant ? " — requires variant" : ""}</li>
            ))}
          </ul>
        ) : "— No add-ons"}
      </Section>

      <Section title="Price Matrix">
        {priceMatrix?.length ? (
          <ul className="list-disc pl-5">
            {priceMatrix.map((r, i) => (<li key={`mx-${i}`}>#{i + 1} keys {JSON.stringify(r.keys)} | price: {r.price} | minQty: {r.minQty}</li>))}
          </ul>
        ) : "— No matrix rows"}
      </Section>

      <Section title="Booking Questions">
        {formQuestions?.length ? (
          <ul className="list-disc pl-5">
            {formQuestions.map((q, i) => (
              <li key={`q-${q.id}`}>#{i + 1} {q.label || "—"} | key: {q.key || "—"} | type: {q.type} | required: {q.required ? "Yes" : "No"}</li>
            ))}
          </ul>
        ) : "— No questions"}
      </Section>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="px-3 py-2 rounded border border-border text-sm">← Back</button>
      </div>
    </div>
  );
}

function ConfirmationStep({
  snapshot, issues, loading, onBack,
}:{ snapshot: ServicePayload; issues: string[]; loading: boolean; onBack: () => void; })  {
  const [ack, setAck] = useState(false);
  const disabled = loading || issues.length > 0 || !ack;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Confirmation</div>
      <p className="text-xs text-gray-900">Confirm the details below and publish. If issues are listed, go back and fix them.</p>

      {issues.length > 0 ? (
        <div className="rounded border border-yellow-600/40 bg-yellow-900/20 p-3 text-xs">
          <div className="font-medium mb-1 text-gray-900">{issues.length} issue(s) found</div>
          <ul className="list-disc pl-5 space-y-1 text-gray-900">
            {issues.map((i, idx) => (<li key={`cf-issue-${idx}`}>{i}</li>))}
          </ul>
        </div>
      ) : (
        <div className="rounded border border-emerald-600/40 bg-emerald-900/10 p-3 text-xs text-emerald-800">
          All required checks passed. You can publish.
        </div>
      )}

      <div className="border border-border rounded-lg p-3 text-xs">
        <div><span className="font-medium">Service:</span> {snapshot.name || "—"} ({snapshot.slug || "—"})</div>
        <div><span className="font-medium">Category:</span> {snapshot.categoryId || "—"}</div>
        <div><span className="font-medium">Base price:</span> {snapshot.basePrice ?? "—"} AED</div>
        <div><span className="font-medium">Cities:</span> {snapshot.cities?.length ? snapshot.cities.join(", ") : "—"}</div>
      </div>

      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span className="text-gray-900">I confirm these fields are correct and complete<p className="text-[11px] text-gray-900 mt-1">This will publish the service with the details above.</p></span>
      </label>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="px-3 py-2 rounded border border-border text-sm">← Back to Review</button>
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
