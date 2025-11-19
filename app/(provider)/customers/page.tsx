// app/(admin)/customers/page.tsx
import { fetchCustomers } from "@/lib/api";
export default async function CustomersPage() {
const customers = await fetchCustomers();
return (
<div className="space-y-4">
<h2 className="text-lg font-semibold">Customers</h2>
<div className="bg-card border border-border rounded-xl2 p-4">
<ul className="space-y-2 text-sm">
{customers.map(c => <li key={c.id} className="flex justify-between"><span>{c.name}</span><span className="text-white/60">{c.phone}</span></li>)}
</ul>
</div>
</div>
);
}