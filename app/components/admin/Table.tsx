// admin/components/admin/Table.tsx
import * as React from "react";

/* ---------------- Table wrapper ---------------- */

export function Table({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`overflow-x-auto rounded-2xl border bg-white shadow-sm ${className}`}
      {...props}
    >
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

/* ---------------- Table head cell ---------------- */

export function Th({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 border-b bg-slate-50 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

/* ---------------- Table data cell ---------------- */

export function Td({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`px-4 py-2 border-b text-sm text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
