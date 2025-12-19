import EarningCard from "../components/charts/EarningCard";
import EarningsChart from "../components/charts/EarningsChart";
import OrdersTable from "../components/tables/OrdersTable";
import { fetchDashboard, fetchEarnings } from "@/lib/api";

export default async function DashboardPage() {
  const data = await fetchDashboard();
  const earnings = await fetchEarnings();

  return (
    <div className="space-y-6">
      {/* KPI / Earnings cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EarningCard label="Today’s Earnings" value={`$${earnings.today.toFixed(2)}`} delta="↑ 5.1%" sublabel="vs yesterday" />
        <EarningCard label="This Week" value={`$${earnings.thisWeek.toLocaleString()}`} delta="↑ 8.2%" sublabel="vs last week" />
        <EarningCard label="This Month" value={`$${earnings.thisMonth.toLocaleString()}`} delta="↑ 6.3%" sublabel="vs last month" />
        <EarningCard label="GMV" value={`$${data.kpis.gmv.toLocaleString()}`} delta="↑ 6.3%" sublabel="YoY" />
      </section>

      {/* Earnings area chart + service mix */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EarningsChart title="Earnings (last 30 days)" series={earnings.series} />
        </div>
        <div className="bg-card rounded-xl2 shadow-soft border border-border p-4">
          <h3 className="text-sm font-medium mb-3">Service mix</h3>
          <ul className="space-y-2 text-sm text-white/80">
            {data.serviceMix.map((s) => (
              <li key={s.name} className="flex justify-between">
                <span>{s.name}</span>
                <span>{s.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recent orders */}
      <section className="bg-card rounded-xl2 shadow-soft border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Recent Orders</h3>
        </div>
        <OrdersTable initialLimit={5} />
      </section>
    </div>
  );
}
