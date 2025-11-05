// components/charts/EarningCard.tsx
export default function EarningCard({
  label,
  value,
  delta,
  sublabel,
}: {
  label: string;
  value: string;
  delta?: string; // e.g., "↑ 8.2%"
  sublabel?: string; // e.g., "vs last week"
}) {
  return (
    <div className="bg-card rounded-xl2 border border-border p-4 shadow-soft">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="flex gap-2 items-center mt-1">
        {delta && <span className="text-xs text-emerald-400">{delta}</span>}
        {sublabel && <span className="text-xs text-white/40">{sublabel}</span>}
      </div>
    </div>
  );
}
