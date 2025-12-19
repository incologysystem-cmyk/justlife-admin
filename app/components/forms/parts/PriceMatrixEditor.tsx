// components/forms/parts/PriceMatrixEditor.tsx
"use client";
import { z } from "zod";
import { useState } from "react";
import { Plus, Trash } from "lucide-react";

export const MatrixRowSchema = z.object({
  minQty: z.coerce.number().min(1),
  maxQty: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
});
export type MatrixRow = z.infer<typeof MatrixRowSchema>;

export default function PriceMatrixEditor({
  value,
  onChange,
}: {
  value: MatrixRow[];
  onChange: (v: MatrixRow[]) => void;
}) {
  const [draft, setDraft] = useState<MatrixRow>({ minQty: 1, maxQty: 1, unitPrice: 0 });

  function add() {
    const parsed = MatrixRowSchema.safeParse(draft);
    if (!parsed.success) return;
    if (parsed.data.maxQty < parsed.data.minQty) return;
    onChange([...value, parsed.data].sort((a, b) => a.minQty - b.minQty));
    setDraft({ minQty: parsed.data.maxQty + 1, maxQty: parsed.data.maxQty + 1, unitPrice: 0 });
  }

  function remove(i: number) {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className="bg-card border border-border rounded-xl2 p-4 space-y-3">
      <div className="text-sm font-medium">Price matrix (optional)</div>
      <div className="grid md:grid-cols-4 gap-3">
        <input
          type="number"
          min={1}
          placeholder="Min qty"
          value={draft.minQty}
          onChange={(e) => setDraft((d) => ({ ...d, minQty: Number(e.target.value) }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={1}
          placeholder="Max qty"
          value={draft.maxQty}
          onChange={(e) => setDraft((d) => ({ ...d, maxQty: Number(e.target.value) }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Unit price"
          value={draft.unitPrice}
          onChange={(e) => setDraft((d) => ({ ...d, unitPrice: Number(e.target.value) }))}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <button type="button" onClick={add} className="px-3 rounded border border-emerald-500/30 bg-emerald-500/20">
          <Plus size={16} />
        </button>
      </div>

      {value.length > 0 && (
        <div className="text-xs text-white/70">
          {value.map((r, i) => (
            <div key={i} className="flex items-center justify-between border-t border-border py-2">
              <div>Qty {r.minQty}–{r.maxQty} · AED {r.unitPrice.toFixed(2)}</div>
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
