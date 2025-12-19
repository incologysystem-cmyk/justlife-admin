// admin/components/admin/StatsCards.tsx
"use client";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
};

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

type StatsGridProps = {
  pendingProviders: number;
  approvedProviders: number;
  activeJobs?: number;
  totalRevenue?: number;
  commission?: number;
};

export function StatsGrid({
  pendingProviders,
  approvedProviders,
  activeJobs,
  totalRevenue,
  commission,
}: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Pending Providers"
        value={pendingProviders}
        sub="Suppliers waiting for verification"
      />
      <StatCard
        label="Approved Providers"
        value={approvedProviders}
        sub="Verified suppliers on the platform"
      />
      <StatCard
        label="Active Jobs"
        value={activeJobs ?? "—"}
        sub="In-progress service requests"
      />
      <StatCard
        label="Total Revenue"
        value={
          totalRevenue !== undefined ? `AED ${totalRevenue.toFixed(2)}` : "—"
        }
        sub="All completed jobs"
      />
      <StatCard
        label="Platform Commission"
        value={
          commission !== undefined ? `AED ${commission.toFixed(2)}` : "—"
        }
        sub="Owner’s earnings from jobs"
      />
    </div>
  );
}
