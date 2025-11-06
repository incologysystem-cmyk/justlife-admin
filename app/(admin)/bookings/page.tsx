import { cookies } from "next/headers";
import Calendar from "@/app/components/bookings/Calendar";
import { fetchBookings } from "@/lib/api";

export default async function BookingsPage() {
  const jar = await cookies(); // <-- await is required now
  const token =
    jar.get("token")?.value || jar.get("accessToken")?.value || undefined;

  const bookings = await fetchBookings({ token });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bookings</h2>
      <Calendar items={bookings} />
    </div>
  );
}
