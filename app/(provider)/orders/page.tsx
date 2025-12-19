import OrdersTable from "@/app/components/tables/OrdersTable";
export default function OrdersPage() {
return (
<div className="space-y-4">
<h2 className="text-lg font-semibold">Orders</h2>
<OrdersTable />
</div>
);
}