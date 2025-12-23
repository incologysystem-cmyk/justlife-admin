"use client";

import { useState } from "react";
import AvailabilityPageClient from "./ui";

export default function ProviderAvailabilityPage() {
  const [openAdd, setOpenAdd] = useState(0);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Availability</h1>
          <p className="text-sm text-muted-foreground">
            Add and manage your working hours. Slots will be generated from this.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpenAdd((x) => x + 1)}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          + Add availability
        </button>
      </div>

      <AvailabilityPageClient openAddSignal={openAdd} />
    </div>
  );
}
