// admin/services/adminBookings.ts
// import type { BookingsResponse, Booking } from "../types/booking";
import type { BookingsResponse, Booking } from "@/types/booking";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const dummyBookings: Booking[] = [
  {
    _id: "b1",
    code: "BK-1001",
    customerName: "Omar Hassan",
    customerId: "c1",
    serviceName: "AC Maintenance",
    status: "completed",
    scheduledAt: new Date("2024-01-12T10:00:00").toISOString(),
    createdAt: new Date("2024-01-10T09:00:00").toISOString(),
    totalAmount: 450,
  },
  {
    _id: "b2",
    code: "BK-1002",
    customerName: "Aisha Khalid",
    customerId: "c2",
    serviceName: "Plumbing Repair",
    status: "pending",
    scheduledAt: new Date("2024-02-05T14:00:00").toISOString(),
    createdAt: new Date("2024-02-04T11:00:00").toISOString(),
    totalAmount: 320,
  },
];

export async function fetchBookings(): Promise<BookingsResponse> {
  await delay(400);
  return { success: true, bookings: dummyBookings };
}
