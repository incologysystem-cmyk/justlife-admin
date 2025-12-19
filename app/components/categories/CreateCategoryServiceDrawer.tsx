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


async function uploadCategoryImage(categoryId: string, file: File) {
  const fd = new FormData();
  // ✅ key MUST be "image"
  fd.set("image", file);

  const res = await fetch(`/api/admin/categories/${encodeURIComponent(categoryId)}/image`, {
    method: "POST",
    body: fd, // ✅ FormData
    cache: "no-store",
  });

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
    // create category (JSON)
    return await createCategory(payload as any); 
  }}
  onUploadImage={uploadCategoryImage} // ✅ THIS IS REQUIRED
  onNext={goService}
  createLabel="Create & Continue"
  skipLabel="Skip Category → Service"
/>


      ) : (
        <ServiceForm
          categories={availableCats}
          defaultCategoryId={newCat?.id}
          onCancel={onClose}
          onSubmit={async (payload) => {
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
              name: String(svcRaw?.name ?? payload.name ?? "Untitled"),
              categoryId: String(svcRaw?.categoryId ?? normalized.categoryId ?? ""),
              basePrice: Number(svcRaw?.basePrice ?? normalized.basePrice ?? 0),
            };

            onServiceCreated(minimal);
            onClose();
          }}
        />
      )}
    </div>
  );
}
