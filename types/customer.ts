// admin/types/customer.ts
export type Customer = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneE164?: string;
  createdAt: string;
  totalBookings: number;
  totalJobs: number;
  totalSpent: number; // AED etc.
};

export type CustomersResponse = {
  success: boolean;
  customers: Customer[];
};

export type CustomerWithHistory = Customer & {
  bookings: BookingSummary[];
  jobs: JobSummary[];
};

// reuse lightweight versions for detail page
export type BookingSummary = {
  _id: string;
  code: string;
  serviceName: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledAt: string;
  totalAmount: number;
};

export type JobSummary = {
  _id: string;
  jobCode: string;
  category: string;
  providerName?: string;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
};
