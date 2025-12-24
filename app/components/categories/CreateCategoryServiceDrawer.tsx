"use client";

import { useMemo, useState } from "react";
import CategoryForm from "@/app/components/forms/CategoryForm";
import ServiceForm from "@/app/components/forms/ServiceForm";
import { createCategory, createService } from "@/lib/api";
import type { Category } from "@/types/catalog";
import { toast } from "sonner";

function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickId(input: any): string {
  const id = String(input?.id ?? input?._id ?? "").trim();
  return id;
}

// ✅ safe number extractor
function toNum(v: any, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ✅ derive base price without relying on payload.basePrice (which doesn't exist)
function deriveBasePrice(payload: any, svcRaw: any): number {
  // backend priority
  const fromBackend =
    svcRaw?.basePrice ??
    svcRaw?.absolutePrice ??
    svcRaw?.price ??
    svcRaw?.unitPrice ??
    svcRaw?.pricing?.basePrice;

  if (fromBackend != null) return toNum(fromBackend, 0);

  // payload fallback (ServiceForm payload commonly has absolutePrice or variants)
  const fromPayload =
    payload?.absolutePrice ??
    payload?.price ??
    payload?.unitPrice ??
    payload?.variants?.[0]?.unitPrice ??
    payload?.variants?.[0]?.absolutePrice;

  return toNum(fromPayload, 0);
}

async function uploadCategoryImage(categoryId: string, file: File) {
  const fd = new FormData();
  // ✅ key MUST be "image"
  fd.set("image", file);

  const res = await fetch(
    `/api/admin/categories/${encodeURIComponent(categoryId)}/image`,
    {
      method: "POST",
      body: fd,
      cache: "no-store",
    }
  );

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg =
      (isJSON ? (data as any)?.message : undefined) ||
      (typeof data === "string" ? data : "") ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export default function CreateCategoryServiceDrawer({
  categories,
  onCategoryCreated,
  onServiceCreated,
  onClose,
}: {
  categories: Category[];
  onCategoryCreated: (cat: Category) => void;
  onServiceCreated: (svc: {
    id: string;
    name: string;
    categoryId: string;
    basePrice: number;
  }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [newCat, setNewCat] = useState<Category | null>(null);

  const availableCats = useMemo(
    () => (newCat ? [newCat, ...(categories ?? [])] : categories ?? []),
    [categories, newCat]
  );

  const goService = () => setStep(2);

  return (
    <div className="w-auto mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`px-2 py-1 rounded border ${
            step === 1
              ? "bg-emerald-500/20 border-emerald-500/30"
              : "border-border"
          }`}
        >
          1. Category
        </div>
        <div className="text-white/40">→</div>
        <div
          className={`px-2 py-1 rounded border ${
            step === 2
              ? "bg-emerald-500/20 border-emerald-500/30"
              : "border-border"
          }`}
        >
          2. Service
        </div>
      </div>

      {step === 1 ? (
        <CategoryForm
          onSubmit={async (payload) => {
            const created: any = await createCategory(payload as any);

            // ✅ If you want to immediately add the new category in UI
            const id = pickId(created);
            const cat: Category = {
              id,
              _id: id as any,
              name: String(created?.name ?? payload?.name ?? ""),
              slug: String(created?.slug ?? slugify(created?.name ?? payload?.name ?? "")),
              ...(created as any),
            };

            setNewCat(cat);
            onCategoryCreated(cat);

            return created;
          }}
          onUploadImage={uploadCategoryImage}
          onNext={goService}
          createLabel="Create & Continue"
          skipLabel="Skip Category → Service"
        />
      ) : (
        <ServiceForm
          categories={availableCats}
          defaultCategoryId={newCat?.id}
          onCancel={onClose}
          onSubmit={async (payload: any) => {
            const categoryId = payload.categoryId || newCat?.id;

            if (!categoryId) {
              toast.error("Please select a category for this service.");
              throw new Error("Missing categoryId for service creation");
            }

            const normalized = { ...payload, categoryId };
            const svcRaw: any = await createService(normalized as any);

            const svcId = pickId(svcRaw);

            if (!svcId) {
              console.error("createService() returned without id/_id:", svcRaw);
              toast.error("Service created but id not returned from API.");
              throw new Error("Service created but id not returned from API");
            }

            const minimal = {
              id: svcId,
              name: String(svcRaw?.name ?? payload?.name ?? "Untitled"),
              categoryId: String(
                svcRaw?.categoryId ?? normalized.categoryId ?? ""
              ),
              // ✅ fixed: no normalized.basePrice usage
              basePrice: deriveBasePrice(payload, svcRaw),
            };

            onServiceCreated(minimal);
            onClose();
          }}
        />
      )}
    </div>
  );
}
