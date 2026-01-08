"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";

type Service = {
  _id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | string;
  bookingType?: string;
  quantityUnit?: string;
  cities?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse = {
  items: Service[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");
  let j: any = {};
  try {
    j = text ? JSON.parse(text) : {};
  } catch {
    j = { raw: text };
  }

  if (!r.ok) {
    throw new Error(j?.message || j?.error || "Request failed");
  }

  return j as T;
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status || "").toLowerCase();

  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs border";

  if (s === "draft") {
    return (
      <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>
        draft
      </span>
    );
  }

  if (s === "published") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>
        published
      </span>
    );
  }

  return (
    <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>
      {status || "-"}
    </span>
  );
}

export default function ServiceRequestsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 20;

  // ✅ client search
  const [query, setQuery] = useState("");

  async function load(p = page) {
    try {
      setLoading(true);
      setErr(null);

      // ✅ draft by default (proxy)
      const res = await fetchJson<ApiResponse>(
        `/api/admin/servicesRequest?page=${p}&limit=${limit}`
      );

      setData(res);
    } catch (e: any) {
      setErr(e?.message || "Failed to load services");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ✅ safe filter (draft)
  const draftItems = useMemo(() => {
    const items = data?.items || [];
    return items.filter((s) => s.status === "draft");
  }, [data]);

  // ✅ search filter on top of draft
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return draftItems;

    return draftItems.filter((s) => {
      const hay = [
        s.name,
        s.slug,
        s.bookingType,
        s.quantityUnit,
        ...(s.cities || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [draftItems, query]);

  const totalPages = data?.pages ?? 1;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Service Requests</h1>
          <div className="text-sm text-slate-500">
            {loading ? "Loading..." : `Draft services: ${draftItems.length}`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug, city..."
            className="w-full md:w-80 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          />

          <button
            onClick={() => load(page)}
            disabled={loading}
            className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error */}
      {err ? (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm flex items-center justify-between gap-3">
          <div>{err}</div>
          <button
            onClick={() => load(page)}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b text-xs font-semibold text-slate-500">
          <div className="col-span-4">Service</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Booking</div>
          <div className="col-span-2">Cities</div>
          <div className="col-span-1">Updated</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading services…</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 space-y-2">
            <div className="font-medium text-slate-700">No results</div>
            <div>
              {query.trim()
                ? "Try a different search keyword."
                : "No draft services found."}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredItems.map((s) => (
              <div
                key={s._id}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center"
              >
                <div className="col-span-4">
                  <div className="font-medium text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">/{s.slug}</div>
                </div>

                <div className="col-span-2">
                  <StatusBadge status={s.status} />
                </div>

                <div className="col-span-2 text-sm text-slate-700">
                  {s.bookingType || "-"}
                </div>

                <div className="col-span-2 text-sm text-slate-700">
                  {s.cities?.length ? s.cities.join(", ") : "-"}
                </div>

                <div className="col-span-1 text-xs text-slate-600">
                  {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "-"}
                </div>

                <div className="col-span-1 flex justify-end">
                  <Link
                    href={
                      ((`/admin/services/requests/${s._id}` as unknown) as Route)
                    }
                    className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <button
          className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>

        <div className="text-sm text-slate-600">
          Page {page} / {totalPages}
        </div>

        <button
          className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
