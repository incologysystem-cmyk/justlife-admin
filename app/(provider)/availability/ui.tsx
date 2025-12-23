"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Availability,
  WeeklyDay,
  OverrideDay,
  getMyAvailability,
  saveMyAvailability,
} from "@/lib/providerAvailability.client";

type TimeRange = { start: string; end: string };

const DOW_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function defaultWeekly(): WeeklyDay[] {
  return Array.from({ length: 7 }).map((_, i) => ({
    dayOfWeek: i,
    enabled: i >= 1 && i <= 5, // Mon-Fri
    windows: i >= 1 && i <= 5 ? [{ start: "10:00", end: "16:00" }] : [],
    breaks: i >= 1 && i <= 5 ? [{ start: "13:00", end: "14:00" }] : [],
  }));
}

function isHHMM(v: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

function toMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

function summarizeWeekly(weekly: WeeklyDay[]) {
  const enabledDays = weekly.filter((d) => d.enabled);
  if (!enabledDays.length) return "No weekly schedule set";

  const parts: string[] = [];
  for (const d of enabledDays) {
    const label = DOW_LABELS[d.dayOfWeek].slice(0, 3);
    const w0 = d.windows?.[0];
    if (w0?.start && w0?.end) parts.push(`${label}: ${w0.start}-${w0.end}`);
    else parts.push(`${label}: (no window)`);
  }
  return parts.join(" • ");
}

/* ---------------------------
   ✅ Helpers: clean windows/breaks
---------------------------- */
function normalizeRanges(ranges: TimeRange[] = []) {
  const cleaned = ranges
    .map((r) => ({ start: r.start?.trim?.() ?? "", end: r.end?.trim?.() ?? "" }))
    .filter((r) => isHHMM(r.start) && isHHMM(r.end) && toMin(r.end) > toMin(r.start));

  cleaned.sort((a, b) => toMin(a.start) - toMin(b.start));

  // merge overlaps
  const merged: TimeRange[] = [];
  for (const r of cleaned) {
    if (!merged.length) {
      merged.push(r);
      continue;
    }
    const last = merged[merged.length - 1];
    if (toMin(r.start) <= toMin(last.end)) {
      const end = toMin(r.end) > toMin(last.end) ? r.end : last.end;
      merged[merged.length - 1] = { ...last, end };
    } else merged.push(r);
  }
  return merged;
}

function overlaps(a: TimeRange, b: TimeRange) {
  return Math.max(toMin(a.start), toMin(b.start)) < Math.min(toMin(a.end), toMin(b.end));
}

function rangesOverlapList(ranges: TimeRange[]) {
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (overlaps(ranges[i], ranges[j])) return true;
    }
  }
  return false;
}

function subtractBreaksFromWindows(windows: TimeRange[], breaks: TimeRange[]) {
  const w = normalizeRanges(windows);
  const b = normalizeRanges(breaks);
  if (!b.length) return w;

  const out: TimeRange[] = [];

  for (const win of w) {
    let segments: TimeRange[] = [{ ...win }];

    for (const br of b) {
      const next: TimeRange[] = [];

      for (const s of segments) {
        if (!overlaps(s, br)) {
          next.push(s);
          continue;
        }

        // left cut
        if (toMin(br.start) > toMin(s.start)) {
          next.push({ start: s.start, end: br.start });
        }
        // right cut
        if (toMin(br.end) < toMin(s.end)) {
          next.push({ start: br.end, end: s.end });
        }
      }
      segments = next;
    }

    out.push(...segments.filter((x) => toMin(x.end) > toMin(x.start)));
  }

  return normalizeRanges(out);
}

/* ---------------------------
   ✅ Modal (scrollable)
---------------------------- */
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto mt-10 w-[95vw] max-w-4xl">
        <div className="rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-base font-semibold">{title}</div>
            <button onClick={onClose} className="rounded-xl border px-3 py-1.5 text-sm">
              Close
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   ✅ Page Client Wrapper (NO Refresh)
---------------------------- */
export default function AvailabilityPageClient({ openAddSignal }: { openAddSignal?: number }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function loadSummary() {
    setLoadingSummary(true);
    setErr(null);
    try {
      const data = await getMyAvailability();
      setAvailability(data?.availability ?? null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load availability");
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  // ✅ page button triggers create modal
  useEffect(() => {
    if (!openAddSignal) return;
    setMode("create");
    setOpen(true);
  }, [openAddSignal]);

  const openEdit = () => {
    setMode("edit");
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">Saved availability</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {loadingSummary
                ? "Loading…"
                : availability?.weekly?.length
                ? summarizeWeekly(availability.weekly)
                : "No availability saved yet."}
            </div>
            {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
          </div>

          {/* ✅ only edit button here */}
          <button
            type="button"
            onClick={openEdit}
            disabled={!availability}
            className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
          >
            Edit availability
          </button>
        </div>
      </div>

      <Modal
        open={open}
        title={mode === "edit" ? "Edit availability" : "Add availability"}
        onClose={() => setOpen(false)}
      >
        <AvailabilityManager
          mode={mode}
          onSaved={async () => {
            await loadSummary(); // ✅ update summary after save
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

/* ---------------------------
   ✅ Availability Manager (FULL)
---------------------------- */
function AvailabilityManager({
  onSaved,
  mode,
}: {
  onSaved: () => void;
  mode: "create" | "edit";
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [availability, setAvailability] = useState<Availability>(() => ({
    timezone: "Asia/Dubai",
    slotIntervalMin: 30,
    bufferMin: 15,
    minAdvanceMin: 180,
    maxDaysAhead: 14,
    weekly: defaultWeekly(),
    overrides: [],
  }));

  // Load availability based on mode
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
        if (mode === "edit") {
          const data = await getMyAvailability();
          const av = data?.availability;

          if (!cancelled && av) {
            setAvailability({
              timezone: av.timezone ?? "Asia/Dubai",
              slotIntervalMin: av.slotIntervalMin ?? 30,
              bufferMin: av.bufferMin ?? 0,
              minAdvanceMin: av.minAdvanceMin ?? 0,
              maxDaysAhead: av.maxDaysAhead ?? 14,
              weekly: Array.isArray(av.weekly) && av.weekly.length ? av.weekly : defaultWeekly(),
              overrides: Array.isArray(av.overrides) ? av.overrides : [],
            });
          } else if (!cancelled && !av) {
            // edit mode but nothing stored
            setAvailability((prev) => ({
              ...prev,
              weekly: prev.weekly?.length ? prev.weekly : defaultWeekly(),
              overrides: [],
            }));
          }
        } else {
          // create mode => reset defaults
          if (!cancelled) {
            setAvailability({
              timezone: "Asia/Dubai",
              slotIntervalMin: 30,
              bufferMin: 15,
              minAdvanceMin: 180,
              maxDaysAhead: 14,
              weekly: defaultWeekly(),
              overrides: [],
            });
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load availability");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const canSave = useMemo(() => {
    // weekly validation
    for (const d of availability.weekly) {
      if (d.enabled) {
        const w = d.windows || [];
        if (!w.length) return false;
      }
      for (const w of d.windows || []) {
        if (!isHHMM(w.start) || !isHHMM(w.end)) return false;
        if (toMin(w.end) <= toMin(w.start)) return false;
      }
      for (const b of d.breaks || []) {
        if (!isHHMM(b.start) || !isHHMM(b.end)) return false;
        if (toMin(b.end) <= toMin(b.start)) return false;
      }

      const normW = normalizeRanges(d.windows || []);
      const normB = normalizeRanges(d.breaks || []);
      if (rangesOverlapList(normW)) return false;
      if (rangesOverlapList(normB)) return false;
    }

    // overrides validation
    for (const o of availability.overrides || []) {
      if (!o.date) return false;
      if (o.enabled && (!(o.windows || []).length)) return false;

      const normW = normalizeRanges(o.windows || []);
      const normB = normalizeRanges(o.breaks || []);
      if (rangesOverlapList(normW)) return false;
      if (rangesOverlapList(normB)) return false;

      for (const w of o.windows || []) {
        if (!isHHMM(w.start) || !isHHMM(w.end)) return false;
        if (toMin(w.end) <= toMin(w.start)) return false;
      }
      for (const b of o.breaks || []) {
        if (!isHHMM(b.start) || !isHHMM(b.end)) return false;
        if (toMin(b.end) <= toMin(b.start)) return false;
      }
    }

    return true;
  }, [availability]);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const cleaned: Availability = {
        ...availability,
        weekly: availability.weekly.map((d) => ({
          ...d,
          windows: normalizeRanges(d.windows || []),
          breaks: normalizeRanges(d.breaks || []),
        })),
        overrides: (availability.overrides || []).map((o) => ({
          ...o,
          windows: normalizeRanges(o.windows || []),
          breaks: normalizeRanges(o.breaks || []),
        })),
      };

      await saveMyAvailability(cleaned);
      setSuccessMsg("Availability saved ✅");
      onSaved();
    } catch (e: any) {
      setError(e?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  }

  function updateWeekly(dayIndex: number, updater: (d: WeeklyDay) => WeeklyDay) {
    setAvailability((prev) => {
      const next = [...prev.weekly];
      next[dayIndex] = updater(next[dayIndex]);
      return { ...prev, weekly: next };
    });
  }

  function addWindow(dayIndex: number) {
    updateWeekly(dayIndex, (d) => ({
      ...d,
      windows: [...(d.windows || []), { start: "10:00", end: "11:00" }],
    }));
  }

  function addBreak(dayIndex: number) {
    updateWeekly(dayIndex, (d) => ({
      ...d,
      breaks: [...(d.breaks || []), { start: "13:00", end: "13:30" }],
    }));
  }

  function removeWindow(dayIndex: number, i: number) {
    updateWeekly(dayIndex, (d) => ({
      ...d,
      windows: (d.windows || []).filter((_, idx) => idx !== i),
    }));
  }

  function removeBreak(dayIndex: number, i: number) {
    updateWeekly(dayIndex, (d) => ({
      ...d,
      breaks: (d.breaks || []).filter((_, idx) => idx !== i),
    }));
  }

  function updateWindowField(dayIndex: number, i: number, field: "start" | "end", val: string) {
    updateWeekly(dayIndex, (d) => {
      const windows = [...(d.windows || [])];
      windows[i] = { ...windows[i], [field]: val };
      return { ...d, windows };
    });
  }

  function updateBreakField(dayIndex: number, i: number, field: "start" | "end", val: string) {
    updateWeekly(dayIndex, (d) => {
      const breaks = [...(d.breaks || [])];
      breaks[i] = { ...breaks[i], [field]: val };
      return { ...d, breaks };
    });
  }

  function toggleDay(dayIndex: number, enabled: boolean) {
    updateWeekly(dayIndex, (d) => ({
      ...d,
      enabled,
      windows: enabled && (!d.windows || d.windows.length === 0) ? [{ start: "10:00", end: "16:00" }] : d.windows,
      breaks: enabled ? d.breaks : [],
    }));
  }

  function addOverride() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${dd}`;

    setAvailability((prev) => ({
      ...prev,
      overrides: [
        ...(prev.overrides || []),
        { date, enabled: true, windows: [{ start: "10:00", end: "16:00" }], breaks: [] },
      ],
    }));
  }

  function removeOverride(i: number) {
    setAvailability((prev) => ({
      ...prev,
      overrides: (prev.overrides || []).filter((_, idx) => idx !== i),
    }));
  }

  function updateOverride(i: number, patch: Partial<OverrideDay>) {
    setAvailability((prev) => {
      const list = [...(prev.overrides || [])];
      list[i] = { ...list[i], ...patch };
      return { ...prev, overrides: list };
    });
  }

  function addOverrideWindow(i: number) {
    const o = (availability.overrides || [])[i];
    if (!o) return;
    updateOverride(i, { windows: [...(o.windows || []), { start: "10:00", end: "16:00" }] });
  }

  function addOverrideBreak(i: number) {
    const o = (availability.overrides || [])[i];
    if (!o) return;
    updateOverride(i, { breaks: [...(o.breaks || []), { start: "13:00", end: "13:30" }] });
  }

  if (loading) return <div className="text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Top settings */}
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Timezone</div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={availability.timezone || ""}
              onChange={(e) => setAvailability((p) => ({ ...p, timezone: e.target.value }))}
              placeholder="Asia/Dubai"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Slot interval (minutes)</div>
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={availability.slotIntervalMin ?? 30}
              onChange={(e) =>
                setAvailability((p) => ({ ...p, slotIntervalMin: Number(e.target.value) }))
              }
              min={5}
              max={240}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Buffer (minutes)</div>
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={availability.bufferMin ?? 0}
              onChange={(e) => setAvailability((p) => ({ ...p, bufferMin: Number(e.target.value) }))}
              min={0}
              max={240}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Min advance (minutes)</div>
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={availability.minAdvanceMin ?? 0}
              onChange={(e) =>
                setAvailability((p) => ({ ...p, minAdvanceMin: Number(e.target.value) }))
              }
              min={0}
              max={10080}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Max days ahead</div>
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={availability.maxDaysAhead ?? 14}
              onChange={(e) =>
                setAvailability((p) => ({ ...p, maxDaysAhead: Number(e.target.value) }))
              }
              min={1}
              max={365}
            />
          </label>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {successMsg && <div className="text-sm text-green-700">{successMsg}</div>}

        <button
          disabled={saving || !canSave}
          onClick={save}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save availability"}
        </button>

        {!canSave && (
          <div className="text-xs text-muted-foreground">
            Fix time inputs (HH:mm), ensure end is after start, and keep windows/breaks non-overlapping.
          </div>
        )}
      </div>

      {/* Weekly schedule */}
      <div className="rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Weekly schedule</h2>
        </div>

        <div className="space-y-4">
          {availability.weekly.map((day, idx) => (
            <div key={day.dayOfWeek} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">{DOW_LABELS[day.dayOfWeek]}</div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!day.enabled}
                      onChange={(e) => toggleDay(idx, e.target.checked)}
                    />
                    Enabled
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                    disabled={!day.enabled}
                    onClick={() => addWindow(idx)}
                  >
                    + Window
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                    disabled={!day.enabled}
                    onClick={() => addBreak(idx)}
                  >
                    + Break
                  </button>
                </div>
              </div>

              {/* windows */}
              <div className="mt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Windows</div>
                {!day.enabled ? (
                  <div className="text-sm text-muted-foreground">Disabled</div>
                ) : day.windows?.length ? (
                  <div className="space-y-2">
                    {day.windows.map((w, i) => (
                      <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={w.start}
                          onChange={(e) => updateWindowField(idx, i, "start", e.target.value)}
                          placeholder="10:00"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={w.end}
                          onChange={(e) => updateWindowField(idx, i, "end", e.target.value)}
                          placeholder="16:00"
                        />
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-2 text-sm"
                          onClick={() => removeWindow(idx, i)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No windows</div>
                )}
              </div>

              {/* breaks */}
              <div className="mt-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Breaks</div>
                {!day.enabled ? (
                  <div className="text-sm text-muted-foreground">Disabled</div>
                ) : day.breaks?.length ? (
                  <div className="space-y-2">
                    {day.breaks.map((b, i) => (
                      <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={b.start}
                          onChange={(e) => updateBreakField(idx, i, "start", e.target.value)}
                          placeholder="13:00"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={b.end}
                          onChange={(e) => updateBreakField(idx, i, "end", e.target.value)}
                          placeholder="14:00"
                        />
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-2 text-sm"
                          onClick={() => removeBreak(idx, i)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No breaks</div>
                )}
              </div>

              {/* preview */}
              {day.enabled && (
                <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">
                    Effective working windows (preview)
                  </div>
                  {subtractBreaksFromWindows(day.windows || [], day.breaks || []).length ? (
                    <div className="flex flex-wrap gap-2">
                      {subtractBreaksFromWindows(day.windows || [], day.breaks || []).map((r, i) => (
                        <span key={i} className="rounded-full border bg-white px-2 py-1">
                          {r.start} - {r.end}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div>No effective windows (breaks cover all time)</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overrides */}
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Date overrides</h2>
          <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={addOverride}>
            + Add override
          </button>
        </div>

        {!availability.overrides?.length ? (
          <div className="text-sm text-muted-foreground">No overrides</div>
        ) : (
          <div className="space-y-3">
            {availability.overrides.map((o, i) => (
              <div key={`${o.date}-${i}`} className="rounded-2xl border p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      className="rounded-xl border px-3 py-2 text-sm"
                      value={o.date}
                      onChange={(e) => updateOverride(i, { date: e.target.value })}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!o.enabled}
                        onChange={(e) => updateOverride(i, { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl border px-3 py-2 text-sm"
                      onClick={() => addOverrideWindow(i)}
                    >
                      + Window
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border px-3 py-2 text-sm"
                      onClick={() => addOverrideBreak(i)}
                    >
                      + Break
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border px-3 py-2 text-sm"
                      onClick={() => removeOverride(i)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* override windows */}
                <div className="text-xs font-medium text-muted-foreground">Windows</div>
                <div className="space-y-2">
                  {(o.windows || []).length ? (
                    (o.windows || []).map((w, wi) => (
                      <div key={wi} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={w.start}
                          onChange={(e) => {
                            const windows = [...(o.windows || [])];
                            windows[wi] = { ...windows[wi], start: e.target.value };
                            updateOverride(i, { windows });
                          }}
                          placeholder="10:00"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={w.end}
                          onChange={(e) => {
                            const windows = [...(o.windows || [])];
                            windows[wi] = { ...windows[wi], end: e.target.value };
                            updateOverride(i, { windows });
                          }}
                          placeholder="16:00"
                        />
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-2 text-sm"
                          onClick={() => {
                            const windows = (o.windows || []).filter((_, idx) => idx !== wi);
                            updateOverride(i, { windows });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No windows</div>
                  )}
                </div>

                {/* override breaks */}
                <div className="mt-4 text-xs font-medium text-muted-foreground">Breaks</div>
                <div className="space-y-2">
                  {(o.breaks || []).length ? (
                    (o.breaks || []).map((b, bi) => (
                      <div key={bi} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={b.start}
                          onChange={(e) => {
                            const breaks = [...(o.breaks || [])];
                            breaks[bi] = { ...breaks[bi], start: e.target.value };
                            updateOverride(i, { breaks });
                          }}
                          placeholder="13:00"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          className="rounded-xl border px-3 py-2 text-sm"
                          value={b.end}
                          onChange={(e) => {
                            const breaks = [...(o.breaks || [])];
                            breaks[bi] = { ...breaks[bi], end: e.target.value };
                            updateOverride(i, { breaks });
                          }}
                          placeholder="13:30"
                        />
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-2 text-sm"
                          onClick={() => {
                            const breaks = (o.breaks || []).filter((_, idx) => idx !== bi);
                            updateOverride(i, { breaks });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No breaks</div>
                  )}
                </div>

                {/* preview */}
                {o.enabled && (
                  <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground mb-1">Effective windows (preview)</div>
                    {subtractBreaksFromWindows(o.windows || [], o.breaks || []).length ? (
                      <div className="flex flex-wrap gap-2">
                        {subtractBreaksFromWindows(o.windows || [], o.breaks || []).map((r, ri) => (
                          <span key={ri} className="rounded-full border bg-white px-2 py-1">
                            {r.start} - {r.end}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div>No effective windows</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
