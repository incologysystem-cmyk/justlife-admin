// admin/services/adminCustomers.ts
// import type {
//   CustomersResponse,
//   CustomerWithHistory,
// } from "../types/customer";

import type { CustomersResponse, CustomerWithHistory } from "@/types/customer";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// 🔹 Dummy data
const dummyCustomers: CustomerWithHistory[] = [
  {
    _id: "c1",
    firstName: "Omar",
    lastName: "Hassan",
    email: "omar@example.com",
    phoneE164: "+971500000111",
    createdAt: new Date("2024-01-10").toISOString(),
    totalBookings: 5,
    totalJobs: 3,
    totalSpent: 3250,

    bookings: [
      {
        _id: "b1",
        code: "BK-1001",
        serviceName: "AC Maintenance",
        status: "completed",
        scheduledAt: new Date("2024-01-12T10:00:00").toISOString(),
        totalAmount: 450,
      },
      {
        _id: "b2",
        code: "BK-1002",
        serviceName: "Plumbing Repair",
        status: "completed",
        scheduledAt: new Date("2024-02-05T14:00:00").toISOString(),
        totalAmount: 320,
      },
    ],

    jobs: [
      {
        _id: "j1",
        jobCode: "JOB-2001",
        category: "Mechanical",
        providerName: "Golden Maintenance",
        status: "completed",
        createdAt: new Date("2024-01-12").toISOString(),
      },
      {
        _id: "j2",
        jobCode: "JOB-2005",
        category: "Plumbing",
        providerName: "PipeFix Co",
        status: "completed",
        createdAt: new Date("2024-02-05").toISOString(),
      },
    ],
  },
  {
    _id: "c2",
    firstName: "Aisha",
    lastName: "Khalid",
    email: "aisha@example.com",
    phoneE164: "+971500000222",
    createdAt: new Date("2024-02-20").toISOString(),
    totalBookings: 2,
    totalJobs: 1,
    totalSpent: 890,
    bookings: [],
    jobs: [],
  },
];

export async function fetchCustomers(): Promise<CustomersResponse> {
  await delay(400);
  return {
    success: true,
    customers: dummyCustomers.map(
      ({ bookings, jobs, ...rest }) => rest // strip history for list
    ),
  };
}

export async function fetchCustomerById(
  id: string
): Promise<{ success: boolean; customer: CustomerWithHistory }> {
  await delay(400);
  const found =
    dummyCustomers.find((c) => c._id === id) || dummyCustomers[0];
  return { success: true, customer: found };
}
