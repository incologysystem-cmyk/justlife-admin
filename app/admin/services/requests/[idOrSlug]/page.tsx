"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Variant = {
  _id?: string;
  name?: string;
  description?: string;
  image?: string;
  tags?: string[];
  absolutePrice?: number;
  compareAtPrice?: number;
  durationMin?: number;
};

type Addon = {
  addonId?: string;
  name?: string;
  price?: number;
  maxQty?: number;
};

type FormQ = {
  id: string;
  label: string;
  key: string;
  type: string;
  required: boolean;
  options?: any[];
};

type Service = {
  _id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
  bookingType?: string;
  quantityUnit?: string;
  cities?: string[];
  images?: string[];
  variants?: Variant[];
  addons?: Addon[];
  formQuestions?: FormQ[];
  createdAt?: string;
  updatedAt?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");
  let j: any = {};
  try {
    j = text ? JSON.parse(text) : {};
  } catch {
    j = { raw: text };
  }

  if (!r.ok) throw new Error(j?.message || j?.error || "Request failed");
  return j as T;
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "amber" | "emerald" | "red" | "blue";
}) {
  const map: Record<string, string> = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function ServiceRequestViewPage() {
  const params = useParams<{ idOrSlug: string }>();
  const router = useRouter();

  const idOrSlug = params?.idOrSlug;

  const [item, setItem] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeImg, setActiveImg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetchJson<any>(`/api/admin/servicesRequest/${idOrSlug}`);
        const service: Service = res?.item ?? res?.data ?? res;

        if (mounted) setItem(service);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Failed to load service");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (idOrSlug) load();

    return () => {
      mounted = false;
    };
  }, [idOrSlug]);

  const statusTone = useMemo(() => {
    const s = String(item?.status || "").toLowerCase();
    if (s === "draft") return "amber";
    if (s === "published") return "emerald";
    return "slate";
  }, [item?.status]);

  // pick hero image
  const heroImage = useMemo(() => {
    const img = item?.images?.[0] || null;
    return activeImg || img;
  }, [item?.images, activeImg]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-40 bg-slate-200 rounded" />
            <div className="grid md:grid-cols-3 gap-3">
              <div className="h-16 bg-slate-200 rounded" />
              <div className="h-16 bg-slate-200 rounded" />
              <div className="h-16 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border bg-red-50 p-4 text-red-700 text-sm">
          {err}
        </div>
        <button
          className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">
          Service not found.
        </div>
        <button
          className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-semibold text-slate-900 truncate">
                {item.name}
              </h1>
              <Badge tone={statusTone as any}>{item.status || "-"}</Badge>
              <Badge tone="slate">{item.bookingType || "—"}</Badge>
              <Badge tone="slate">{item.quantityUnit || "—"}</Badge>
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate">
              /{item.slug} • ID: {item._id}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => router.back()}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Top overview */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left: image + thumbs */}
          <div className="lg:col-span-1">
            <Section
              title="Media"
              subtitle={item.images?.length ? `${item.images.length} image(s)` : "No images"}
            >
              {heroImage ? (
                <img
                  src={heroImage}
                  alt="service"
                  className="w-full h-56 md:h-64 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-56 md:h-64 rounded-lg border bg-slate-50 flex items-center justify-center text-sm text-slate-500">
                  No image
                </div>
              )}

              {item.images?.length ? (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {item.images.slice(0, 8).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(src)}
                      className={`rounded-md border overflow-hidden hover:opacity-90 ${
                        heroImage === src ? "ring-2 ring-blue-300" : ""
                      }`}
                      title="Select image"
                    >
                      <img
                        src={src}
                        alt={`thumb-${i}`}
                        className="h-14 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </Section>
          </div>

          {/* Right: meta cards */}
          <div className="lg:col-span-2 space-y-4">
            <Section title="Overview" subtitle="Key information for review">
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Booking Type" value={item.bookingType || "—"} />
                <Field label="Quantity Unit" value={item.quantityUnit || "—"} />
                <Field
                  label="Cities"
                  value={item.cities?.length ? item.cities.join(", ") : "—"}
                />
                <Field
                  label="Created"
                  value={item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                />
                <Field
                  label="Updated"
                  value={item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}
                />
                <Field label="Slug" value={item.slug || "—"} />
              </div>
            </Section>

            <Section title="Description" subtitle="What the customer will see">
              {item.description ? (
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No description</div>
              )}
            </Section>
          </div>
        </div>

        {/* Variants */}
        <Section
          title="Variants"
          subtitle={item.variants?.length ? `${item.variants.length} variant(s)` : "No variants"}
          right={
            item.variants?.length ? (
              <Badge tone="blue">
                From{" "}
                {Math.min(
                  ...item.variants
                    .map((v) => (typeof v.absolutePrice === "number" ? v.absolutePrice : Infinity))
                    .filter((n) => Number.isFinite(n))
                )}{" "}
                AED
              </Badge>
            ) : null
          }
        >
          {!item.variants?.length ? (
            <div className="text-sm text-slate-500">No variants</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {item.variants.map((v, idx) => (
                <div key={v._id || idx} className="rounded-lg border p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-slate-900 truncate">
                          {v.name || "—"}
                        </div>
                        {typeof v.absolutePrice === "number" ? (
                          <Badge tone="emerald">{v.absolutePrice} AED</Badge>
                        ) : (
                          <Badge tone="slate">—</Badge>
                        )}
                        {typeof v.durationMin === "number" ? (
                          <Badge tone="slate">{v.durationMin} min</Badge>
                        ) : null}
                      </div>

                      {v.description ? (
                        <div className="text-sm text-slate-600 mt-1">
                          {v.description}
                        </div>
                      ) : null}

                      {v.tags?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {v.tags.slice(0, 6).map((t, i) => (
                            <Badge key={i} tone="slate">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-slate-500">No tags</div>
                      )}
                    </div>

                    {v.image ? (
                      <img
                        src={v.image}
                        alt="variant"
                        className="h-16 w-16 object-cover rounded-md border shrink-0"
                      />
                    ) : null}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-slate-600">
                    <div>
                      Compare:{" "}
                      {typeof v.compareAtPrice === "number" ? `${v.compareAtPrice} AED` : "—"}
                    </div>
                    <div>ID: {v._id || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Addons + Form Questions */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Section
            title="Addons"
            subtitle={item.addons?.length ? `${item.addons.length} addon(s)` : "No addons"}
          >
            {!item.addons?.length ? (
              <div className="text-sm text-slate-500">No addons</div>
            ) : (
              <div className="space-y-2">
                {item.addons.map((a, idx) => (
                  <div key={a.addonId || idx} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{a.name || "—"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Max Qty: {a.maxQty ?? "—"} • Addon ID: {a.addonId || "—"}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Badge tone="emerald">{typeof a.price === "number" ? `${a.price} AED` : "—"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Form Questions"
            subtitle={item.formQuestions?.length ? `${item.formQuestions.length} question(s)` : "No questions"}
          >
            {!item.formQuestions?.length ? (
              <div className="text-sm text-slate-500">No form questions</div>
            ) : (
              <div className="space-y-2">
                {item.formQuestions.map((q) => (
                  <div key={q.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{q.label}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          key: <span className="font-mono">{q.key}</span> • type: {q.type}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Badge tone={q.required ? "red" : "slate"}>
                          {q.required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                    </div>

                    {q.options?.length ? (
                      <div className="mt-2 text-xs text-slate-600">
                        Options: {q.options.map((o: any) => String(o)).join(", ")}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Footer spacing */}
        <div className="h-2" />
      </div>
    </div>
  );
}
