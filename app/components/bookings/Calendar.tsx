"use client";

import { addDays, endOfMonth, format, startOfMonth, isSameDay, parseISO } from "date-fns";

const isHex24 = (s: string) => /^[0-9a-fA-F]{24}$/.test(s);

type BookingInput = {
  _id?: string;                // prefer Mongo _id
  id?: string;                 // optional
  date?: string;               // optional normalized date
  startAt?: string;            // optional
  schedule?: { startAt?: string };
  title?: string;
  serviceName?: string;
  status?: string;
};

export default function Calendar({
  items,
  onSelect,
}: {
  items: BookingInput[];
  onSelect?: (id: string) => void;
}) {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const getWhen = (i: BookingInput) => {
    const iso = i.date ?? i.startAt ?? i.schedule?.startAt;
    if (!iso) return null;
    return /^\d{4}-\d{2}-\d{2}/.test(iso) ? parseISO(iso) : new Date(iso);
  };

  const getMongoId = (i: BookingInput) => {
    const raw = String(i._id ?? i.id ?? "").trim();
    return isHex24(raw) ? raw : "";
  };

  const getTitle = (i: BookingInput) => i.title ?? i.serviceName ?? "Booking";
  const getStatus = (i: BookingInput) => i.status ?? "pending";

  return (
    <div className="grid grid-cols-7 gap-1 border border-neutral-300 rounded-2xl overflow-hidden">
      {days.map((d) => {
        const todays = items.filter((i) => {
          const when = getWhen(i);
          return when ? isSameDay(when, d) : false;
        });

        return (
          <div
            key={d.toISOString()}
            className="min-h-[120px] bg-white p-2 border-r border-b border-neutral-200"
          >
            <div className="text-xs text-black/60">{format(d, "MMM d")}</div>

            <div className="mt-2 space-y-1">
              {todays.map((t, idx) => {
                const id = getMongoId(t);
                return (
                  <button
                    key={id || `${getTitle(t)}-${idx}`}
                    type="button"
                    onClick={() => id && onSelect?.(id)}
                    className="w-full text-left text-[11px] px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-black hover:bg-emerald-100 cursor-pointer disabled:opacity-50"
                    title={getStatus(t)}
                    disabled={!id}
                  >
                    {getTitle(t)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
