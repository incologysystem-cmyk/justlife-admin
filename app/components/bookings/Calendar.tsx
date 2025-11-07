"use client";

import { addDays, endOfMonth, format, startOfMonth, isSameDay, parseISO } from "date-fns";

type Booking = { id: string; date: string; title: string; status: string };

export default function Calendar({ items }: { items: Booking[] }) {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  // Optional: log once to confirm items actually arrive
  // console.log("Calendar items:", items.length, items.slice(0, 3));

  return (
    <div className="grid grid-cols-7 gap-1 border border-neutral-300 rounded-2xl overflow-hidden">
      {days.map((d) => {
        const todays = items.filter((i) => {
          // safer parsing for ISO strings; falls back to Date if needed
          const when = /^\d{4}-\d{2}-\d{2}/.test(i.date) ? parseISO(i.date) : new Date(i.date);
          return isSameDay(when, d);
        });

        return (
          <div
            key={d.toISOString()}
            className="min-h-[120px] bg-white p-2 border-r border-b border-neutral-200"
          >
            <div className="text-xs text-black/60">{format(d, "MMM d")}</div>

            <div className="mt-2 space-y-1">
              {todays.map((t) => (
                <div
                  key={t.id}
                  className="text-[11px] px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-black"
                  title={t.status}
                >
                  {t.title}
                </div>
              ))}

              {/* Optional: show a faint dot if no bookings that day */}
              {/* {todays.length === 0 && <div className="text-[10px] text-black/30">—</div>} */}
            </div>
          </div>
        );
      })}
    </div>
  );
}
