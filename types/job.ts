// admin/types/job.ts
export type Job = {
  _id: string;
  jobCode: string;
  customerName: string;
  customerId: string;
  providerName?: string;
  providerId?: string;
  category: string;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  totalAmount: number;
};

export type JobsResponse = {
  success: boolean;
  jobs: Job[];
};
