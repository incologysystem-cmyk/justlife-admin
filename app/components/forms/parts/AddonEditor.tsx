// components/forms/parts/AddonEditor.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchAddons, type AddonDto } from "@/app/services/addonsApi";

type AddonEditorProps = {
  /** Selected addon IDs for this service */
  value: string[];
  /** Called when selection changes */
  onChange: (ids: string[]) => void;
};

export default function AddonEditor({ value, onChange }: AddonEditorProps) {
  const [addons, setAddons] = useState<AddonDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchAddons(false); // admin/provider: show all
        setAddons(items);
      } catch (err) {
        console.error(err);
        setError("Failed to load add-ons. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl2 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">Add-ons</div>
        {value.length > 0 && (
          <div className="text-[11px] text-gray-700">
            Selected: <span className="font-semibold">{value.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-700">Loading add-ons…</p>
      ) : error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : addons.length === 0 ? (
        <p className="text-xs text-gray-700">
          No global add-ons found. Create add-ons from the{" "}
          <span className="font-semibold">Add-ons</span> page first.
        </p>
      ) : (
        <div className="flex flex-col gap-2 text-xs text-gray-900">
          {addons.map((addon) => {
            const id = (addon as any)._id as string;
            const selected = value.includes(id);
            const price = (addon as any).price as number | undefined;
            const maxQty =
              (addon as any).maxQty != null ? (addon as any).maxQty : 1;
            const imageUrl = (addon as any).imageUrl as string | undefined;

            return (
              <label
                key={id}
                className="flex items-start gap-3 border border-border rounded-lg p-2 hover:bg-gray-50 cursor-pointer"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(id)}
                  className="mt-1"
                />

                {/* Optional image */}
                {imageUrl && (
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-border flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={(addon as any).title ?? "Addon image"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900 truncate">
                      {(addon as any).title ??
                        (addon as any).name ??
                        "Untitled add-on"}
                    </span>
                    {typeof price === "number" && (
                      <span className="text-[11px] text-gray-800 whitespace-nowrap">
                        AED {price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-700 mt-0.5">
                    Max qty: {maxQty}
                  </div>

                  {(addon as any).description && (
                    <div className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                      {(addon as any).description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
