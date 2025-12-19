// admin/services/adminJobs.ts
// import type { JobsResponse, Job } from "../types/job";
import type { JobsResponse, Job } from "@/types/job";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const dummyJobs: Job[] = [
  {
    _id: "j1",
    jobCode: "JOB-2001",
    customerName: "Omar Hassan",
    customerId: "c1",
    providerName: "Golden Maintenance",
    providerId: "p1",
    category: "Mechanical",
    status: "completed",
    createdAt: new Date("2024-01-12T10:30:00").toISOString(),
    totalAmount: 450,
  },
  {
    _id: "j2",
    jobCode: "JOB-2002",
    customerName: "Aisha Khalid",
    customerId: "c2",
    providerName: "PipeFix Co",
    providerId: "p2",
    category: "Plumbing",
    status: "in_progress",
    createdAt: new Date("2024-02-05T14:15:00").toISOString(),
    totalAmount: 320,
  },
];

export async function fetchJobs(): Promise<JobsResponse> {
  await delay(400);
  return { success: true, jobs: dummyJobs };
}
