import { cookies } from "next/headers";

export type EarningsSeriesPoint = { date: string; amount: number };

export type EarningsAnalytics = {
  currency: string;

  today: { amount: number; deltaPctVsYesterday: number };
  thisWeek: { amount: number; deltaPctVsLastWeek: number };
  thisMonth: { amount: number; deltaPctVsLastMonth: number };
  gmvT12M: { amount: number; deltaPctYoY: number };

  ranges?: unknown;

  // ✅ chart
  series: EarningsSeriesPoint[];
  seriesRange?: { start: string; end: string };
};

type ApiErrorShape = { message?: string; error?: string; details?: any; ok?: boolean };

function baseUrl() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return base || "";
}

async function getCookieHeader(): Promise<string> {
  // ✅ Next.js dynamic API (must await)
  const store = await cookies();

  // CookieStore has getAll()
  const all = store.getAll(); // [{name,value}, ...]
  if (!all.length) return "";

  return all.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function fetchJson<T>(url: string): Promise<T> {
  const cookieHeader = await getCookieHeader();

  const r = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  const j = (await r.json().catch(() => ({}))) as T & ApiErrorShape;

  if (!r.ok) {
    const msg = j?.message || j?.error || "Request failed";
    throw new Error(msg);
  }

  return j as T;
}

type EarningsSummaryResponse = {
  currency: string;
  today: { amount: number; deltaPctVsYesterday: number };
  thisWeek: { amount: number; deltaPctVsLastWeek: number };
  thisMonth: { amount: number; deltaPctVsLastMonth: number };
  gmvT12M: { amount: number; deltaPctYoY: number };
  ranges?: unknown;
};

type EarningsSeriesResponse = {
  currency: string;
  range?: { start: string; end: string };
  series: EarningsSeriesPoint[];
};

export async function fetchEarnings(days = 30): Promise<EarningsAnalytics> {
  const base = baseUrl();

  const summaryUrl = base ? `${base}/api/provider/earnings` : "/api/provider/earnings";
  const seriesUrl = base
    ? `${base}/api/provider/earnings/series?days=${encodeURIComponent(days)}`
    : `/api/provider/earnings/series?days=${encodeURIComponent(days)}`;

  const [summary, series] = await Promise.all([
    fetchJson<EarningsSummaryResponse>(summaryUrl),
    fetchJson<EarningsSeriesResponse>(seriesUrl),
  ]);

  const currency = summary.currency || series.currency || "AED";

  return {
    currency,
    today: summary.today,
    thisWeek: summary.thisWeek,
    thisMonth: summary.thisMonth,
    gmvT12M: summary.gmvT12M,
    ranges: summary.ranges,
    series: Array.isArray(series.series) ? series.series : [],
    seriesRange: series.range
      ? { start: String(series.range.start), end: String(series.range.end) }
      : undefined,
  };
}
