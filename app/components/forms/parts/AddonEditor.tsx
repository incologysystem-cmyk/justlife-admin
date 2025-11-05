// components/forms/parts/AddonEditor.tsx
"use client";
import { z } from "zod";
import { useState } from "react";
import { Plus, Trash } from "lucide-react";

export const AddonSchema = z.object({
  name: z.string().trim().min(1),
  price: z.coerce.number().min(0),
  maxQty: z.coerce.number().min(1).default(1),
});
export type AddonPayload = z.infer<typeof AddonSchema>;

export default function AddonEditor({
  value,
  onChange,
}: {
  value: AddonPayload[];
  onChange: (v: AddonPayload[]) => void;
}) {
  const [draft, setDraft] = useState<AddonPayload>({ name: "", price: 0, maxQty: 1 });

  function add() {
    const parsed = AddonSchema.safeParse(draft);
    if (!parsed.success) return;
    onChange([parsed.data, ...value]);
    setDraft({ name: "", price: 0, maxQty: 1 });
  }

  function remove(i: number) {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className="bg-card border border-border rounded-xl2 p-4 space-y-3">
      <div className="text-sm font-medium">Add-ons</div>
      <div className="grid md:grid-cols-3 gap-3">
        <input
          placeholder="Name (e.g., Stain Removal)"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Price"
          value={draft.price}
          onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex">
          <input
            type="number"
            min={1}
            placeholder="Max qty"
            value={draft.maxQty}
            onChange={(e) => setDraft((d) => ({ ...d, maxQty: Number(e.target.value) }))}
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
                <div className="text-white/60">AED {v.price.toFixed(2)} · Max qty {v.maxQty}</div>
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
