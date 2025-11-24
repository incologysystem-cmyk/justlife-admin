import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/serverFetch";
import ServiceFormAdapter from "@/app/components/admin/ServiceFormAdapter";
import type { Category } from "@/types/catalog";

function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function NewServicePage() {
  if (!requireAdmin()) redirect("provider/login?next=/admin/services/new");

  const res = await serverFetch<{ success?: boolean; data?: any[] }>(
    "/catalog/categories?active=false",
    { method: "GET" }
  ).catch(() => ({ data: [] }));

  const categories: Category[] = (res?.data ?? []).map((c: any): Category => ({
    id: String(c._id ?? c.id ?? ""),
    name: String(c.name ?? ""),
    slug: String(c.slug ?? slugify(String(c.name ?? ""))),
    order: Number.isFinite(Number(c.order))
      ? Number(c.order)
      : Number.isFinite(Number(c.sort))
      ? Number(c.sort)
      : 0,
    active: typeof c.active === "boolean" ? c.active : true,
  }));

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">New Service</h1>
      <ServiceFormAdapter categories={categories} />
    </main>
  );
}
