import EarningCard from "../components/charts/EarningCard";
import EarningsChart from "../components/charts/EarningsChart";
import OrdersTable from "../components/tables/OrdersTable";
import { fetchDashboard } from "@/lib/api";
import { fetchEarnings } from "../services/earnings.service";

function fmtMoney(amount: number, currency: string) {
  const n = Number(amount || 0);
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtDelta(pct: number) {
  const n = Number(pct || 0);
  const arrow = n > 0 ? "↑" : n < 0 ? "↓" : "→";
  return `${arrow} ${Math.abs(n).toFixed(1)}%`;
}

export default async function DashboardPage() {
  const [data, earnings] = await Promise.all([
    fetchDashboard(),
    fetchEarnings(30),
  ]);

  const currency = earnings.currency || "AED";

  return (
    <div className="space-y-6">
      {/* KPI / Earnings cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EarningCard
          label="Today’s Earnings"
          value={fmtMoney(earnings.today?.amount ?? 0, currency)}
          delta={fmtDelta(earnings.today?.deltaPctVsYesterday ?? 0)}
          sublabel="vs yesterday"
        />

        <EarningCard
          label="This Week"
          value={fmtMoney(earnings.thisWeek?.amount ?? 0, currency)}
          delta={fmtDelta(earnings.thisWeek?.deltaPctVsLastWeek ?? 0)}
          sublabel="vs last week"
        />

        <EarningCard
          label="This Month"
          value={fmtMoney(earnings.thisMonth?.amount ?? 0, currency)}
          delta={fmtDelta(earnings.thisMonth?.deltaPctVsLastMonth ?? 0)}
          sublabel="vs last month"
        />

        <EarningCard
          label="GMV (T12M)"
          value={fmtMoney(earnings.gmvT12M?.amount ?? 0, currency)}
          delta={fmtDelta(earnings.gmvT12M?.deltaPctYoY ?? 0)}
          sublabel="YoY"
        />
      </section>

      {/* ✅ Full width chart */}
      <section className="grid grid-cols-1 gap-4">
        <div className="w-full">
          <EarningsChart
            title="Earnings (last 30 days)"
            series={earnings.series}
          />

          {earnings.seriesRange ? (
            <div className="mt-2 text-[11px] opacity-60">
              Range: {earnings.seriesRange.start} → {earnings.seriesRange.end}
            </div>
          ) : null}
        </div>
      </section>

      {/* Recent orders */}
      <section className="bg-card rounded-xl2 shadow-soft border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Recent Orders</h3>
        </div>
        <OrdersTable initialLimit={5} />
      </section>
    </div>
  );
}
