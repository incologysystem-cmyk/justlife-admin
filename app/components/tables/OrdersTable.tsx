"use client";
import DataTable from "./DataTable";
import { ColumnDef } from "@tanstack/react-table";
// import { StatusBadge } from "@/components/common/StatusBadge";
import { StatusBadge } from "../common/StatusBadge";
import { useEffect, useState } from "react";
// import { fetchOrders } from "@/lib/api";
import { fetchOrders } from "@/lib/api";


export type Order = { id: string; createdAt: string; customer: string; service: string; total: number; status: "pending" | "confirmed" | "assigned" | "completed" | "cancelled" };


export default function OrdersTable({ initialLimit = 20 }: { initialLimit?: number }) {
const [rows, setRows] = useState<Order[]>([]);
useEffect(() => { fetchOrders({ limit: initialLimit }).then(setRows); }, [initialLimit]);
const columns: ColumnDef<Order>[] = [
{ header: "Order #", accessorKey: "id" },
{ header: "Date", accessorKey: "createdAt", cell: ({ getValue }) => new Date(getValue() as string).toLocaleString() },
{ header: "Customer", accessorKey: "customer" },
{ header: "Service", accessorKey: "service" },
{ header: "Total", accessorKey: "total", cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}` },
{ header: "Status", accessorKey: "status", cell: ({ getValue }) => <StatusBadge status={getValue() as any} /> },
];
return <DataTable columns={columns} data={rows} />;
}