// admin/types/provider.ts
export type ProviderStatus = "pending" | "approved" | "rejected";

export interface BusinessClassification {
  classification: string;
  certifyingAgency?: string;
  certificateNumber?: string;
  startDate?: string;
  endDate?: string;
  attachmentUrl?: string;
}

export interface Activity {
  name: string;
  code?: string;
}

export interface BusinessAddress {
  country: string;
  addressName?: string;
  line1: string;
  line2?: string;
  emirate?: string;
  addressPurpose?: string;
}

export interface BankDetail {
  countryCode: string;
  bankName: string;
  branch?: string;
  accountNumber: string;
  iban: string;
  swift?: string;
  attachmentUrl?: string;
}

export interface ContactPerson {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  jobTitle?: string;
  attachmentUrl?: string;
}

export interface Taxation {
  vatApplicable: boolean;
  vatNumber?: string;
  taxPayerCountry?: string;
  attachmentUrl?: string;
}

export interface Qualifications {
  hasConflicts: boolean;
  isIcvApplicable: boolean;
  declarationAccepted: boolean;
}

export interface ProviderUserSummary {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneE164?: string;
  role: "customer" | "provider" | "admin";
}

export interface Provider {
  _id: string;
  userId: ProviderUserSummary | string;

  nameOfSupplier: string;
  creationDate?: string;
  supplierType?: string;
  legalForm?: string;
  licenseStatus?: string;
  msmeClassification?: string;
  establishmentDate?: string;

  dedLicenseNo: string;
  dedLicenseCertNumber?: string;

  businessClassifications: BusinessClassification[];
  activities: Activity[];
  addresses: BusinessAddress[];
  bankDetails: BankDetail[];
  contactPersons: ContactPerson[];
  taxation?: Taxation;
  qualifications?: Qualifications;

  status: ProviderStatus;
  adminComment?: string;
  approvedAt?: string;
  rejectedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ProvidersResponse {
  success: boolean;
  providers: Provider[];
}

export interface ProviderResponse {
  success: boolean;
  provider: Provider;
}
