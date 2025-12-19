// admin/types/booking.ts
export type Booking = {
  _id: string;
  code: string;
  customerName: string;
  customerId: string;
  serviceName: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledAt: string;
  createdAt: string;
  totalAmount: number;
};

export type BookingsResponse = {
  success: boolean;
  bookings: Booking[];
};
