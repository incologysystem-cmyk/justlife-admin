"use client";

import React, { useEffect, useMemo, useState, ChangeEvent, FormEvent } from "react";
import type { Category } from "@/types/catalog";

/* ---------------- Types ---------------- */

export type AddonPayload = {
  title: string;
  description: string;
  summary: string;
  included: string[];
  excluded: string[];
  safetyNotice: string;
  learnMore: string;

  categoryId: string;
  price: number;

  imageBase64?: string;
  imagePreview?: string | null;
};

type AddAddonModalProps = {
  open: boolean;
  onClose: () => void;

  /**
   * ✅ Updated:
   * return true  => close + reset modal
   * return false => keep modal open (show error)
   */
  onSave: (data: AddonPayload) => Promise<boolean>;

  categories?: Category[];
  defaultCategoryId?: string;
};

type FormState = {
  imageFile: File | null;
  imagePreview: string | null;
  imageBase64?: string;

  title: string;
  description: string;
  summary: string;

  includedRaw: string;
  excludedRaw: string;
  safetyNotice: string;

  categoryId: string;
  price: string;
};

const initialFormState: FormState = {
  imageFile: null,
  imagePreview: null,
  imageBase64: undefined,

  title: "",
  description: "",
  summary:
    "Additional 15 minutes added to your booking. Perfect if you want a little extra time for detailed cleaning.",

  includedRaw: ["Cleaning of surfaces with a washcloth", "Washout & mopping of the floor"].join("\n"),
  excludedRaw: ["Exterior window / glass cleaning", "Moving of furniture"].join("\n"),

  safetyNotice: "If conditions are unsafe, this add-on may not be performed. Refund will be issued.",

  categoryId: "",
  price: "",
};

/* ---------------- Helpers ---------------- */

const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(String(s || ""));

function buildLearnMoreText(state: FormState) {
  const includedItems = state.includedRaw.split("\n").map((s) => s.trim()).filter(Boolean);
  const excludedItems = state.excludedRaw.split("\n").map((s) => s.trim()).filter(Boolean);

  return [
    state.summary?.trim(),
    includedItems.length ? `What’s included:\n${includedItems.map((i) => `• ${i}`).join("\n")}` : "",
    excludedItems.length ? `What’s excluded:\n${excludedItems.map((i) => `• ${i}`).join("\n")}` : "",
    state.safetyNotice?.trim() ? `Safety Notice:\n${state.safetyNotice.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

async function fetchProviderCategories(): Promise<Category[]> {
  const res = await fetch("/api/provider/categories?onlyActive=true", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));

  console.log("[provider/categories] raw response:", json);

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || json?.error || `Failed to fetch categories (HTTP ${res.status})`);
  }

  const list: any[] =
    (Array.isArray(json?.items) && json.items) ||
    (Array.isArray(json?.categories) && json.categories) ||
    (Array.isArray(json?.data) && json.data) ||
    (Array.isArray(json?.data?.categories) && json.data.categories) ||
    [];

  const normalized = list
    .map((c: any) => {
      const id = String(c?._id ?? c?.id ?? "");
      const name = String(c?.name ?? "");
      if (!id || !name) return null;

      return {
        ...(c as any),
        id,
        _id: id,
        name,
        slug: c?.slug,
      } as any;
    })
    .filter(Boolean);

  console.log("[provider/categories] normalized:", normalized);

  return normalized as Category[];
}

/* ================= Component ================= */

export default function AddAddonModal({
  open,
  onClose,
  onSave,
  categories,
  defaultCategoryId,
}: AddAddonModalProps) {
  // categories state
  const [cats, setCats] = useState<Category[]>(Array.isArray(categories) ? categories : []);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);

  // form state
  const [form, setForm] = useState<FormState>({
    ...initialFormState,
    categoryId: defaultCategoryId ?? "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const learnMorePreview = useMemo(() => buildLearnMoreText(form), [form]);

  // ✅ sync categories if parent passes (optional)
  useEffect(() => {
    if (Array.isArray(categories) && categories.length) {
      setCats(categories);
    }
  }, [categories]);

  // ✅ load categories when modal opens
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setSubmitError(null);
      setCatsError(null);

      setCatsLoading(true);
      try {
        const list = await fetchProviderCategories();
        setCats(list);
      } catch (e: any) {
        console.error("[AddAddonModal] categories load failed:", e);
        setCats([]);
        setCatsError(e?.message || "Failed to load categories");
      } finally {
        setCatsLoading(false);
      }
    };

    load();
  }, [open]);

  // ✅ set default selected category after categories load
  useEffect(() => {
    if (!open) return;

    setForm((prev) => {
      if (prev.categoryId && isObjectId(prev.categoryId)) return prev;

      if (defaultCategoryId && isObjectId(defaultCategoryId)) {
        return { ...prev, categoryId: defaultCategoryId };
      }

      const first = cats?.[0] as any;
      const firstId = String(first?._id ?? first?.id ?? "");
      return isObjectId(firstId) ? { ...prev, categoryId: firstId } : prev;
    });
  }, [open, defaultCategoryId, cats]);

  if (!open) return null;

  /* -------- Handlers -------- */

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: preview,
        imageBase64: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);

    if (!form.categoryId) return setSubmitError("Please select a category.");
    if (!isObjectId(form.categoryId)) return setSubmitError("Invalid category selected.");

    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return setSubmitError("Price must be a valid number.");

    const learnMore = buildLearnMoreText(form);
    if (!learnMore) return setSubmitError("Learn more is required. Please fill Summary/Included/Excluded/Safety Notice.");

    setIsSubmitting(true);

    try {
      const payload: AddonPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        summary: form.summary.trim(),

        included: form.includedRaw.split("\n").map((s) => s.trim()).filter(Boolean),
        excluded: form.excludedRaw.split("\n").map((s) => s.trim()).filter(Boolean),

        safetyNotice: form.safetyNotice.trim(),
        learnMore,

        categoryId: form.categoryId,
        price: priceNum,

        imageBase64: form.imageBase64,
        imagePreview: form.imagePreview,
      };

      // ✅ Let parent decide if success
      const ok = await onSave(payload);

      if (ok) {
        // reset then close
        setForm((prev) => ({ ...initialFormState, categoryId: prev.categoryId }));
        onClose();
      } else {
        // keep open, show message if parent didn't
        setSubmitError((prev) => prev || "Failed to create add-on.");
      }
    } catch (err: any) {
      console.error("[AddAddonModal] submit failed:", err);
      setSubmitError(err?.message || "Failed to create add-on.");
      // ❌ do NOT close
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSelectCategory = cats.length > 0 && !catsLoading;

  /* ================= UI ================= */

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-sm font-semibold">Add new add-on</h2>
          <button onClick={onClose} className="text-xl" type="button" disabled={isSubmitting}>
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-4 py-4">
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
            {(submitError || catsError) && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {submitError || catsError}
              </div>
            )}

            {/* CATEGORY */}
            <div>
              <label className="text-xs font-medium">Category</label>

              {catsLoading ? (
                <div className="mt-1 rounded border px-3 py-2 text-xs text-slate-600 bg-slate-50">
                  Loading categories...
                </div>
              ) : !canSelectCategory ? (
                <div className="mt-1 rounded border px-3 py-2 text-xs text-slate-600 bg-slate-50">
                  No categories available. Please create a category first.
                </div>
              ) : (
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="w-full mt-1 rounded border px-3 py-2 text-xs"
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {cats.map((c: any) => {
                    const id = String(c?._id ?? c?.id ?? "");
                    return (
                      <option key={id} value={id}>
                        {c?.name ?? "Untitled"}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* PRICE */}
            <div>
              <label className="text-xs font-medium">Price</label>
              <input
                name="price"
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={handleChange}
                className="w-full mt-1 rounded border px-3 py-2 text-xs"
                placeholder="e.g. 499"
                required
              />
            </div>

            {/* TITLE */}
            <div>
              <label className="text-xs font-medium">Add-on Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full mt-1 rounded border px-3 py-2 text-xs"
                required
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-xs font-medium">Short Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short description"
                className="w-full mt-1 rounded border px-3 py-2 text-xs min-h-[70px]"
              />
            </div>

            {/* IMAGE */}
            <div>
              <label className="text-xs font-medium">Add-on Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
              {form.imagePreview && (
                <img src={form.imagePreview} alt="preview" className="mt-2 h-16 w-16 object-cover rounded border" />
              )}
            </div>

            {/* INCLUDED / EXCLUDED / SAFETY */}
            <div>
              <label className="text-xs font-medium">What’s included (one per line)</label>
              <textarea
                name="includedRaw"
                value={form.includedRaw}
                onChange={handleChange}
                className="w-full mt-1 rounded border px-3 py-2 text-[11px] font-mono min-h-[90px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium">What’s excluded (one per line)</label>
              <textarea
                name="excludedRaw"
                value={form.excludedRaw}
                onChange={handleChange}
                className="w-full mt-1 rounded border px-3 py-2 text-[11px] font-mono min-h-[90px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Safety Notice</label>
              <textarea
                name="safetyNotice"
                value={form.safetyNotice}
                onChange={handleChange}
                className="w-full mt-1 rounded border px-3 py-2 text-xs min-h-[90px]"
              />
            </div>

            {/* PREVIEW */}
            <div className="rounded-xl border bg-slate-50 p-3 text-xs whitespace-pre-wrap">
              {learnMorePreview}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border px-3 py-2 text-xs rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSelectCategory}
              className="bg-slate-900 text-white px-4 py-2 text-xs rounded disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save add-on"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
