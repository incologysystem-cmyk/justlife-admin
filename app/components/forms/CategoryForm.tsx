// app/(admin)/components/forms/CategoryForm.tsx
"use client";

import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/** ================= Schema ================= */
const CategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  sort: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
  icon: z.string().optional(),
  slug: z.string().trim().min(2).optional(),
  tags: z.array(z.string()).default([]).optional(),
});
export type CategoryPayload = z.infer<typeof CategorySchema>;

/** Helpers */
function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode; }) {
  return (
    <div>
      <label className="text-xs text-gray-800">{label}</label>
      {children}
      {helper && <p className="mt-1 text-[11px] text-gray-800/70">{helper}</p>}
    </div>
  );
}
async function toDataURL(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/["']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function smartSplitTags(input: string): string[] {
  if (!input.trim()) return [];
  const out: string[] = [];
  let cur = ""; let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** ================= Component ================= */
export default function CategoryForm({ onSubmit }: { onSubmit: (payload: CategoryPayload) => Promise<void>; }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(true);
  const [iconData, setIconData] = useState<string | undefined>(undefined);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const canSubmit = useMemo(() => !loading, [loading]);

  function addTag(tok?: string) {
    const v = (tok ?? tagInput).trim();
    if (!v) return;
    setTags((prev) => Array.from(new Set([...prev, v])));
    setTagInput("");
  }
  function removeTag(i: number) {
    setTags((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const fd = new FormData(e.currentTarget);
    const raw: CategoryPayload = {
      name: String(fd.get("name") || ""),
      sort: Number(fd.get("sort") ?? 0),
      active,
      icon: iconData,
      tags: Array.from(new Set([...tags, ...smartSplitTags(String(fd.get("tags_csv") || ""))])),
      slug: (() => {
        const s = String(fd.get("slug") || "").trim();
        if (s) return s;
        const nm = String(fd.get("name") || "").trim();
        return nm ? slugify(nm) : undefined;
      })(),
    } as any;

    const parsed = CategorySchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid data");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(parsed.data);
      toast.success("Category created");

      // Reset
      formRef.current?.reset();
      setActive(true);
      setIconData(undefined);
      setTags([]);
      setTagInput("");
    } catch (err: any) {
      console.error("Create category failed:", err);
      toast.error(err?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="category-form"
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-6 space-y-4 w-full max-w-3xl mx-auto text-gray-800"
    >
      <div className="text-sm font-semibold text-gray-800">New Category</div>

      <Field label="Category name (shown to users)" helper="Add a short, clear category title customers recognize.">
        <input name="name" placeholder="e.g., Sofa Cleaning" className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-gray-800 placeholder:text-gray-800/50" />
      </Field>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Slug (SEO URL path, optional)" helper="Leave blank to auto-generate from name.">
          <input name="slug" placeholder="sofa-cleaning" className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-gray-800 placeholder:text-gray-800/50" />
        </Field>

        <Field label="Sort order" helper="Lower = higher priority.">
          <input name="sort" type="number" min={0} defaultValue={0} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-gray-800 placeholder:text-gray-800/50" />
        </Field>

        <div className="flex items-end gap-2">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active" className="text-xs text-gray-800">Active (visible to customers)</Label>
        </div>
        <p className="md:col-start-3 text-[11px] text-gray-800/70 -mt-2">Toggle to make this category visible to customers.</p>
      </div>

      <Field label="Tags" helper="Press Enter to add. You can also paste a comma list below.">
        <div className="rounded border border-border p-2">
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <span key={`${t}-${i}`} className="px-2 py-1 rounded bg-white/10 text-xs border border-border">
                {t}
                <button type="button" className="ml-1 text-gray-800" onClick={() => removeTag(i)}>×</button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="type & press Enter"
              className="flex-1 min-w-[160px] bg-transparent outline-none text-sm text-gray-800"
            />
          </div>
          <input
            name="tags_csv"
            placeholder='optional: comma list e.g. premium, "with, comma"'
            className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-gray-800 placeholder:text-gray-800/50"
          />
        </div>
      </Field>

      <Field label="Category thumbnail / icon (optional)" helper="Upload a small square icon; under 2MB recommended.">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return setIconData(undefined);
              if (file.size > 2 * 1024 * 1024) { toast.error("Icon must be under 2MB"); return; }
              try { setIconData(await toDataURL(file)); } catch { toast.error("Failed to read icon file"); }
            }}
            className="w-full text-xs text-gray-800"
          />
          {iconData && (
            <button type="button" className="text-xs px-2 py-1 rounded border border-border" onClick={() => setIconData(undefined)}>
              Remove
            </button>
          )}
        </div>
        {iconData && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconData} alt="icon preview" className="h-10 w-10 object-cover rounded border border-border" />
            <div className="text-[11px] text-gray-800/70 truncate">Icon attached</div>
          </div>
        )}
      </Field>

      <div className="space-y-2">
        <div className="text-[11px] text-gray-800/70">Review fields, then click <span className="text-gray-800">Create</span>.</div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm disabled:opacity-50 text-gray-800"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
