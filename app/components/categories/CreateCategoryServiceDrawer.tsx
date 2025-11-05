"use client";

import { useMemo, useState } from "react";
import CategoryForm from "@/app/components/forms/CategoryForm";
import ServiceForm from "@/app/components/forms/ServiceForm";
import { createCategory, createService } from "@/lib/api";
import type { Category } from "@/types/catalog";

type CategoryLike = Partial<Category> & {
  id?: string;
  name?: string;
  icon?: string;
  sort?: number;
  active?: boolean;
  order?: number;
  title?: string;
  image?: string;
  slug?: string;
  tags?: string[];
};

function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

  return (
    <div className="w-auto mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`px-2 py-1 rounded border ${
            step === 1 ? "bg-emerald-500/20 border-emerald-500/30" : "border-border"
          }`}
        >
          1. Category
        </div>
        <div className="text-white/40">→</div>
        <div
          className={`px-2 py-1 rounded border ${
            step === 2 ? "bg-emerald-500/20 border-emerald-500/30" : "border-border"
          }`}
        >
          2. Service
        </div>
      </div>

      {step === 1 ? (
        <CategoryForm
          onSubmit={async (payload) => {
            const raw = (await createCategory(payload as any)) as CategoryLike;

            const name =
              String(
                raw.name ??
                  raw.title ??
                  (payload as any)?.name ??
                  "Untitled"
              ) || "Untitled";

            const safe: Category = {
              id: String(raw.id ?? crypto.randomUUID()),
              name,
              slug: String(raw.slug ?? slugify(name)),
              order:
                typeof raw.order === "number"
                  ? raw.order
                  : typeof raw.sort === "number"
                  ? raw.sort
                  : 0,
              image: raw.image ?? raw.icon ?? undefined,
              active: typeof raw.active === "boolean" ? raw.active : true,
              tags: Array.isArray(raw.tags) ? raw.tags : [],
            };

            setNewCat(safe);
            onCategoryCreated(safe);
            setStep(2);
          }}
        />
      ) : (
        <ServiceForm
          categories={availableCats}
          defaultCategoryId={newCat?.id}
          onCancel={onClose}
          onSubmit={async (payload) => {
            const normalized = {
              ...payload,
              categoryId: payload.categoryId || newCat?.id!,
            };

            const svcRaw: any = await createService(normalized as any);

            const minimal = {
              id: String(svcRaw?.id ?? svcRaw?._id ?? crypto.randomUUID()),
              name: String(svcRaw?.name ?? payload.name ?? "Untitled"),
              categoryId: String(
                svcRaw?.categoryId ??
                  normalized.categoryId ??
                  newCat?.id ??
                  ""
              ),
              basePrice: Number(
                svcRaw?.basePrice ?? normalized.basePrice ?? 0
              ),
            };

            onServiceCreated(minimal);
            onClose();
          }}
        />
      )}
    </div>
  );
}
