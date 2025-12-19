"use client";

import ServiceForm, {type ServicePayload} from "../forms/ServiceForm";
import type { Category } from "@/types/catalog";

export default function ServiceFormAdapter({
  categories,
  defaultCategoryId,
}: {
  categories: Category[];
  defaultCategoryId?: string;
}) {
  async function onSubmit(payload: ServicePayload) {
    // payload.categoryId abhi jo bhi aaya (slug / id), usko normalize karte hain
    const cat = categories.find(
      (c) =>
        c.slug === payload.categoryId ||
        c.name === payload.categoryId ||
        (c as any)._id === payload.categoryId ||
        (c as any).id === payload.categoryId
    );

    const body = {
      ...payload,
      // backend ko woh value bhej jo woh easily resolve kar sakta hai:
      categoryId: cat?.slug ?? cat?.name ?? payload.categoryId,
    };

    const r = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.message || "Failed to save service");
    }
  }

  return (
<ServiceForm
  categories={categories}
  defaultCategoryId={(categories[0] as any)?._id} 
  onSubmit={onSubmit}
/>

  );
}
