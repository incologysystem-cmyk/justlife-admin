"use client";

import { useState } from "react";
import CategoryForm, { type CategoryPayload } from "../forms/CategoryForm";
import { toast } from "sonner";

export default function CategoryFormAdapter() {
  const [busy, setBusy] = useState(false);

  async function onSubmit(payload: CategoryPayload) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) {
        throw new Error(j?.message || `HTTP ${r.status}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return <CategoryForm onSubmit={onSubmit} />;
}
