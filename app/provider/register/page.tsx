"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProviderRequest } from "@/app/services/providerApi";

type ProviderFormState = {
  // Company / License info
  nameOfSupplier: string;
  legalName: string;
  dedLicenseNo: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  trn: string;
  website: string;

  // Contact person
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;

  // Address
  country: string;
  emirate: string;
  city: string;
  street: string;
  poBox: string;

  // Services
  primaryCategory: string;
  servicesOffered: string;
  yearsInBusiness: string;
  numberOfEmployees: string;

  acceptTerms: boolean;
};

const initialState: ProviderFormState = {
  nameOfSupplier: "",
  legalName: "",
  dedLicenseNo: "",
  licenseIssueDate: "",
  licenseExpiryDate: "",
  trn: "",
  website: "",
  contactPersonName: "",
  contactEmail: "",
  contactPhone: "",
  country: "United Arab Emirates",
  emirate: "",
  city: "",
  street: "",
  poBox: "",
  primaryCategory: "",
  servicesOffered: "",
  yearsInBusiness: "",
  numberOfEmployees: "",
  acceptTerms: false,
};

export default function ProviderRegistrationPage() {
  const [form, setForm] = useState<ProviderFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update<K extends keyof ProviderFormState>(
    key: K,
    value: ProviderFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toISOorUndefined(v: string) {
    return v ? new Date(v).toISOString() : undefined;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.acceptTerms) {
      toast.error("Please accept the terms & conditions.");
      return;
    }

    if (!form.nameOfSupplier.trim() || !form.dedLicenseNo.trim() || !form.contactEmail.trim()) {
      toast.error("Supplier name, DED License No and contact email are required.");
      return;
    }

    const issueISO = toISOorUndefined(form.licenseIssueDate);
    const expiryISO = toISOorUndefined(form.licenseExpiryDate);

    // Contact name split (first / last)
    const nameParts = form.contactPersonName.trim().split(" ").filter(Boolean);
    const firstName = nameParts[0] || "Contact";
    const lastName = nameParts.slice(1).join(" ") || "Person";

    setLoading(true);
    try {
      // 🔥 Backend ke providerCreateSchema ke hisaab se exact payload
      await createProviderRequest({
        nameOfSupplier: form.nameOfSupplier,
        legalName: form.legalName || undefined,
        website: form.website || undefined,

        dedLicenseNo: form.dedLicenseNo,
        dedLicenseCertNumber: form.dedLicenseNo, // same as license number

        creationDate: issueISO,
        supplierType: "Service Provider",
        legalForm: "LLC",
        licenseStatus: "Active",
        msmeClassification: "SME",
        establishmentDate: issueISO,

        businessClassifications: [
          {
            classification: form.primaryCategory || "Technical Services",
            certifyingAgency: form.emirate
              ? `${form.emirate} DED`
              : "Abu Dhabi DED",
            certificateNumber: form.dedLicenseNo,
            startDate: issueISO,
            endDate: expiryISO,
            attachmentUrl:
              form.website?.replace(/\/+$/, "") + "/license.pdf" ||
              "https://example.com/license.pdf",
          },
        ],

        activities: [
          {
            name:
              form.servicesOffered ||
              form.primaryCategory ||
              "General maintenance",
            code: "GEN-SVC",
          },
        ],

        addresses: [
          {
            country: form.country || "UAE",
            addressName: "Workshop & Office",
            line1:
              form.street ||
              `${form.city || ""}${form.city && form.emirate ? ", " : ""}${
                form.emirate || ""
              }` ||
              "Business address",
            line2: form.poBox ? `P.O. Box ${form.poBox}` : undefined,
            emirate: form.emirate || undefined,
            addressPurpose: "Business",
          },
        ],

        bankDetails: [
          {
            countryCode: "AE",
            bankName: "Sample Bank",
            branch: "Main Branch",
            accountNumber: "1234567890",
            iban: "AE120001234567890123456",
            swift: "SAMPLEAE",
            attachmentUrl:
              form.website?.replace(/\/+$/, "") + "/bank-letter.pdf" ||
              "https://example.com/bank-letter.pdf",
          },
        ],

        contactPersons: [
          {
            firstName,
            lastName,
            email: form.contactEmail,
            mobileNumber: form.contactPhone || "+971500000000",
            jobTitle: "Owner / Manager",
            attachmentUrl:
              form.website?.replace(/\/+$/, "") + "/id-arslan.pdf" ||
              "https://example.com/id-arslan.pdf",
          },
        ],

        taxation: form.trn
          ? {
              vatApplicable: true,
              vatNumber: form.trn,
              taxPayerCountry: form.country || "UAE",
              attachmentUrl:
                form.website?.replace(/\/+$/, "") + "/vat-cert.pdf" ||
                "https://example.com/vat-cert.pdf",
            }
          : {
              vatApplicable: false,
            },

        qualifications: {
          hasConflicts: false,
          isIcvApplicable: false,
          declarationAccepted: form.acceptTerms,
        },
      } as any); // (agar TS type complain kare to temporarily any)

      toast.success("Your provider registration has been submitted for review.");
      setForm(initialState);
      router.push("/provider/thank-you"); // tumhara thank-you route
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.message || "Something went wrong while submitting the form"
      );
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center px-4 py-8">
      <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Become a Service Provider
          </h1>
          <p className="text-sm text-slate-600">
            Submit your company details to join the Credible Management network. Your
            application will be reviewed by the admin team.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Info */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Company & License Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Supplier / Trade Name *
                </label>
                <input
                  value={form.nameOfSupplier}
                  onChange={(e) => update("nameOfSupplier", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Golden Maintenance LLC"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Legal Name (as per license)
                </label>
                <input
                  value={form.legalName}
                  onChange={(e) => update("legalName", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Registered legal name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  DED License Number *
                </label>
                <input
                  value={form.dedLicenseNo}
                  onChange={(e) => update("dedLicenseNo", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., CN-1234567"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    License Issue Date
                  </label>
                  <input
                    type="date"
                    value={form.licenseIssueDate}
                    onChange={(e) => update("licenseIssueDate", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.licenseExpiryDate}
                    onChange={(e) => update("licenseExpiryDate", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  TRN (Tax Registration Number)
                </label>
                <input
                  value={form.trn}
                  onChange={(e) => update("trn", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., 100123456700003"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Website
                </label>
                <input
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>
          </section>

          {/* Contact person */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Primary Contact Person</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Person Name
                </label>
                <input
                  value={form.contactPersonName}
                  onChange={(e) => update("contactPersonName", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Phone (WhatsApp preferably)
                </label>
                <input
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="+9715xxxxxxxx"
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Office Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Country
                </label>
                <input
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Emirate
                </label>
                <input
                  value={form.emirate}
                  onChange={(e) => update("emirate", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Abu Dhabi, Dubai, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Street / Building
                </label>
                <input
                  value={form.street}
                  onChange={(e) => update("street", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  PO Box
                </label>
                <input
                  value={form.poBox}
                  onChange={(e) => update("poBox", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Services & Experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Service Category
                </label>
                <input
                  value={form.primaryCategory}
                  onChange={(e) => update("primaryCategory", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Mechanical, Plumbing, Electrical, etc."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Years in Business
                  </label>
                  <input
                    value={form.yearsInBusiness}
                    onChange={(e) => update("yearsInBusiness", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Number of Employees
                  </label>
                  <input
                    value={form.numberOfEmployees}
                    onChange={(e) => update("numberOfEmployees", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Brief description of services offered
              </label>
              <textarea
                value={form.servicesOffered}
                onChange={(e) => update("servicesOffered", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                placeholder="Describe the type of maintenance / contracting work you handle."
              />
            </div>
          </section>

          {/* Terms + submit */}
          <section className="space-y-3">
            <label className="flex items-start gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => update("acceptTerms", e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I confirm that the above information is accurate and understand that
                Credible Management may contact me for verification and compliance
                purposes.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit registration"}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}
