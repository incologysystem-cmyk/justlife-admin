// app/addons/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AddAddonModal, { AddonPayload } from "./AddAddonModal";
import { fetchAddons, createAddon, deleteAddon, AddonDto } from "@/app/services/addonsApi";

type SavedAddon = AddonDto & {
  imagePreview: string | null; // frontend-only
};

export default function AddonsPage() {
  const [savedAddons, setSavedAddons] = useState<SavedAddon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // initial load
  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchAddons(false); // admin/provider panel, show all
        const mapped: SavedAddon[] = items.map((a) => ({
          ...a,
          imagePreview: null, // backend se abhi imageUrl handle nahi kar rahe
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
        imagePreview: data.imagePreview ?? null,
      };

      setSavedAddons((prev) => [saved, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Addon create nahi ho saka. Details console me dekho.");
    }
  };

  const handleDeleteAddon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this add-on?")) return;

    try {
      await deleteAddon(id);
      setSavedAddons((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      alert("Addon delete nahi ho saka.");
    }
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
              Yahan tum booking ke liye add-ons manage kar sakte ho.
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
            <p className="text-sm text-slate-500">Loading addons...</p>
          ) : savedAddons.length === 0 ? (
            <p className="text-sm text-slate-500">
              Abhi koi add-on save nahi hua. Upar &quot;Add add-on&quot; button se
              naya add-on create karo.
            </p>
          ) : (
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              {savedAddons.map((addon) => (
                <div
                  key={addon._id}
                  className="border border-slate-200 rounded-xl p-4 flex gap-3 bg-slate-50"
                >
                  {addon.imagePreview && (
                    <img
                      src={addon.imagePreview}
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
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                        {addon.included.length} included
                      </span>
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-100">
                        {addon.excluded.length} excluded
                      </span>
                    </div>
                  </div>

                  {/* optional delete button */}
                  <button
                    onClick={() => handleDeleteAddon(addon._id)}
                    className="text-[10px] text-rose-600 hover:text-rose-700 self-start"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popup modal component */}
        <AddAddonModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAddon}
        />
      </div>
    </main>
  );
}    