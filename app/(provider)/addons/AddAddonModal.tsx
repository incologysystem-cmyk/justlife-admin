"use client";

import React, { useMemo, useState, ChangeEvent, FormEvent } from "react";

export type AddonPayload = {
  title: string;
  description: string;
  summary: string;
  included: string[];
  excluded: string[];
  safetyNotice: string;
  learnMore: string;
  imageBase64?: string;
  imagePreview?: string | null;
};

type AddAddonModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddonPayload) => Promise<void> | void;
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
};

const initialFormState: FormState = {
  imageFile: null,
  imagePreview: null,
  imageBase64: undefined,
  title: "",
  description: "",
  summary:
    "Additional 15 minutes added to your booking. Perfect if you want a little extra time for detailed cleaning of your balcony or living space.",
  includedRaw: [
    "Cleaning of surfaces with a washcloth",
    "Washout & mopping of the floor",
    "Interior cleaning (reachable areas only)",
  ].join("\n"),
  excludedRaw: [
    "Exterior window / glass cleaning",
    "Moving of plants / furniture",
    "Deep stain removal",
  ].join("\n"),
  safetyNotice:
    "The safety and well-being of our professionals is very important to us. If weather conditions are harsh or unsafe, the balcony cleaning add-on may not be performed. In such cases, please contact us and we will issue a refund for this add-on.",
};

function buildLearnMoreText(state: FormState) {
  const includedItems = state.includedRaw
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const excludedItems = state.excludedRaw
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const includedBlock =
    includedItems.length > 0
      ? `What’s included:\n${includedItems.map((i) => `• ${i}`).join("\n")}`
      : "";

  const excludedBlock =
    excludedItems.length > 0
      ? `What’s excluded:\n${excludedItems.map((i) => `• ${i}`).join("\n")}`
      : "";

  const safetyBlock = state.safetyNotice
    ? `Safety Notice:\n${state.safetyNotice}`
    : "";

  return [state.summary, includedBlock, excludedBlock, safetyBlock]
    .filter(Boolean)
    .join("\n\n");
}

export default function AddAddonModal({
  open,
  onClose,
  onSave,
}: AddAddonModalProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const learnMorePreview = useMemo(() => buildLearnMoreText(form), [form]);

  if (!open) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setForm((prev) => ({
        ...prev,
        imageFile: null,
        imagePreview: null,
        imageBase64: undefined,
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: previewUrl,
        imageBase64: base64, // data:image/...;base64,...
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const included = form.includedRaw
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      const excluded = form.excludedRaw
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      const learnMore = buildLearnMoreText(form);

      const payload: AddonPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        summary: form.summary.trim(),
        included,
        excluded,
        safetyNotice: form.safetyNotice.trim(),
        learnMore,
        imageBase64: form.imageBase64,
        imagePreview: form.imagePreview,
      };

      await onSave(payload);

      // reset + close
      setForm(initialFormState);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Addon save karte waqt error aa gaya. Console check karo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setForm(initialFormState);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">
            Add new add-on
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal body (scrollable) */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image upload */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Add-on Image
              </label>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />

                {form.imagePreview && (
                  <div className="mt-2 md:mt-0">
                    <div className="text-[10px] text-slate-500 mb-1">
                      Preview:
                    </div>
                    <img
                      src={form.imagePreview}
                      alt="Addon preview"
                      className="h-16 w-16 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Recommended: square image, high quality (e.g. 800×800px). Ye
                image S3 bucket me upload ho jayegi.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-xs font-medium text-slate-700"
              >
                Add-on Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Extra 15 mins balcony cleaning"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                required
              />
              <p className="text-[10px] text-slate-400">
                Ye title cards / listing main show hoga.
              </p>
            </div>

            {/* Short description */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-xs font-medium text-slate-700"
              >
                Short Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short summary jo 1–2 lines main ho e.g. 'Add extra 15 mins for detailed balcony cleaning.'"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs min-h-[60px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
              <p className="text-[10px] text-slate-400">
                Ye list card pe show hoga. Zyada detail neeche &quot;Learn more&quot;
                sections main rakho.
              </p>
            </div>

            {/* Summary / small intro */}
            <div className="space-y-2">
              <label
                htmlFor="summary"
                className="block text-xs font-medium text-slate-700"
              >
                Learn More – Short Intro
              </label>
              <textarea
                id="summary"
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="1–2 lines: ye add-on kis liye useful hai?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs min-h-[50px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
              <p className="text-[10px] text-slate-400">
                Simple language main explain karo: ye add-on kya extra value
                deta hai.
              </p>
            </div>

            {/* What's included */}
            <div className="space-y-2">
              <label
                htmlFor="includedRaw"
                className="block text-xs font-medium text-slate-700"
              >
                What’s included (one per line)
              </label>
              <textarea
                id="includedRaw"
                name="includedRaw"
                value={form.includedRaw}
                onChange={handleChange}
                placeholder={`Cleaning of surfaces with a washcloth\nWashout & mopping of the floor\nInterior cleaning`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[11px] min-h-[80px] font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
              <p className="text-[10px] text-slate-400">
                Har line ek point hoga. Frontend pe ye bullet list ban jayega.
              </p>
            </div>

            {/* What's excluded */}
            <div className="space-y-2">
              <label
                htmlFor="excludedRaw"
                className="block text-xs font-medium text-slate-700"
              >
                What’s excluded (one per line)
              </label>
              <textarea
                id="excludedRaw"
                name="excludedRaw"
                value={form.excludedRaw}
                onChange={handleChange}
                placeholder={`Exterior window / glass cleaning\nMoving of plants / furniture`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[11px] min-h-[80px] font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
              <p className="text-[10px] text-slate-400">
                Jo cheezen service main nahi hain, unko clear likho. Har line
                ek item.
              </p>
            </div>

            {/* Safety notice */}
            <div className="space-y-2">
              <label
                htmlFor="safetyNotice"
                className="block text-xs font-medium text-slate-700"
              >
                Safety Notice / Important Info
              </label>
              <textarea
                id="safetyNotice"
                name="safetyNotice"
                value={form.safetyNotice}
                onChange={handleChange}
                placeholder="Refund policy, safety, special conditions simple language main likho."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
              <p className="text-[10px] text-slate-400">
                Weather issues, access issues, refund rules waghera yahan mention
                karo.
              </p>
            </div>

            {/* Modal footer buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save add-on"}
              </button>
            </div>
          </form>

          {/* Learn more preview inside modal */}
          <div className="border-t border-slate-200 pt-3">
            <h3 className="text-[11px] font-semibold text-slate-700 mb-1">
              Learn More – Live Preview
            </h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] whitespace-pre-wrap text-slate-800">
              {learnMorePreview}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
