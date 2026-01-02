"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";

type Provider = {
  _id: string;

  nameOfSupplier?: string;
  legalName?: string;
  website?: string;
  creationDate?: string;

  supplierType?: string;
  legalForm?: string;
  licenseStatus?: string;
  msmeClassification?: string;

  establishmentDate?: string;
  dedLicenseNo?: string;
  dedLicenseCertNumber?: string;

  status?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  taxation?: {
    vatApplicable?: boolean;
    vatNumber?: string;
    taxPayerCountry?: string;
    attachmentUrl?: string;
  };

  qualifications?: {
    hasConflicts?: boolean;
    isIcvApplicable?: boolean;
    declarationAccepted?: boolean;
  };

  businessClassifications?: Array<{
    classification?: string;
    certifyingAgency?: string;
    certificateNumber?: string;
    startDate?: string;
    endDate?: string;
    attachmentUrl?: string;
  }>;

  activities?: Array<{
    name?: string;
    code?: string;
  }>;

  addresses?: Array<{
    country?: string;
    addressName?: string;
    line1?: string;
    line2?: string;
    emirate?: string;
    addressPurpose?: string;
  }>;

  bankDetails?: Array<{
    countryCode?: string;
    bankName?: string;
    branch?: string;
    accountNumber?: string;
    iban?: string;
    swift?: string;
    attachmentUrl?: string;
  }>;

  contactPersons?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    mobileNumber?: string;
    jobTitle?: string;
    attachmentUrl?: string;
  }>;

  availability?: {
    timezone?: string;
    slotIntervalMin?: number;
    bufferMin?: number;
    minAdvanceMin?: number;
    maxDaysAhead?: number;
    weekly?: Array<{
      dayOfWeek: number; // 0..6 (your data uses 1..5 etc)
      enabled?: boolean;
      windows?: Array<{ start: string; end: string }>;
      breaks?: Array<{ start: string; end: string }>;
    }>;
    overrides?: Array<{
      date: string;
      enabled?: boolean;
      windows?: Array<{ start: string; end: string }>;
      breaks?: Array<{ start: string; end: string }>;
    }>;
  };
};

function fmtDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

function yesNo(v?: boolean) {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dowLabel(n: number) {
  // your data uses 1..5 etc, assume 0..6 but still safe:
  const i = Math.max(0, Math.min(6, Number(n)));
  return DOW[i] || `Day ${n}`;
}

export default function ProviderProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  const title = useMemo(() => provider?.nameOfSupplier || provider?.legalName || "Provider", [provider]);

  async function fetchMe() {
    setLoading(true);
    setError(null);

    try {
      const r = await fetch("/api/provider/me", {
        credentials: "include",
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.message || j?.error || "Failed to load profile");

      const p = j?.provider as Provider | undefined;
      if (!p?._id) throw new Error("Provider not found in response");

      setProvider(p);
    } catch (e: any) {
      setProvider(null);
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold">Provider Profile</h1>
          <p className="text-sm opacity-70">Read-only supplier details</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => router.back()} className="text-sm px-3 py-2 rounded-lg border hover:bg-card">
            Back
          </button>
          <button onClick={fetchMe} className="text-sm px-3 py-2 rounded-lg border hover:bg-card">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-background p-5 flex items-center gap-2 text-sm">
          <Loader2 className="animate-spin" size={16} /> Loading...
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-background p-5">
          <div className="text-sm text-red-500">{error}</div>
          <button onClick={fetchMe} className="mt-3 text-sm px-3 py-2 rounded-lg border hover:bg-card">
            Retry
          </button>
        </div>
      ) : !provider ? (
        <div className="rounded-xl border bg-background p-5 text-sm opacity-70">No data</div>
      ) : (
        <div className="grid gap-4">
          {/* Header */}
          <div className="rounded-xl border bg-background">
            <div className="p-5 border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold">{title}</div>
                  <div className="text-sm opacity-70">
                    Status: <span className="font-medium">{provider.status || "—"}</span> · License:{" "}
                    <span className="font-medium">{provider.licenseStatus || "—"}</span>
                  </div>
                </div>

                {provider.website ? (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border hover:bg-card inline-flex items-center gap-2"
                  >
                    <ExternalLink size={14} /> Website
                  </a>
                ) : null}
              </div>
            </div>

            <div className="p-5 grid sm:grid-cols-2 gap-4">
              <InfoRow label="Legal Name" value={provider.legalName} />
              <InfoRow label="Supplier Type" value={provider.supplierType} />
              <InfoRow label="Legal Form" value={provider.legalForm} />
              <InfoRow label="MSME Classification" value={provider.msmeClassification} />
              <InfoRow label="DED License No" value={provider.dedLicenseNo} />
              <InfoRow label="DED Cert No" value={provider.dedLicenseCertNumber} />
              <InfoRow label="Creation Date" value={fmtDate(provider.creationDate)} />
              <InfoRow label="Establishment Date" value={fmtDate(provider.establishmentDate)} />
              <InfoRow label="Approved At" value={fmtDate(provider.approvedAt)} />
              <InfoRow label="Updated At" value={fmtDate(provider.updatedAt)} />
            </div>
          </div>

          {/* Taxation */}
          <Section title="Taxation">
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow label="VAT Applicable" value={yesNo(provider.taxation?.vatApplicable)} />
              <InfoRow label="VAT Number" value={provider.taxation?.vatNumber} />
              <InfoRow label="Tax Payer Country" value={provider.taxation?.taxPayerCountry} />
              <LinkRow label="VAT Certificate" href={provider.taxation?.attachmentUrl} />
            </div>
          </Section>

          {/* Qualifications */}
          <Section title="Qualifications">
            <div className="grid sm:grid-cols-3 gap-4">
              <InfoRow label="Has Conflicts" value={yesNo(provider.qualifications?.hasConflicts)} />
              <InfoRow label="ICV Applicable" value={yesNo(provider.qualifications?.isIcvApplicable)} />
              <InfoRow label="Declaration Accepted" value={yesNo(provider.qualifications?.declarationAccepted)} />
            </div>
          </Section>

          {/* Contact */}
          <Section title="Primary Contact Person">
            {provider.contactPersons?.length ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow
                  label="Name"
                  value={`${provider.contactPersons[0]?.firstName || ""} ${provider.contactPersons[0]?.lastName || ""}`.trim()}
                />
                <InfoRow label="Job Title" value={provider.contactPersons[0]?.jobTitle} />
                <InfoRow label="Email" value={provider.contactPersons[0]?.email} />
                <InfoRow label="Mobile" value={provider.contactPersons[0]?.mobileNumber} />
                <LinkRow label="ID Attachment" href={provider.contactPersons[0]?.attachmentUrl} />
              </div>
            ) : (
              <div className="text-sm opacity-70">No contact persons</div>
            )}
          </Section>

          {/* Address */}
          <Section title="Primary Address">
            {provider.addresses?.length ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow label="Address Name" value={provider.addresses[0]?.addressName} />
                <InfoRow label="Purpose" value={provider.addresses[0]?.addressPurpose} />
                <InfoRow label="Emirate" value={provider.addresses[0]?.emirate} />
                <InfoRow label="Country" value={provider.addresses[0]?.country} />
                <InfoRow label="Line 1" value={provider.addresses[0]?.line1} />
                <InfoRow label="Line 2" value={provider.addresses[0]?.line2} />
              </div>
            ) : (
              <div className="text-sm opacity-70">No addresses</div>
            )}
          </Section>

          {/* Bank */}
          <Section title="Bank Details">
            {provider.bankDetails?.length ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow label="Bank Name" value={provider.bankDetails[0]?.bankName} />
                <InfoRow label="Branch" value={provider.bankDetails[0]?.branch} />
                <InfoRow label="IBAN" value={provider.bankDetails[0]?.iban} />
                <InfoRow label="SWIFT" value={provider.bankDetails[0]?.swift} />
                <InfoRow label="Account Number" value={provider.bankDetails[0]?.accountNumber} />
                <LinkRow label="Bank Letter" href={provider.bankDetails[0]?.attachmentUrl} />
              </div>
            ) : (
              <div className="text-sm opacity-70">No bank details</div>
            )}
          </Section>

          {/* Business Classifications */}
          <Section title="Business Classifications">
            {provider.businessClassifications?.length ? (
              <div className="grid gap-3">
                {provider.businessClassifications.map((c, idx) => (
                  <div key={idx} className="rounded-lg border p-4 bg-background">
                    <div className="text-sm font-medium">{c.classification || "—"}</div>
                    <div className="text-xs opacity-70 mt-1">
                      Agency: {c.certifyingAgency || "—"} · Cert: {c.certificateNumber || "—"}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                    </div>
                    {c.attachmentUrl ? (
                      <a
                        className="mt-2 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border hover:bg-card"
                        href={c.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={14} /> View Attachment
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm opacity-70">No classifications</div>
            )}
          </Section>

          {/* Activities */}
          <Section title="Activities">
            {provider.activities?.length ? (
              <div className="grid gap-2">
                {provider.activities.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border p-3 bg-background">
                    <div className="text-sm">{a.name || "—"}</div>
                    <div className="text-xs opacity-70">{a.code || ""}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm opacity-70">No activities</div>
            )}
          </Section>

          {/* Availability summary */}
          <Section title="Availability Summary">
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow label="Timezone" value={provider.availability?.timezone} />
              <InfoRow label="Slot Interval (min)" value={String(provider.availability?.slotIntervalMin ?? "—")} />
              <InfoRow label="Buffer (min)" value={String(provider.availability?.bufferMin ?? "—")} />
              <InfoRow label="Min Advance (min)" value={String(provider.availability?.minAdvanceMin ?? "—")} />
              <InfoRow label="Max Days Ahead" value={String(provider.availability?.maxDaysAhead ?? "—")} />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="text-xs font-medium opacity-70">Weekly</div>
              {provider.availability?.weekly?.length ? (
                <div className="grid gap-2">
                  {provider.availability.weekly.map((d, idx) => (
                    <div key={idx} className="rounded-lg border p-3 bg-background">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{dowLabel(d.dayOfWeek)}</div>
                        <div className="text-xs opacity-70">{d.enabled ? "Enabled" : "Disabled"}</div>
                      </div>

                      <div className="mt-2 text-xs opacity-70">
                        Windows:{" "}
                        {d.windows?.length
                          ? d.windows.map((w) => `${w.start}-${w.end}`).join(", ")
                          : "—"}
                      </div>

                      <div className="mt-1 text-xs opacity-70">
                        Breaks:{" "}
                        {d.breaks?.length
                          ? d.breaks.map((b) => `${b.start}-${b.end}`).join(", ")
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm opacity-70">No weekly availability</div>
              )}

              <div className="text-xs font-medium opacity-70 mt-2">Overrides</div>
              {provider.availability?.overrides?.length ? (
                <div className="grid gap-2">
                  {provider.availability.overrides.map((o, idx) => (
                    <div key={idx} className="rounded-lg border p-3 bg-background">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{fmtDate(o.date)}</div>
                        <div className="text-xs opacity-70">{o.enabled ? "Enabled" : "Disabled"}</div>
                      </div>
                      <div className="mt-2 text-xs opacity-70">
                        Windows:{" "}
                        {o.windows?.length
                          ? o.windows.map((w) => `${w.start}-${w.end}`).join(", ")
                          : "—"}
                      </div>
                      <div className="mt-1 text-xs opacity-70">
                        Breaks:{" "}
                        {o.breaks?.length
                          ? o.breaks.map((b) => `${b.start}-${b.end}`).join(", ")
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm opacity-70">No overrides</div>
              )}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-background">
      <div className="px-5 py-3 border-b">
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs opacity-70">{label}</div>
      <div className="h-10 px-3 rounded-lg border bg-transparent flex items-center">
        <span className="text-sm truncate">{value && value.trim() ? value : "—"}</span>
      </div>
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href?: string }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs opacity-70">{label}</div>
      {href ? (
        <a
          className="h-10 px-3 rounded-lg border bg-transparent flex items-center justify-between hover:bg-card text-sm"
          href={href}
          target="_blank"
          rel="noreferrer"
        >
          <span className="truncate">{href}</span>
          <ExternalLink size={14} className="shrink-0 opacity-70" />
        </a>
      ) : (
        <div className="h-10 px-3 rounded-lg border bg-transparent flex items-center">
          <span className="text-sm">—</span>
        </div>
      )}
    </div>
  );
}
