// components/charts/EarningsChart.tsx
"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export type EarningsPoint = { date: string; amount: number };

export default function EarningsChart({
  title = "Earnings (last 30 days)",
  series,
}: {
  title?: string;
  series: EarningsPoint[];
}) {
  return (
    <div
      className="
        bg-card rounded-xl2 border border-border p-4 shadow-soft
        relative overflow-hidden
        isolation-isolate
        z-0
      "
    >
      <h3 className="text-sm font-medium mb-3 relative z-10">{title}</h3>

      <div className="h-64 relative z-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <defs>
              <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1f2230" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />

            {/* ✅ tooltip z-index low + pointer-events none so it won't "cover" dropdown */}
            <Tooltip
              wrapperStyle={{
                zIndex: 1,
                pointerEvents: "none",
              }}
              contentStyle={{
                background: "#11131d",
                border: "1px solid #1f2230",
              }}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#34d399"
              fill="url(#earnFill)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
