// app/components/services/providerCustomers.ts

export type ProviderCustomerSummary = {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  totalBookings: number;
  totalSpent: number;
  services: Array<{
    serviceId?: string;
    serviceName?: string;
    count: number;
  }>;
};

export type ProviderCustomersResponse = {
  items: ProviderCustomerSummary[];
};

export type CustomerHistoryStats = {
  totalBookings: number;
  totalSpent: number;
  services: Array<{
    serviceId?: string;
    serviceName?: string;
    count: number;
  }>;
};

export type CustomerHistoryBooking = {
  _id: string;
  serviceId: string;
  serviceName: string;
  status: string;
  amount: number;
  qty: number;
  schedule?: {
    startAt: string;
    timeSlot?: string;
    tz?: string;
    frequency: string;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

export type CustomerHistoryPayload = {
  customer: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  previous: CustomerHistoryBooking[];
  upcoming: CustomerHistoryBooking[];
  stats: CustomerHistoryStats;
};

export async function fetchProviderCustomers(): Promise<ProviderCustomerSummary[]> {
  const res = await fetch("/api/provider/customers", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || "Failed to load provider customers");
  }

  const items =
    data?.data?.items && Array.isArray(data.data.items)
      ? data.data.items
      : [];

  return items as ProviderCustomerSummary[];
}

export async function fetchProviderCustomerHistory(
  customerId: string
): Promise<CustomerHistoryPayload> {
  const id = (customerId || "").trim();

  if (!id || id === "undefined" || id === "null") {
    throw new Error("CustomerId is missing for history request");
  }

  const res = await fetch(
    `/api/provider/customers/${encodeURIComponent(id)}/history`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || "Failed to load customer history");
  }

  return data.data as CustomerHistoryPayload;
}
