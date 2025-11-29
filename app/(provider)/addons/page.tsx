"use client";

import React, { useEffect, useState } from "react";
import AddAddonModal, { AddonPayload } from "./AddAddonModal";
import {
  fetchAddons,
  createAddon,
  deleteAddon,
  AddonDto,
} from "@/app/services/addonsApi";
import { Trash2 } from "lucide-react";

type SavedAddon = AddonDto & {
  imagePreview?: string | null; // frontend-only
};

export default function AddonsPage() {
  const [savedAddons, setSavedAddons] = useState<SavedAddon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // delete confirm state
  const [addonToDelete, setAddonToDelete] = useState<SavedAddon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // initial load
  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchAddons(false); // admin/provider panel, show all
        const mapped: SavedAddon[] = items.map((a) => ({
          ...a,
          imagePreview: a.imageUrl ?? null,
        }));
        setSavedAddons(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSaveAddon = async (data: AddonPayload) => {
    try {
      const created = await createAddon(data);

      const saved: SavedAddon = {
        ...created,
        imagePreview: created.imageUrl ?? data.imagePreview ?? null,
      };

      setSavedAddons((prev) => [saved, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Failed to create add-on. Please check the console for details.");
    }
  };

  // open confirm popup
  const askDeleteAddon = (addon: SavedAddon) => {
    setAddonToDelete(addon);
  };

  // actually delete after confirm
  const handleConfirmDelete = async () => {
    if (!addonToDelete) return;

    try {
      setIsDeleting(true);
      await deleteAddon(addonToDelete._id);
      setSavedAddons((prev) =>
        prev.filter((a) => a._id !== addonToDelete._id)
      );
      setAddonToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete add-on. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setAddonToDelete(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Add-ons
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage add-ons that can be attached to your bookings.
            </p>
          </div>

          {/* Button to open popup */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            + Add add-on
          </button>
        </div>

        {/* Addons list */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading add-ons...</p>
          ) : savedAddons.length === 0 ? (
            <p className="text-sm text-slate-500">
              No add-ons have been created yet. Use the &quot;Add add-on&quot;
              button above to create your first add-on.
            </p>
          ) : (
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              {savedAddons.map((addon) => (
                <div
                  key={addon._id}
                  className="border border-slate-200 rounded-xl p-4 flex gap-3 bg-slate-50"
                >
                  {(addon.imagePreview || addon.imageUrl) && (
                    <img
                      src={addon.imagePreview || addon.imageUrl || ""}
                      alt={addon.title}
                      className="h-16 w-16 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900 truncate">
                      {addon.title}
                    </h2>
                    {addon.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {addon.description}
                      </p>
                    )}
                    {/* included/excluded chips removed – they were just extra info */}
                  </div>

                  {/* delete button with icon */}
                  <button
                    type="button"
                    onClick={() => askDeleteAddon(addon)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100 self-start"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add add-on popup modal */}
        <AddAddonModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAddon}
        />

        {/* Delete confirm popup */}
        {addonToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">
                Delete add-on?
              </h2>
              <p className="text-xs text-slate-600 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  &quot;{addonToDelete.title}&quot;
                </span>
                ? This add-on will no longer be available to attach to
                bookings.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
