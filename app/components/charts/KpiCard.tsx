export function KpiCard({ title, value, delta }: { title: string; value: string; delta?: string }) {
return (
<div className="bg-card rounded-xl2 border border-border p-4 shadow-soft">
<div className="text-xs text-white/60">{title}</div>
<div className="text-2xl font-semibold mt-1">{value}</div>
{delta && <div className="text-xs text-accent mt-1">{delta}</div>}
</div>
);
}