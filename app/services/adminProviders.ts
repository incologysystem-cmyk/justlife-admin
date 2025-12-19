// admin/services/adminProviders.ts  (DUMMY VERSION)

import type {
  ProvidersResponse,
  ProviderResponse,
  Provider,
} from "@/types/provider";

// 🔹 Helper: delay to simulate API call
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// 🔹 Mock dummy providers list
const dummyProviders: Provider[] = [
  {
    _id: "p1",
    userId: {
      _id: "u1",
      firstName: "Ali",
      lastName: "Khan",
      email: "ali@example.com",
      phoneE164: "+971500000001",
      role: "customer",
    },
    nameOfSupplier: "Golden Maintenance Services",
    dedLicenseNo: "CN-123456",
    dedLicenseCertNumber: "Cert-9988",
    creationDate: new Date().toISOString(),
    supplierType: "Company",
    legalForm: "LLC",
    licenseStatus: "Active",
    msmeClassification: "Small",
    establishmentDate: "2020-04-10",

    businessClassifications: [
      {
        classification: "Maintenance Company",
        certifyingAgency: "DED",
        certificateNumber: "MC-101",
        startDate: "2023-01-01",
        endDate: "2024-01-01",
        attachmentUrl: "",
      },
    ],

    activities: [
      { name: "Plumbing" },
      { name: "Electrical Maintenance" },
    ],

    addresses: [
      {
        country: "UAE",
        addressName: "Main Office",
        line1: "Al Nahda Street",
        emirate: "Dubai",
        addressPurpose: "Office",
      },
    ],

    bankDetails: [
      {
        countryCode: "AE",
        bankName: "Emirates NBD",
        accountNumber: "123456789",
        iban: "AE1200000000123456789",
        swift: "EBILAEAD",
      },
    ],

    contactPersons: [
      {
        firstName: "Hamza",
        lastName: "Yousaf",
        email: "hamza@example.com",
        mobileNumber: "+971500000002",
        jobTitle: "Manager",
      },
    ],

    taxation: {
      vatApplicable: true,
      vatNumber: "VAT-998877",
      taxPayerCountry: "UAE",
    },

    qualifications: {
      hasConflicts: false,
      isIcvApplicable: true,
      declarationAccepted: true,
    },

    status: "pending",
    adminComment: "",
    approvedAt: "",
    rejectedAt: "",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ==========================================
// 🔹 DUMMY FUNCTIONS BELOW
// ==========================================

export async function fetchPendingProviders() {
  const res = await fetch("/api/admin/providers/pending", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to load providers");
  }

  return res.json();
}

export async function fetchProviderById(id: string): Promise<ProviderResponse> {
  const res = await fetch(`/api/admin/providers/${id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to load provider");
  }

  return res.json();
}


export async function approveProviderApi(
  id: string,
  adminComment?: string
): Promise<ProviderResponse> {
  const res = await fetch(`/api/admin/providers/${id}/approve`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ adminComment }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to approve provider");
  }

  return res.json();
}

export async function rejectProviderApi(
  id: string,
  adminComment?: string
): Promise<ProviderResponse> {
  const res = await fetch(`/api/admin/providers/${id}/reject`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ adminComment }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to reject provider");
  }

  return res.json();
}
