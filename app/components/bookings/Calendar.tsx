"use client";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";


type Booking = { id: string; date: string; title: string; status: string };


export default function Calendar({ items }: { items: Booking[] }) {
const now = new Date();
const start = startOfMonth(now);
const end = endOfMonth(now);
const days: Date[] = [];
for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
return (
<div className="grid grid-cols-7 gap-1 border border-border rounded-xl2 overflow-hidden">
{days.map((d) => {
const todays = items.filter(i => new Date(i.date).toDateString() === d.toDateString());
return (
<div key={d.toISOString()} className="min-h-[120px] bg-card p-2 border-r border-b border-border">
<div className="text-xs text-white/60">{format(d, "MMM d")}</div>
<div className="mt-2 space-y-1">
{todays.map(t => (
<div key={t.id} className="text-[11px] px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20">{t.title}</div>
))}
</div>
</div>
);
})}
</div>
);
}