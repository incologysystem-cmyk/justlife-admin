// app/(admin)/bookings/page.tsx
// import Calendar from "@/components/bookings/Calendar";
import Calendar from "@/app/components/bookings/Calendar";
import { fetchBookings } from "@/lib/api";


export default async function BookingsPage() {
const bookings = await fetchBookings();
return (
<div className="space-y-4">
<h2 className="text-lg font-semibold">Bookings</h2>
<Calendar items={bookings} />
</div>
);
}