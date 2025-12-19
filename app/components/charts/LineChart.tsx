"use client";
import { ResponsiveContainer, LineChart, Line, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";


export function LineChartWidget({ title, series }: { title: string; series: { week: string; value: number }[] }) {
return (
<div className="bg-card rounded-xl2 border border-border p-4 shadow-soft">
<h3 className="text-sm font-medium mb-3">{title}</h3>
<div className="h-64">
<ResponsiveContainer width="100%" height="100%">
<LineChart data={series}>
<CartesianGrid strokeDasharray="3 3" stroke="#1f2230" />
<XAxis dataKey="week" stroke="#6b7280" />
<YAxis stroke="#6b7280" />
<Tooltip contentStyle={{ background: "#11131d", border: "1px solid #1f2230" }} />
<Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
</div>
);
}