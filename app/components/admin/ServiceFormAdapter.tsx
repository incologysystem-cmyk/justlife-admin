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
    const r = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.message || "Failed to save service");
    }
  }

  return (
    <ServiceForm
      categories={categories}
      defaultCategoryId={defaultCategoryId}
      onSubmit={onSubmit}
    />
  );
}
