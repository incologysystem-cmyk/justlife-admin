// components/forms/parts/VariantEditor.tsx
"use client";
import { z } from "zod";
import { useState } from "react";
import { Plus, Trash } from "lucide-react";

export const VariantSchema = z.object({
  name: z.string().trim().min(1),
  unitPrice: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  sku: z.string().trim().optional(),
});
export type VariantPayload = z.infer<typeof VariantSchema>;

export default function VariantEditor({
  value,
  onChange,
}: {
  value: VariantPayload[];
  onChange: (v: VariantPayload[]) => void;
}) {
  const [draft, setDraft] = useState<VariantPayload>({ name: "", unitPrice: 0 });

  function add() {
    const parsed = VariantSchema.safeParse(draft);
    if (!parsed.success) return;
    onChange([parsed.data, ...value]);
    setDraft({ name: "", unitPrice: 0 });
  }

  function remove(i: number) {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className="bg-card border border-border rounded-xl2 p-4 space-y-3">
      <div className="text-sm font-medium">Variants</div>
      <div className="grid md:grid-cols-4 gap-3">
        <input
          placeholder="Name (e.g., 3-Seater)"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Price"
          value={draft.unitPrice}
          onChange={(e) => setDraft((d) => ({ ...d, unitPrice: Number(e.target.value) }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Compare at (optional)"
          value={draft.compareAtPrice ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, compareAtPrice: e.target.value ? Number(e.target.value) : undefined }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex">
          <input
            placeholder="SKU (optional)"
            value={draft.sku ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value || undefined }))}
            className="flex-1 rounded-l border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="button" onClick={add} className="px-3 rounded-r border border-emerald-500/30 bg-emerald-500/20">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {value.length > 0 && (
        <div className="text-xs text-white/70">
          {value.map((v, i) => (
            <div key={i} className="flex items-center justify-between border-t border-border py-2">
              <div>
                <div className="font-medium">{v.name}</div>
                <div className="text-white/60">
                  AED {v.unitPrice.toFixed(2)}{v.compareAtPrice ? ` · Was AED ${v.compareAtPrice.toFixed(2)}` : ""}{v.sku ? ` · ${v.sku}` : ""}
                </div>
              </div>
              <button type="button" onClick={() => remove(i)} className="px-2 py-1 rounded border border-border hover:bg-[#0d1018]">
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
