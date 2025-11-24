import type {
  CustomersResponse,
  CustomerWithHistory,
  Customer,
} from "@/types/customer";

const API_PREFIX = "/api/bookings"; // ⬅️ same rehne do (Next API proxy use ho raha hai)

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok || json?.error) {
    const msg =
      json?.error ||
      json?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

/**
 * 🔹 Customers list (summary)
 * GET /api/bookings/customers → proxy → backend /api/users/customers
 */
export async function fetchCustomers(): Promise<CustomersResponse> {
  const res = await fetch(`${API_PREFIX}/customers`, {
    method: "GET",
    credentials: "include",
  });

  const json = await handleJsonResponse<any>(res);

  // backend: { success, items: [user docs] }
  const items: any[] =
    json.items ??
    json.customers ??
    json.data?.customers ??
    [];

  const customers: Customer[] = items.map((item) => {
    // ✅ name ab user fields se
    const fullName: string =
      item.customerName ||
      `${item.firstName ?? ""} ${item.lastName ?? ""}`;
    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ");

    const totalJobs =
      typeof item.totalJobs === "number"
        ? item.totalJobs
        : Array.isArray(item.services)
        ? item.services.reduce(
            (sum: number, s: any) => sum + (s.count ?? 0),
            0
          )
        : 0;

    return {
      _id: item.customerId || item._id || item.id,
      firstName: firstName || "",
      lastName: lastName || "",
      email: item.customerEmail || item.email || "",
      phoneE164: item.phoneE164 || item.customerPhone || "",
      createdAt: item.createdAt || new Date().toISOString(),
      totalBookings: item.totalBookings ?? 0, // backend abhi nahi bhej raha to 0 rahega
      totalJobs,
      totalSpent: item.totalSpent ?? 0,
    } as Customer;
  });

  return {
    success: Boolean(json.success ?? json.ok ?? true),
    customers,
  };
}

/**
 * 🔹 Single customer + full history
 * GET /api/bookings/customers/:customerId/history
 * proxy → backend /api/users/customers/:customerId/history
 */
export async function fetchCustomerById(
  id: string
): Promise<{ success: boolean; customer: CustomerWithHistory }> {
  if (!id) {
    throw new Error("Customer id is required");
  }

  const res = await fetch(`${API_PREFIX}/customers/${id}/history`, {
    method: "GET",
    credentials: "include",
  });

  const json = await handleJsonResponse<any>(res);

  const backendCustomer: any =
    json.customer ?? json.data?.customer ?? json;

  if (!backendCustomer) {
    throw new Error("Customer not found in response");
  }

  // ---- Base customer fields (from user doc) ----
  const fullName: string =
    backendCustomer.customerName ||
    `${backendCustomer.firstName ?? ""} ${
      backendCustomer.lastName ?? ""
    }`;
  const [firstName, ...rest] = fullName.trim().split(" ");
  const lastName = rest.join(" ");

  const stats = json.stats || {};

  const totalJobsBase =
    typeof backendCustomer.totalJobs === "number"
      ? backendCustomer.totalJobs
      : Array.isArray(stats.services)
      ? stats.services.reduce(
          (sum: number, s: any) => sum + (s.count ?? 0),
          0
        )
      : 0;

  const base: Customer = {
    _id: backendCustomer.customerId || backendCustomer._id || backendCustomer.id,
    firstName: firstName || "",
    lastName: lastName || "",
    email: backendCustomer.customerEmail || backendCustomer.email || "",
    phoneE164:
      backendCustomer.phoneE164 || backendCustomer.customerPhone || "",
    createdAt:
      backendCustomer.createdAt || new Date().toISOString(),
    totalBookings:
      stats.totalBookings ?? backendCustomer.totalBookings ?? 0,
    totalJobs: totalJobsBase,
    totalSpent:
      stats.totalSpent ?? backendCustomer.totalSpent ?? 0,
  };

  // ---- Bookings mapping (previous + upcoming merge) ----
  const bookingsRaw: any[] = [
    ...(json.previous ?? []),
    ...(json.upcoming ?? []),
  ];

  const bookings = bookingsRaw.map((b: any) => ({
    _id: b._id || b.id || b.code,
    code: b.code || b.bookingCode || b.reference || "",
    serviceName:
      b.serviceName || b.service?.name || b.serviceTitle || "",
    status: b.status ?? "pending",
    scheduledAt:
      b.schedule?.startAt ||
      b.scheduledAt ||
      b.date ||
      b.createdAt ||
      new Date().toISOString(),
    totalAmount:
      b.totalAmount ?? b.amount ?? b.pricing?.total ?? 0,
  }));

  // ---- Jobs: users module se abhi jobs nahi aa rahi, empty rakhenge ----
  const jobs: any[] = [];

  const customer: CustomerWithHistory = {
    ...base,
    bookings,
    jobs,
  };

  return {
    success: Boolean(json.success ?? json.ok ?? true),
    customer,
  };
}
