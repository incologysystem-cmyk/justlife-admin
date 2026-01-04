"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, ChevronDown, ChevronRight, ImageIcon, Loader2 } from "lucide-react";
import CreateCategoryServiceDrawer from "@/app/components/categories/CreateCategoryServiceDrawer";
import type { Category } from "@/types/catalog";
import {
  fetchCategoriesWithServices,
  type CategoryWithServices,
  type ServiceLite,
} from "@/lib/api";
import ServiceDetailsSheet from "@/app/components/services/ServiceDetailsSheet";

export default function CategoriesPage() {
  const [rows, setRows] = useState<CategoryWithServices[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ✅ loader + error
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // NEW: service details sheet state
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetchCategoriesWithServices();
      setRows(r);
    } catch (e: any) {
      console.error("Failed to load categories with services:", e);
      setLoadError(e?.message || "Failed to load.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories: Category[] = useMemo(() => rows.map((r) => r.category), [rows]);

  const grouped = useMemo(() => {
    const m = new Map<string, ServiceLite[]>();
    for (const r of rows) m.set(r.category.id, r.services);
    return m;
  }, [rows]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function handleCategoryCreated(cat: Category) {
    setRows((prev) => [{ category: cat, services: [] }, ...prev]);
  }

  function handleServiceCreated(svc: {
    id: string;
    name: string;
    categoryId: string;
    basePrice: number;
    image?: string;
  }) {
    setRows((prev) =>
      prev.map((r) =>
        r.category.id === svc.categoryId
          ? { ...r, services: [{ ...svc }, ...r.services] }
          : r
      )
    );
  }

  // NEW: open service details
  function openServiceDetails(id: string) {
    setServiceId(id);
    setServiceOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories & Services</h2>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm">
              <Plus size={16} /> Add Category & Service
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="h-dvh p-0 border-l border-border bg-card w-[min(100vw,1100px)] sm:max-w-none overflow-hidden"
          >
            <SheetHeader className="border-b border-border/60 px-6 py-4">
              <SheetTitle className="text-lg font-semibold">
                Create Category & Service
              </SheetTitle>
            </SheetHeader>

            <div className="h-[calc(100dvh-64px)] overflow-auto px-6 pb-6">
              <CreateCategoryServiceDrawer
                categories={categories}
                onCategoryCreated={handleCategoryCreated}
                onServiceCreated={handleServiceCreated}
                onClose={() => setOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ✅ Loading state */}
      {loading && (
       <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-3 text-sm text-black/70">
  <Loader2 className="h-4 w-4 animate-spin" />
  Loading categories & services...
</div>

      )}

      {/* ✅ Error state */}
      {!loading && loadError && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="text-sm text-red-400">
            Failed to load: {loadError}
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white/10 border border-border text-sm hover:bg-white/15"
          >
            Retry
          </button>
        </div>
      )}

      {/* Categories list */}
      {!loading && !loadError && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-6 text-sm text-white/60">No categories yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {rows
                .slice()
                .sort(
                  (a, b) =>
                    (a.category.order ?? 0) - (b.category.order ?? 0) ||
                    a.category.name.localeCompare(b.category.name)
                )
                .map(({ category: c }) => {
                  const items = grouped.get(c.id) ?? [];
                  const isOpen = expanded.has(c.id);
                  return (
                    <li key={c.id} className="p-0">
                      {/* Category header */}
                      <button
                        type="button"
                        onClick={() => toggle(c.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-background border border-border grid place-items-center text-xs">
                            {c.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-[11px] text-white/50">
                              Order {c.order ?? 0}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="bg-white/10 border-border"
                          >
                            {items.length} service{items.length !== 1 ? "s" : ""}
                          </Badge>
                          {isOpen ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </div>
                      </button>

                      {/* Services under category */}
                      {isOpen && (
                        <div className="px-4 pb-4">
                          {items.length === 0 ? (
                            <div className="text-xs text-white/60 border-t border-border/60 pt-3">
                              No services under this category.
                            </div>
                          ) : (
                            <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {items.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => openServiceDetails(s.id)}
                                  className="flex gap-3 items-center rounded border border-border/60 p-2 bg-background text-left hover:bg-white/5"
                                >
                                  <div className="w-14 h-14 rounded overflow-hidden border border-border/60 bg-black/20 grid place-items-center">
                                    {s.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={s.image}
                                        alt={s.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = "";
                                        }}
                                      />
                                    ) : (
                                      <ImageIcon size={18} className="opacity-60" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {s.name}
                                    </div>
                                    <div className="text-[11px] text-white/60">
                                      AED {Number(s.basePrice).toFixed(2)}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      )}

      {/* Service details sheet */}
      <ServiceDetailsSheet
        serviceIdOrSlug={serviceId}
        open={serviceOpen}
        onOpenChange={setServiceOpen}
      />
    </div>
  );
}
