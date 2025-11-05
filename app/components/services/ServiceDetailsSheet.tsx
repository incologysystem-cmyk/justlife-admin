// app/components/services/ServiceDetailsSheet.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  ImageIcon, Clock, Users, Layers, Tag, MapPin, CheckCircle2, XCircle, Hash, Pencil, Trash2, Save, X
} from "lucide-react";

type Props = {
  serviceIdOrSlug: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Optional: let the parent refresh the list after delete/update */
  onChanged?: () => void;
};

type Variant = {
  name: string;
  priceDelta?: number;
  durationDelta?: number;
  defaultSelected?: boolean;
  isPopular?: boolean;
  code?: string;
  _id?: string;
};

type Addon = {
  name: string;
  perUnitPrice: number;
  durationDelta?: number;
  maxQty?: number;
  perTeamMultiplier?: number;
  requiresBaseVariant?: boolean;
};

type PriceMatrixRow = {
  keys?: Record<string, string | number>;
  price: number;
  minQty?: number;
};

type FormQuestion = {
  id: string;
  label: string;
  key: string;
  type: string;
  required?: boolean;
  options?: Array<{ label?: string; value?: string } | string>;
  matrixKey?: string;
};

type Policy = {
  cancellationHours?: number;
  rescheduleHours?: number;
  sameDayCutoffMin?: number;
};

type ServiceDoc = {
  _id: string;
  id?: string;
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
  taxClass?: "standard" | "reduced" | "zero" | string;
  isInstantBookable?: boolean;
  requiresAddress?: boolean;
  requiresSlot?: boolean;
  active?: boolean;
  status?: "draft" | "published" | string;
  images?: string[];
  tags?: string[];
  cities?: string[];
  variants?: Variant[];
  addons?: Addon[];
  priceMatrix?: PriceMatrixRow[];
  formQuestions?: FormQuestion[];
  policy?: Policy;
  createdAt?: string;
  updatedAt?: string;
};

function fmtMoney(n?: number, currency = "AED") {
  const v = Number(n ?? 0);
  return `${currency} ${v.toFixed(2)}`;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] text-gray-800">
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5">
      <div className="text-gray-600">{label}</div>
      <div className="text-gray-900 font-medium">{value ?? "—"}</div>
    </div>
  );
}

function Section({
  title, icon, children, right,
}: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function ServiceDetailsSheet({
  serviceIdOrSlug, open, onOpenChange, onChanged,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [doc, setDoc] = useState<ServiceDoc | null>(null);

  // inline edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  // editable fields (minimal quick-edit)
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(60);
  const [active, setActive] = useState<boolean>(true);
  const [status, setStatus] = useState<"draft" | "published" | string>("draft");

  useEffect(() => {
    if (!open) {
      setDoc(null);
      setErr(null);
      setLoading(false);
      setEditing(false);
      return;
    }
    if (!serviceIdOrSlug) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/admin/services/${encodeURIComponent(serviceIdOrSlug)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        const ct = res.headers.get("content-type") || "";
        const isJSON = ct.includes("application/json");
        const payload = isJSON ? await res.json().catch(() => ({})) : await res.text();

        if (!res.ok) {
          const message =
            (isJSON ? (payload as any)?.message : undefined) ||
            (typeof payload === "string" ? payload : "") ||
            `HTTP ${res.status}`;
          throw new Error(message);
        }

        const data: ServiceDoc = (payload as any)?.data ?? (payload as any);
        if (!cancelled) {
          setDoc(data);
          // seed edit fields
          setName(data.name ?? "");
          setBasePrice(Number(data.basePrice ?? 0));
          setDurationMin(Number(data.durationMin ?? 60));
          setActive(Boolean(data.active ?? true));
          setStatus((data.status as any) ?? "draft");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load service");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, serviceIdOrSlug]);

  const id = useMemo(() => doc?._id || doc?.id, [doc]);
  const primaryImage = useMemo(() => doc?.images?.[0], [doc]);
  const otherImages = useMemo(() => (doc?.images || []).slice(1), [doc]);

  async function handleSave() {
    if (!serviceIdOrSlug) return;
    try {
      setSaving(true);
      setErr(null);
      const body = {
        name,
        basePrice: Number(basePrice),
        durationMin: Number(durationMin),
        active,
        status,
      };
      const res = await fetch(`/api/admin/services/${encodeURIComponent(serviceIdOrSlug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.message || `HTTP ${res.status}`);
      }
      // update local doc
      const updated: ServiceDoc = payload?.data ?? payload;
      setDoc(updated);
      setEditing(false);
      onChanged?.();
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) {
      setErr("Delete requires service _id");
      return;
    }
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      setDelLoading(true);
      setErr(null);
      const res = await fetch(`/api/admin/services/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || `HTTP ${res.status}`);
      // close & notify parent
      onOpenChange(false);
      onChanged?.();
    } catch (e: any) {
      setErr(e?.message || "Failed to delete");
    } finally {
      setDelLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(100vw,1024px)] sm:max-w-none overflow-auto p-0 bg-white text-black"
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="text-base text-gray-900">
              {doc ? (
                <span className="inline-flex items-center gap-2">
                  {doc.name}
                  {doc.status === "published" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                      Draft
                    </Badge>
                  )}
                  {doc.active ? (
                    <Pill>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                    </Pill>
                  ) : (
                    <Pill>
                      <XCircle className="mr-1 h-3 w-3" /> Inactive
                    </Pill>
                  )}
                </span>
              ) : (
                "Service Details"
              )}
            </SheetTitle>

            {/* Actions */}
            {doc && (
              <div className="flex items-center gap-2">
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // reset fields from doc
                        if (doc) {
                          setName(doc.name ?? "");
                          setBasePrice(Number(doc.basePrice ?? 0));
                          setDurationMin(Number(doc.durationMin ?? 60));
                          setActive(Boolean(doc.active ?? true));
                          setStatus((doc.status as any) ?? "draft");
                        }
                        setEditing(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={delLoading || !id}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> {delLoading ? "Deleting…" : "Delete"}
                </button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6 text-black">
          {!serviceIdOrSlug && (
            <div className="text-sm text-gray-600">Select a service to view details.</div>
          )}
          {err && (
            <div className="text-sm text-red-700 border border-red-200 rounded-lg p-3 bg-red-50">
              {err}
            </div>
          )}
          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-40 w-full rounded-xl bg-gray-100" />
              <div className="grid md:grid-cols-3 gap-4">
                <div className="h-28 rounded-xl bg-gray-100" />
                <div className="h-28 rounded-xl bg-gray-100" />
                <div className="h-28 rounded-xl bg-gray-100" />
              </div>
            </div>
          )}

          {doc && (
            <>
              {/* Quick edit panel (collapsible) */}
              {editing && (
                <Section title="Quick Edit" icon={<Pencil className="h-4 w-4 text-gray-700" />}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-600">Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm"
                        placeholder="Service name"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-600">Base Price (AED)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={Number.isFinite(basePrice) ? basePrice : 0}
                        onChange={(e) => setBasePrice(parseFloat(e.target.value || "0"))}
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-600">Duration (min)</label>
                      <input
                        type="number"
                        value={Number.isFinite(durationMin) ? durationMin : 60}
                        onChange={(e) => setDurationMin(parseInt(e.target.value || "60", 10))}
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm"
                        placeholder="60"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-600">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm bg-white"
                      >
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id="activeToggle"
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="activeToggle" className="text-sm text-gray-900">
                        Active
                      </label>
                    </div>
                  </div>
                </Section>
              )}

              {/* Gallery */}
              <Section
                title="Gallery"
                icon={<ImageIcon className="h-4 w-4 text-gray-700" />}
                right={
                  <div className="text-xs text-gray-500">
                    {_safeCount(doc.images)} image{_safeCount(doc.images) === 1 ? "" : "s"}
                  </div>
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2">
                    <div className="aspect-video rounded-lg border border-gray-200 bg-gray-50 overflow-hidden grid place-items-center">
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={primaryImage} alt={doc.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-gray-500 text-sm flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" /> No image
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[232px] overflow-auto pr-1">
                    {otherImages.length > 0 ? (
                      otherImages.map((src, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={idx}
                          src={src}
                          alt={`${doc.name} ${idx + 2}`}
                          className="h-16 w-full object-cover rounded border border-gray-200"
                        />
                      ))
                    ) : (
                      <div className="text-xs text-gray-500">No additional images.</div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Core facts */}
              <Section title="Overview" icon={<Layers className="h-4 w-4 text-gray-700" />}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Row label="Base Price" value={fmtMoney(doc.basePrice)} />
                    <Row label="SKU" value={doc.skuCode || "—"} />
                    <Row label="Tax Class" value={doc.taxClass || "standard"} />
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Row
                      label="Duration"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {doc.durationMin ?? 60} min
                        </span>
                      }
                    />
                    <Row
                      label="Team Size"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {doc.teamSize ?? 1}
                        </span>
                      }
                    />
                    <Row label="Buffer After" value={`${doc.bufferAfterMin ?? 0} min`} />
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <Row label="Min Qty" value={doc.minQty ?? 1} />
                    <Row label="Max Qty" value={doc.maxQty ?? "—"} />
                    <Row label="Lead Time" value={`${doc.leadTimeMin ?? 0} min`} />
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs text-gray-600 mb-2 inline-flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(doc.tags || []).length ? (
                        doc.tags!.map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="bg-gray-100 text-gray-800 border-gray-300"
                          >
                            {t}
                          </Badge>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">No tags.</div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs text-gray-600 mb-2 inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Cities
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(doc.cities || []).length ? (
                        doc.cities!.map((c) => (
                          <Badge key={c} variant="outline" className="border-gray-300 text-gray-800 bg-gray-100">
                            {c}
                          </Badge>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">No cities.</div>
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Variants */}
              <Section
                title="Variants"
                icon={<Layers className="h-4 w-4 text-gray-700" />}
                right={<div className="text-xs text-gray-500">{_safeCount(doc.variants)} item(s)</div>}
              >
                {(doc.variants || []).length ? (
                  <div className="overflow-auto rounded border border-gray-200">
                    <table className="w-full text-sm text-gray-900">
                      <thead className="text-xs bg-gray-50 sticky top-0">
                        <tr className="text-left">
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2 text-right">Price Δ</th>
                          <th className="px-3 py-2 text-right">Duration Δ</th>
                          <th className="px-3 py-2">Flags</th>
                          <th className="px-3 py-2 hidden sm:table-cell">Code/Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.variants!.map((v) => (
                          <tr key={v._id ?? v.name} className="border-t border-gray-200">
                            <td className="px-3 py-2">{v.name}</td>
                            <td className="px-3 py-2 text-right">{Number(v.priceDelta ?? 0)}</td>
                            <td className="px-3 py-2 text-right">{Number(v.durationDelta ?? 0)} min</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {v.defaultSelected ? <Pill>Default</Pill> : null}
                                {v.isPopular ? <Pill>Popular</Pill> : null}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-700 hidden sm:table-cell">
                              {v.code || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">No variants.</div>
                )}
              </Section>

              {/* Add-ons */}
              <Section
                title="Add-ons"
                icon={<Hash className="h-4 w-4 text-gray-700" />}
                right={<div className="text-xs text-gray-500">{_safeCount(doc.addons)} item(s)</div>}
              >
                {(doc.addons || []).length ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {doc.addons!.map((a, i) => (
                      <div key={`${a.name}-${i}`} className="rounded border border-gray-200 p-3 bg-white">
                        <div className="text-sm font-medium text-gray-900">{a.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{fmtMoney(a.perUnitPrice)}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          <Pill>Duration Δ: {a.durationDelta ?? 0} min</Pill>
                          <Pill>Max Qty: {a.maxQty ?? "—"}</Pill>
                          <Pill>Per-team ×: {a.perTeamMultiplier ?? 0}</Pill>
                          <Pill>{a.requiresBaseVariant ? "Requires variant" : "No variant required"}</Pill>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">No add-ons.</div>
                )}
              </Section>

              {/* Price Matrix */}
              <Section
                title="Price Matrix"
                icon={<Layers className="h-4 w-4 text-gray-700" />}
                right={<div className="text-xs text-gray-500">{_safeCount(doc.priceMatrix)} row(s)</div>}
              >
                {(doc.priceMatrix || []).length ? (
                  <div className="overflow-auto rounded border border-gray-200">
                    <table className="w-full text-sm text-gray-900">
                      <thead className="text-xs bg-gray-50 sticky top-0">
                        <tr className="text-left">
                          <th className="px-3 py-2">Keys</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-right">Min Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.priceMatrix!.map((r, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(r.keys || {}).map(([k, v]) => (
                                  <Pill key={k}>
                                    {k}: {String(v)}
                                  </Pill>
                                ))}
                                {Object.keys(r.keys || {}).length === 0 && (
                                  <span className="text-xs text-gray-500">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">{fmtMoney(r.price)}</td>
                            <td className="px-3 py-2 text-right">{r.minQty ?? 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">No matrix rows.</div>
                )}
              </Section>

              {/* Form Questions */}
              <Section
                title="Form Questions"
                icon={<Hash className="h-4 w-4 text-gray-700" />}
                right={<div className="text-xs text-gray-500">{_safeCount(doc.formQuestions)} field(s)</div>}
              >
                {(doc.formQuestions || []).length ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {doc.formQuestions!.map((q) => (
                      <div key={q.id} className="rounded border border-gray-200 p-3 bg-white">
                        <div className="text-sm font-medium text-gray-900">{q.label}</div>
                        <div className="mt-1 text-[11px] text-gray-700">
                          key: <code className="text-gray-900">{q.key}</code> • type: {q.type}
                          {q.required ? " • required" : ""}
                          {q.matrixKey ? (
                            <>
                              {" "}
                              • matrixKey: <code className="text-gray-900">{q.matrixKey}</code>
                            </>
                          ) : null}
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {q.options.map((opt, i) => {
                              const label =
                                typeof opt === "string" ? opt : (opt.label ?? opt.value ?? String(i + 1));
                              return <Pill key={i}>{label}</Pill>;
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">No form fields.</div>
                )}
              </Section>

              {/* Policy & Meta */}
              <div className="grid lg:grid-cols-2 gap-4">
                <Section title="Policy" icon={<CheckCircle2 className="h-4 w-4 text-gray-700" />}>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="rounded border border-gray-200 p-3">
                      <div className="text-xs text-gray-600">Cancellation</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {doc.policy?.cancellationHours ?? 0} hrs
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 p-3">
                      <div className="text-xs text-gray-600">Reschedule</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {doc.policy?.rescheduleHours ?? 0} hrs
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 p-3">
                      <div className="text-xs text-gray-600">Same-day cutoff</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {doc.policy?.sameDayCutoffMin ?? 0} min
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Meta" icon={<Hash className="h-4 w-4 text-gray-700" />}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded border border-gray-200 p-3">
                      <Row label="ID" value={<code className="text-xs text-gray-800">{id}</code>} />
                      <Row label="Slug" value={<code className="text-xs text-gray-800">{doc.slug}</code>} />
                      <Row
                        label="Category ID"
                        value={<code className="text-xs text-gray-800">{doc.categoryId}</code>}
                      />
                    </div>
                    <div className="rounded border border-gray-200 p-3">
                      <Row label="Instant book" value={doc.isInstantBookable ? "Yes" : "No"} />
                      <Row label="Requires address" value={doc.requiresAddress ? "Yes" : "No"} />
                      <Row label="Requires slot" value={doc.requiresSlot ? "Yes" : "No"} />
                    </div>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-4">
                    <div className="rounded border border-gray-200 p-3">
                      <div className="text-xs text-gray-600">Created</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 p-3">
                      <div className="text-xs text-gray-600">Updated</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : "—"}
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------ helpers ------------ */
function _safeCount<T>(arr?: T[]) {
  return Array.isArray(arr) ? arr.length : 0;
}
