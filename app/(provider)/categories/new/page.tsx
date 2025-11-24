import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import CategoryFormAdapter from "@/app/components/admin/CategoryFormAdapter";

export default function NewCategoryPage() {
  if (!requireAdmin()) redirect("provider/login?next=/admin/categories/new");
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">New Category</h1>
      <CategoryFormAdapter />
    </main>
  );
}
