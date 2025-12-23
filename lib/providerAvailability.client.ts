export type TimeRange = { start: string; end: string };

export type WeeklyDay = {
  dayOfWeek: number;
  enabled: boolean;
  windows: TimeRange[];
  breaks?: TimeRange[];
};

export type OverrideDay = {
  date: string; // YYYY-MM-DD
  enabled: boolean;
  windows: TimeRange[];
  breaks?: TimeRange[];
};

export type Availability = {
  timezone?: string;
  slotIntervalMin?: number;
  bufferMin?: number;
  minAdvanceMin?: number;
  maxDaysAhead?: number;
  weekly: WeeklyDay[];
  overrides?: OverrideDay[];
};

type ApiOk<T> = T & {
  ok?: boolean;
  success?: boolean;
  message?: string;
};

async function safeJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

/** ✅ GET (proxy): /api/provider/me/availability */
export async function getMyAvailability(): Promise<
  ApiOk<{ availability: Availability | null }>
> {
  const res = await fetch("/api/provider/availability", {
    method: "GET",
    cache: "no-store",
  });
  return safeJson(res);
}

/** ✅ POST (proxy): /api/provider/me/availability */
export async function saveMyAvailability(
  availability: Availability
): Promise<ApiOk<{ provider?: any; availability?: Availability }>> {
  const res = await fetch("/api/provider/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availability }),
  });
  return safeJson(res);
}
