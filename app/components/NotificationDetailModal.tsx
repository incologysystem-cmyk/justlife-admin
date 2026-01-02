"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

export type Notif = {
  _id: string;
  title?: string;
  body?: string;
  message?: string;
  createdAt?: string;
  readAt?: string | null;
  href?: string;
  type?: string;
  data?: Record<string, any>;
};

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export default function NotificationDetailModal({
  open,
  notif,
  onClose,
  onOpenLink,
}: {
  open: boolean;
  notif: Notif | null;
  onClose: () => void;
  onOpenLink?: (href: string) => void;
}) {
  // ESC close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !notif) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close notification detail"
      />

      {/* Modal */}
      <div className="relative w-[520px] max-w-[92vw] rounded-2xl border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b">
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">
              {notif.title || "Notification"}
            </h3>
            <div className="text-xs opacity-70 mt-1">
              {formatDate(notif.createdAt)}
              {notif.type ? ` · ${notif.type}` : ""}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm leading-relaxed">
            {(notif.body || notif.message || "No details available.").trim()}
          </p>

          {notif.data && Object.keys(notif.data).length > 0 && (
            <div className="">
            
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg border hover:bg-card"
          >
            Close
          </button>

          {notif.href && (
            <button
              onClick={() => (onOpenLink ? onOpenLink(notif.href!) : (window.location.href = notif.href!))}
              className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white inline-flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Open
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
