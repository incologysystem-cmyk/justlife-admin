"use client";

import {
  useRef,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  sort: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
  slug: z.string().trim().min(2).optional(),
  tags: z.array(z.string()).default([]).optional(),
});

export type CategoryPayload = z.infer<typeof CategorySchema>;

type Props = {
  // create category returns backend response OR normalized doc
  onSubmit: (payload: CategoryPayload) => Promise<any>;

  // upload image call
  onUploadImage?: (categoryId: string, file: File) => Promise<any>;

  onNext?: () => void;
  nextHref?: Route;
  createLabel?: string;
  skipLabel?: string;
};

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-gray-800">{label}</label>
      {children}
      {helper && <p className="mt-1 text-[11px] text-gray-800/70">{helper}</p>}
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function smartSplitTags(input: string): string[] {
  if (!input.trim()) return [];
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }

  if (cur.trim()) out.push(cur.trim());
  return out;
}

// ✅ IMPORTANT: avoid "undefined" string and handle multiple shapes safely
function pickCategoryId(created: any): string {
  const candidates = [
    created?.id,
    created?._id,

    // common API shapes
    created?.data?.id,
    created?.data?._id,

    created?.data?.category?.id,
    created?.data?.category?._id,

    created?.category?.id,
    created?.category?._id,

    created?.item?.id,
    created?.item?._id,
  ];

  for (const v of candidates) {
    if (typeof v === "string" && v.trim() && v.trim() !== "undefined") return v.trim();
  }
  return "";
}

export default function CategoryForm({
  onSubmit,
  onUploadImage,
  onNext,
  nextHref,
  createLabel = "Create",
  skipLabel = "Skip",
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(true);

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const canSubmit = useMemo(() => !loading, [loading]);

  const goNext = useCallback(() => {
    if (onNext) return onNext();
    if (nextHref) return router.push(nextHref);
    toast.error("Missing onNext/nextHref");
  }, [onNext, nextHref, router]);

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

    const raw = {
      name: String(fd.get("name") || ""),
      sort: Number(fd.get("sort") ?? 0),
      active,
      tags: Array.from(
        new Set([...tags, ...smartSplitTags(String(fd.get("tags_csv") || ""))])
      ),
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

      console.log("🟦 [UI] CategoryForm payload:", parsed.data);

      // ✅ Step 1: create category (JSON)
      const created = await onSubmit(parsed.data);

      console.log("🟩 [UI] create category raw return:", created);

      const categoryId = pickCategoryId(created);
      console.log("🟩 [UI] picked categoryId:", categoryId);

      if (!categoryId) {
        toast.error("Category created but id not returned from API.");
        throw new Error("Category created but id not returned from API");
      }

      // ✅ Step 2: upload image if exists
      if (iconFile) {
        if (!onUploadImage) {
          toast.warning("Category created, but image upload handler missing.");
          console.warn("🟨 [UI] iconFile selected but onUploadImage not provided.");
        } else {
          console.log("🟦 [UI] uploading category image…", { categoryId, file: iconFile?.name });
          await onUploadImage(categoryId, iconFile);
          console.log("🟩 [UI] image upload done ✅");
        }
      }

      toast.success("Category created");

      formRef.current?.reset();
      setActive(true);
      setTags([]);
      setTagInput("");

      if (iconPreview) URL.revokeObjectURL(iconPreview);
      setIconFile(null);
      setIconPreview(null);

      goNext();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    if (loading) return;
    toast.info("Skipped category creation");
    goNext();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-6 space-y-4 w-full max-w-3xl mx-auto text-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">New Category</div>
        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className="text-xs px-2 py-1 rounded border border-border hover:bg-white/40 disabled:opacity-50"
        >
          {skipLabel}
        </button>
      </div>

      <Field label="Category name">
        <input
          name="name"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Slug (optional)">
          <input
            name="slug"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Sort order">
          <input
            name="sort"
            type="number"
            min={0}
            defaultValue={0}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <div className="flex items-end gap-2">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active" className="text-xs text-gray-800">
            Active
          </Label>
        </div>
      </div>

      <Field label="Tags">
        <div className="rounded border border-border p-2">
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <span key={`${t}-${i}`} className="px-2 py-1 rounded text-xs border">
                {t}
                <button type="button" className="ml-1" onClick={() => removeTag(i)}>
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="type & press Enter"
              className="flex-1 min-w-[160px] bg-transparent outline-none text-sm"
            />
          </div>

          <input
            name="tags_csv"
            placeholder="optional comma list"
            className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
          />
        </div>
      </Field>

      <Field label="Category image (optional)">
        <input
          type="file"
          accept="image/*"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;

            if (iconPreview) URL.revokeObjectURL(iconPreview);

            if (!file) {
              setIconFile(null);
              setIconPreview(null);
              return;
            }

            if (file.size > 2 * 1024 * 1024) {
              toast.error("Image must be under 2MB");
              return;
            }

            setIconFile(file);
            setIconPreview(URL.createObjectURL(file));
          }}
          className="w-full text-xs"
        />

        {iconPreview && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={iconPreview}
              className="h-10 w-10 rounded object-cover border"
              alt="preview"
            />
            <button
              type="button"
              className="text-xs px-2 py-1 rounded border"
              onClick={() => {
                if (iconPreview) URL.revokeObjectURL(iconPreview);
                setIconFile(null);
                setIconPreview(null);
              }}
            >
              Remove
            </button>
          </div>
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className="w-full px-3 py-2 rounded border"
        >
          {skipLabel}
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full px-3 py-2 rounded border"
        >
          {loading ? "Creating..." : createLabel}
        </button>
      </div>
    </form>
  );
}
