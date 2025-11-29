import type { Provider } from "@/lib/api";

/**
 * Pending providers – for requests page
 */
export async function fetchPendingProviders(): Promise<{
  providers: Provider[];
}> {
  const res = await fetch("/api/admin/providers/pending", {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to load provider requests");
  }

  const data = await res.json();
  return {
    providers: data.providers as Provider[],
  };
}

/**
 * ✅ All providers list with optional status filter
 *  - Next proxy: /api/provider/providerlist
 */
export async function fetchAllProviders(
  status?: "" | "pending" | "approved" | "rejected"
): Promise<{ providers: Provider[] }> {
  const query = status ? `?status=${status}` : "";

  const res = await fetch(`/api/provider/providerlist${query}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to load providers");
  }

  const data = await res.json();
  return {
    providers: data.providers as Provider[],
  };
}
