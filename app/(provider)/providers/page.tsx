// import { fetchProviders } from "@/lib/api";
import { fetchProviders } from "@/lib/api";
// import { StatusBadge } from "@/components/common/StatusBadge";
import { StatusBadge } from "@/app/components/common/StatusBadge";


export default async function ProvidersPage() {
const providers = await fetchProviders();
return (
<div className="space-y-4">
<h2 className="text-lg font-semibold">Providers</h2>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
{providers.map(p => (
<div key={p.id} className="bg-card rounded-xl2 border border-border p-4">
<div className="flex items-center justify-between mb-2">
<div className="font-medium">{p.name}</div>
<StatusBadge status={p.status} />
</div>
<div className="text-xs text-white/60">{p.city} · {p.phone}</div>
<div className="mt-3 flex gap-2">
<button className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded">Approve</button>
<button className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded">Reject</button>
</div>
</div>
))}
</div>
</div>
);
}