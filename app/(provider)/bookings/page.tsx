import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { fetchBookings } from "@/lib/api";
import BookingsClient from "./BookingsClient";
import { Route } from "next";

export const dynamic = "force-dynamic";

type ApiBooking = {
  _id: string;
  serviceName?: string;
  status?: string;
  schedule?: { startAt?: string };
  createdAt?: string;
};

export default async function BookingsPage() {
  noStore();

  try {
    const items = await fetchBookings(); // should return raw array from your API
    if (!Array.isArray(items)) throw new Error("Bad shape: items is not an array");

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Bookings</h2>

        {items.length === 0 ? (
          <p className="text-sm text-foreground/70">No bookings yet.</p>
        ) : (
          <BookingsClient items={items as ApiBooking[]} />
        )}
      </div>
    );
  } catch (e: any) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Bookings</h2>
        <p className="mt-2 text-sm text-foreground/70">
          {e?.message?.includes("Unauthorized")
            ? "You need to sign in to view bookings."
            : e?.message || "Could not load bookings."}
        </p>
        <div className="mt-4">
          <Link
            href={"/login" as Route}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
}
