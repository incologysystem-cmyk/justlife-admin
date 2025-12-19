// components/forms/parts/VariantEditor.tsx
"use client";

import { z } from "zod";
import { useState } from "react";
import { Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export const VariantSchema = z.object({
  name: z.string().trim().min(1),
  unitPrice: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  sku: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
});
export type VariantPayload = z.infer<typeof VariantSchema>;

export default function VariantEditor({
  value,
  onChange,
}: {
  value: VariantPayload[];
  onChange: (v: VariantPayload[]) => void;
}) {
  const [draft, setDraft] = useState<VariantPayload>({
    name: "",
    unitPrice: 0,
  });

  function add() {
    const parsed = VariantSchema.safeParse(draft);
    if (!parsed.success) return;
    onChange([parsed.data, ...value]);
    setDraft({
      name: "",
      unitPrice: 0,
      compareAtPrice: undefined,
      sku: undefined,
      description: undefined,
      image: undefined,
    });
  }

  function remove(i: number) {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setDraft((d) => ({ ...d, image: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-card border border-border rounded-xl2 p-4 space-y-4">
      <div className="text-sm font-semibold text-gray-900">Variants</div>
      <p className="text-[12px] text-gray-800 leading-tight">
        Create different options for this service (examples: Small, Medium, 3-Seater Sofa, King Mattress).
        Each variant can have its own price, description, and image.
      </p>

      {/* ---------- ROW 1 ---------- */}
      <div className="grid md:grid-cols-4 gap-4">

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-gray-900">Variant Name</label>
          <p className="text-[11px] text-gray-700">Shown to customers (ex: 3-Seater, King Size).</p>
          <input
            placeholder="3-Seater"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-gray-900">Price (AED)</label>
          <p className="text-[11px] text-gray-700">Price for this variant.</p>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Price"
            value={draft.unitPrice}
            onChange={(e) => setDraft((d) => ({ ...d, unitPrice: Number(e.target.value) }))}
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Compare At */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-gray-900">Compare-at Price</label>
          <p className="text-[11px] text-gray-700">Old price (optional).</p>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Old price"
            value={draft.compareAtPrice ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                compareAtPrice: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* SKU + Add */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-gray-900">SKU (Optional)</label>
          <p className="text-[11px] text-gray-700">Internal unique code.</p>
          <div className="flex">
            <input
              placeholder="SKU"
              value={draft.sku ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sku: e.target.value || undefined }))
              }
              className="flex-1 rounded-l border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={add}
              className="px-3 rounded-r border border-emerald-500/40 bg-emerald-500/20"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- ROW 2 ---------- */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-gray-900">Description</label>
          <p className="text-[11px] text-gray-700">Optional details about this variant.</p>
          <textarea
            placeholder="Short description"
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value || undefined }))
            }
            className="rounded border border-border bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
          />
        </div>

        {/* Image */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-gray-900">Variant Image</label>
          <p className="text-[11px] text-gray-700">Upload image for this variant.</p>

          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-900 file:mr-3 file:py-1.5 file:px-3 
                         file:rounded file:border-0 file:text-xs file:font-semibold
                         file:bg-emerald-500/20 file:text-emerald-700 
                         hover:file:bg-emerald-500/30 border border-border rounded"
            />

            {draft.image && (
              <div className="border border-border rounded overflow-hidden w-24 h-24">
                <img src={draft.image} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- LIST ---------- */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-semibold text-gray-900">Saved Variants</div>

          {value.map((v, i) => (
            <div
              key={i}
              className="flex items-start justify-between border-t border-border pt-2"
            >
              <div className="flex gap-3">
                {v.image && (
                  <div className="w-16 h-16 border border-border rounded overflow-hidden">
                    <img src={v.image} className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <div className="font-medium text-gray-900">{v.name}</div>
                  <div className="text-gray-700 text-sm">
                    AED {v.unitPrice.toFixed(2)}
                    {v.compareAtPrice && (
                      <> · Was AED {v.compareAtPrice.toFixed(2)}</>
                    )}
                  </div>
                  {v.description && (
                    <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {v.description}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                className="px-2 py-1 rounded border border-border hover:bg-gray-200/40"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
