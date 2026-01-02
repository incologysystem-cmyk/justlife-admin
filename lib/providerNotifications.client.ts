"use client";

export type ProviderNotification = {
  _id: string;
  id?: string; // ✅ optional (in case backend sends `id`)
  audience?: "PROVIDER" | "USER" | "ADMIN";
  title?: string;
  body?: string;
  href?: string;
  createdAt?: string;
  readAt?: string | null;

  // optional extra fields
  message?: string;
  type?: string;
  data?: Record<string, any>;
};

export type ProviderNotifList = {
  items: ProviderNotification[];
  nextCursor?: string | null;
};

async function parseJsonSafe(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/** ✅ ensure we never call APIs with undefined/null ids */
function normalizeId(input: any): string {
  const v = String(input ?? "").trim();
  if (!v || v === "undefined" || v === "null") return "";
  return v;
}

/** ✅ normalize notification object so UI always has string _id */
function normalizeNotif(n: any): ProviderNotification {
  const _id = normalizeId(n?._id) || normalizeId(n?.id);
  return {
    ...n,
    _id, // ✅ force string
  };
}

export async function fetchProviderNotifications(opts?: {
  limit?: number;
  cursor?: string | null;
}): Promise<ProviderNotifList> {
  const limit = Math.min(Number(opts?.limit ?? 20), 50);
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (opts?.cursor) qs.set("cursor", String(opts.cursor));

  const res = await fetch(`/api/provider/notifications?${qs.toString()}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const j: any = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(j?.error || j?.message || "Failed to fetch notifications");
  }

  const rawItems = Array.isArray(j.items) ? j.items : [];
  const items = rawItems.map(normalizeNotif).filter((x) => !!x._id); // ✅ drop invalid items

  return {
    items,
    nextCursor: j.nextCursor ?? null,
  };
}

export async function markProviderNotificationRead(idLike: any) {
  const id = normalizeId(idLike);
  if (!id) {
    // ✅ prevent PATCH /undefined/read
    throw new Error("Invalid notification id");
  }

  const res = await fetch(`/api/provider/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    credentials: "include",
    cache: "no-store",
  });

  const j: any = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(j?.error || j?.message || "Failed to mark read");
  }

  return j;
}

export async function markAllProviderNotificationsRead() {
  const res = await fetch(`/api/provider/notifications/read-all`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  const j: any = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(j?.error || j?.message || "Failed to mark all read");
  }

  return j;
}
