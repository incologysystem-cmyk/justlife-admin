// src/app/components/tables/DataTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

type BaseRow = Record<string, any> & { _id?: string; id?: string };

export default function DataTable<T extends BaseRow>({
  columns,
  data,
  viewBasePath, // ✅ NEW
}: {
  columns: ColumnDef<T, any>[];
  data: T[];
  viewBasePath?: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [query, setQuery] = React.useState("");
  const pathname = usePathname();

  // 🔍 Client-side Search Filter
  const filteredData = React.useMemo(() => {
    if (!query.trim()) return data;

    const q = query.toLowerCase();

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value || "").toLowerCase().includes(q)
      )
    );
  }, [query, data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ✅ Helper to decide "View" URL
  const getRowViewHref = (rowData: any): string | null => {
    const id: string | undefined = rowData._id || rowData.id || undefined;
    if (!id) return null;

    // 1) Explicit viewBasePath from parent (recommended)
    if (viewBasePath) {
      return `${viewBasePath}/${id}`;
    }

    // 2) Fallback heuristics (old behaviour)
    if (pathname.startsWith("/promocodes")) {
      return `/promocodes/${id}`;
    }

    // Default: treat as bookings table
    return `/bookings/${id}`;
  };

  return (
    <div className="space-y-3">
      {/* 🔍 Search Bar */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by ID, Customer, Phone, Email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm 
                     focus:outline-none focus:ring focus:ring-blue-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <span className="text-[10px] text-slate-400">
                        {({
                          asc: "↑",
                          desc: "↓",
                        } as Record<string, string>)[
                          h.column.getIsSorted() as string
                        ] ?? null}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Extra column header for Action */}
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((r) => {
              const rowData = r.original as any;
              const href = getRowViewHref(rowData);

              return (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="px-3 py-2 text-xs text-slate-700">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}

                  {/* View Button */}
                  <td className="px-3 py-2 text-xs">
                    {href ? (
                      <Link
                        href={href}
                        className="px-3 py-1 rounded border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 transition"
                      >
                        View
                      </Link>
                    ) : (
                      <button
                        className="px-3 py-1 rounded border border-slate-100 text-slate-300 text-xs cursor-not-allowed"
                        disabled
                      >
                        No ID
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={table.getAllColumns().length + 1}
                  className="px-3 py-6 text-center text-xs text-slate-400"
                >
                  No data to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          Rows:{" "}
          <span className="font-medium text-slate-700">
            {table.getRowModel().rows.length}
          </span>
        </div>
        <div className="space-x-2">
          <button
            className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <button
            className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
