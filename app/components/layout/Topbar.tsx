"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import Portal from "../ui/Portal";
import NotificationDetailModal from "../NotificationDetailModal";

type Notif = {
  _id: string;
  title?: string;
  body?: string;
  message?: string;
  createdAt?: string;
  readAt?: string | null;
  href?: string;
};

type ProviderMeResponse = {
  success?: boolean;
  provider?: {
    _id?: string;
    nameOfSupplier?: string;
    legalName?: string;
    contactPersons?: Array<{
      firstName?: string;
      lastName?: string;
      email?: string;
      mobileNumber?: string;
    }>;
  };
  message?: string;
  error?: string;
};

function timeAgo(iso?: string) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function normalizeId(v: unknown) {
  const id = String(v ?? "").trim();
  if (!id || id === "undefined" || id === "null") return "";
  return id;
}

function normalizeNotif(n: unknown): Notif | null {
  if (!n || typeof n !== "object") return null;
  const obj = n as Record<string, unknown>;
  const _id = normalizeId(obj._id) || normalizeId(obj.id);
  if (!_id) return null;

  return {
    _id,
    title: typeof obj.title === "string" ? obj.title : undefined,
    body: typeof obj.body === "string" ? obj.body : undefined,
    message: typeof obj.message === "string" ? obj.message : undefined,
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined,
    readAt:
      obj.readAt === null
        ? null
        : typeof obj.readAt === "string"
        ? obj.readAt
        : undefined,
    href: typeof obj.href === "string" ? obj.href : undefined,
  };
}

function firstLetter(name?: string) {
  const v = String(name ?? "").trim();
  return v ? v[0]!.toUpperCase() : "P";
}

export function Topbar() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Notif | null>(null);

  // provider initials
  const [providerName, setProviderName] = useState<string>("");

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 420,
  });

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);
  const profileLetter = useMemo(() => firstLetter(providerName), [providerName]);

  // ✅ compute dropdown position under bell
  function computePos() {
    const el = btnRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const dropdownWidth = 420;
    const gap = 8;

    let left = r.right - dropdownWidth;
    const top = r.bottom + gap;

    left = Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8));
    setPos({ top, left, width: dropdownWidth });
  }

  // ✅ fetch provider name for profile badge
  async function fetchProviderName() {
    try {
      const r = await fetch("/api/provider/me", {
        credentials: "include",
        cache: "no-store",
      });
      const j = (await r.json().catch(() => ({}))) as ProviderMeResponse;

      if (!r.ok) return;

      const p = j?.provider;
      const name =
        p?.nameOfSupplier ||
        p?.legalName ||
        (() => {
          const c = p?.contactPersons?.[0];
          const full = `${c?.firstName || ""} ${c?.lastName || ""}`.trim();
          return full;
        })() ||
        "";

      setProviderName(String(name || "").trim());
    } catch {
      // silent
    }
  }

  // load provider name once (and whenever you want)
  useEffect(() => {
    fetchProviderName();
  }, []);

  // ✅ close on outside click (but NOT when modal open)
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (selected) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selected]);

  // ✅ close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  // ✅ reposition on open + resize/scroll
  useEffect(() => {
    if (!open) return;
    computePos();

    function onResize() {
      computePos();
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchNotifs() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const r = await fetch("/api/provider/notifications?limit=20", {
        credentials: "include",
        cache: "no-store",
        signal: ac.signal,
      });

      const j = (await r.json().catch(() => ({}))) as { items?: unknown[]; error?: string; message?: string };
      if (!r.ok) throw new Error(j?.error || j?.message || "Failed to load notifications");

      const raw = Array.isArray(j.items) ? j.items : [];
      setItems(raw.map(normalizeNotif).filter((x): x is Notif => Boolean(x)));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load notifications";
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ✅ fetch whenever open (fresh)
  useEffect(() => {
    if (!open) return;
    fetchNotifs();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function markAllRead() {
    setItems((p) => p.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    try {
      await fetch("/api/provider/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
  }

  async function markOneRead(idLike: unknown) {
    const id = normalizeId(idLike);
    if (!id) return;

    setItems((p) =>
      p.map((n) => (n._id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n))
    );

    try {
      await fetch(`/api/provider/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      // ignore
    }
  }

  function openNotif(n: Notif) {
    markOneRead(n._id);
    setSelected({ ...n, readAt: n.readAt || new Date().toISOString() });
    setOpen(false);
  }

  function onProfileClick() {
    setOpen(false);
    setSelected(null);
    router.push("/profile");
  }

  return (
    <>
      <header className="h-16 border-b bg-background/60 backdrop-blur flex items-center px-6 justify-between">
        <div className="text-sm text-white/60">Operations · GCC</div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={wrapRef}>
            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-card"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] bg-emerald-600 text-white rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* ✅ PORTAL DROPDOWN (always above charts/tooltips) */}
            {open && (
              <Portal>
                <div
                  className="fixed inset-0 z-[9998]"
                  onMouseDown={() => setOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="
                    fixed z-[9999]
                    w-[420px] max-w-[92vw]
                    rounded-xl border border-black/10 dark:border-white/10
                    shadow-2xl overflow-hidden
                    bg-white text-gray-900
                    dark:bg-zinc-950 dark:text-zinc-100
                  "
                  style={{ top: pos.top, left: pos.left }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center px-4 py-3 border-b border-black/5 dark:border-white/10">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button
                      type="button"
                      onClick={markAllRead}
                      disabled={unreadCount === 0}
                      className="text-xs hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check size={14} /> Mark all read
                    </button>
                  </div>

                  <div className="max-h-[380px] overflow-auto">
                    {loading ? (
                      <div className="p-4 flex gap-2 text-sm">
                        <Loader2 className="animate-spin" size={16} /> Loading...
                      </div>
                    ) : error ? (
                      <div className="p-4 text-sm text-red-500">{error}</div>
                    ) : items.length === 0 ? (
                      <div className="p-6 text-sm opacity-70">No notifications</div>
                    ) : (
                      <ul className="divide-y divide-black/5 dark:divide-white/10">
                        {items.map((n) => {
                          const isUnread = !n.readAt;
                          const shortBody = (n.body || n.message || "").trim();

                          return (
                            <li key={n._id} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => openNotif(n)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <div className="flex justify-between text-sm gap-3">
                                    <span className={isUnread ? "font-medium" : "opacity-70"}>
                                      {n.title || "Notification"}
                                    </span>
                                    <span className="text-xs opacity-60 shrink-0">
                                      {timeAgo(n.createdAt)}
                                    </span>
                                  </div>
                                  {!!shortBody && (
                                    <p className="text-xs opacity-70 mt-1 line-clamp-2">
                                      {shortBody}
                                    </p>
                                  )}
                                </button>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => markOneRead(n._id)}
                                    className="px-2 py-1 text-[11px] rounded-md border hover:bg-card disabled:opacity-50"
                                    disabled={!isUnread}
                                  >
                                    Read
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openNotif(n)}
                                    className="px-2 py-1 text-[11px] rounded-md bg-emerald-600 text-white hover:opacity-90"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-black/5 dark:border-white/10 text-[11px] opacity-70">
                    Tip: New jobs / approvals yahan show honge.
                  </div>
                </div>
              </Portal>
            )}
          </div>

          {/* ✅ Profile button shows provider first alphabet */}
          <button
            type="button"
            onClick={onProfileClick}
            className="w-8 h-8 rounded-full bg-card border hover:opacity-90 flex items-center justify-center"
            aria-label="Profile"
            title={providerName ? `Profile: ${providerName}` : "Profile"}
          >
            <span className="text-xs font-semibold opacity-80">{profileLetter}</span>
          </button>
        </div>
      </header>

      <NotificationDetailModal
        open={!!selected}
        notif={selected}
        onClose={() => setSelected(null)}
        onOpenLink={(href: string) => {
          setSelected(null);
          setOpen(false);
          window.location.href = href;
        }}
      />
    </>
  );
}
