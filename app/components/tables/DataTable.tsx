"use client";
import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";


export default function DataTable<T>({ columns, data }: { columns: ColumnDef<T, any>[]; data: T[] }) {
const [sorting, setSorting] = React.useState<SortingState>([]);
const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel() });


return (
<div className="space-y-2">
<div className="overflow-x-auto rounded-lg border border-border">
<table className="w-full text-sm">
<thead className="bg-[#0d1018]">
{table.getHeaderGroups().map(hg => (
<tr key={hg.id}>
{hg.headers.map(h => (
<th key={h.id} onClick={h.column.getToggleSortingHandler()} className="text-left px-3 py-2 cursor-pointer select-none">
{flexRender(h.column.columnDef.header, h.getContext())}
{{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? null}
</th>
))}
</tr>
))}
</thead>
<tbody>
{table.getRowModel().rows.map(r => (
<tr key={r.id} className="border-t border-border hover:bg-[#0d1018]">
{r.getVisibleCells().map(c => (
<td key={c.id} className="px-3 py-2">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
))}
</tr>
))}
</tbody>
</table>
</div>
<div className="flex items-center justify-between text-xs text-white/70">
<div>Rows: {table.getRowModel().rows.length}</div>
<div className="space-x-2">
<button className="px-2 py-1 rounded border border-border" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</button>
<button className="px-2 py-1 rounded border border-border" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
</div>
</div>
</div>
);
}