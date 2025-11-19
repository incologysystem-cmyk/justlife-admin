// admin/components/admin/Table.tsx
import { ReactNode } from "react";

export function Table({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 border-b bg-slate-50">
      {children}
    </th>
  );
}

export function Td({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-2 border-b text-sm text-slate-700">{children}</td>
  );
}
