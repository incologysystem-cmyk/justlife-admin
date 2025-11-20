export type ProviderRegistrationPayload = {
  nameOfSupplier: string;
  legalName?: string;
  dedLicenseNo: string;
  licenseIssueDate?: string | null;
  licenseExpiryDate?: string | null;
  trn?: string | null;
  website?: string | null;

  contactPersonName?: string;
  contactEmail: string;
  contactPhone?: string;

  address?: {
    country?: string;
    emirate?: string;
    city?: string;
    street?: string;
    poBox?: string;
  };

  primaryCategory?: string;
  servicesOffered?: string;
  yearsInBusiness?: string;
  numberOfEmployees?: string;
};

export type ProviderRequestResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  providerRequest?: any;
};

export async function createProviderRequest(
  payload: ProviderRegistrationPayload
): Promise<ProviderRequestResponse> {
  const res = await fetch("/api/provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as ProviderRequestResponse;

  if (!res.ok || data.error) {
    throw new Error(
      data.error || data.message || "Failed to submit provider request"
    );
  }

  return data;
}
