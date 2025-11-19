// admin/app/providers/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import {
//   fetchProviderById,
//   approveProviderApi,
//   rejectProviderApi,
// } from "../../../services/adminProviders";
import { fetchProviderById, approveProviderApi, rejectProviderApi } from "@/app/services/adminProviders";
import type { Provider } from "../../../types/provider";
// import { Table, Th, Td } from "../../../components/admin/Table";
import { Table, Th, Td } from "@/app/components/admin/Table";

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchProviderById(id);
        if (!mounted) return;
        setProvider(res.provider);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load provider");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleApprove = async () => {
    if (!provider) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await approveProviderApi(provider._id, adminComment || undefined);
      setProvider(res.provider);
      router.push("/providers/requests");
    } catch (err: any) {
      setError(err?.message || "Failed to approve provider");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!provider) return;
    if (!adminComment.trim()) {
      setError("Please add a reason for rejection in the admin comment.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await rejectProviderApi(provider._id, adminComment);
      setProvider(res.provider);
      router.push("/providers/requests");
    } catch (err: any) {
      setError(err?.message || "Failed to reject provider");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading provider…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!provider) {
    return (
      <p className="text-sm text-slate-500">
        Provider not found.
      </p>
    );
  }

  const user =
    typeof provider.userId === "string" ? undefined : provider.userId;

  return (
    <div className="space-y-6">
      {/* Top summary */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-base font-semibold">Supplier Details</h2>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Name: </span>
              {provider.nameOfSupplier || "—"}
            </div>
            <div>
              <span className="font-medium">DED License: </span>
              {provider.dedLicenseNo}
            </div>
            <div>
              <span className="font-medium">Legal Form: </span>
              {provider.legalForm || "—"}
            </div>
            <div>
              <span className="font-medium">License Status: </span>
              {provider.licenseStatus || "—"}
            </div>
            <div>
              <span className="font-medium">MSME Classification: </span>
              {provider.msmeClassification || "—"}
            </div>
            <div>
              <span className="font-medium">Status: </span>
              <StatusBadge status={provider.status} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-base font-semibold">Account Owner</h2>
          {user ? (
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Name: </span>
                {(user.firstName || "") + " " + (user.lastName || "")}
              </div>
              <div>
                <span className="font-medium">Email: </span>
                {user.email || "—"}
              </div>
              <div>
                <span className="font-medium">Phone: </span>
                {user.phoneE164 || "—"}
              </div>
              <div>
                <span className="font-medium">User Role: </span>
                {user.role}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              User record not populated.
            </p>
          )}
        </div>
      </section>

      {/* Activities */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Service Categories (Activities)</h3>
        <div className="flex flex-wrap gap-2">
          {provider.activities.map((a) => (
            <span
              key={a.name + a.code}
              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-800"
            >
              {a.name}
            </span>
          ))}
        </div>
      </section>

      {/* Addresses */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Addresses</h3>
        {provider.addresses.length === 0 ? (
          <p className="text-sm text-slate-500">No address data.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Country</Th>
                <Th>Emirate</Th>
                <Th>Address</Th>
                <Th>Purpose</Th>
              </tr>
            </thead>
            <tbody>
              {provider.addresses.map((addr, idx) => (
                <tr key={idx}>
                  <Td>{addr.country}</Td>
                  <Td>{addr.emirate || "—"}</Td>
                  <Td>
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}
                  </Td>
                  <Td>{addr.addressPurpose || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Bank details */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Bank Details</h3>
        {provider.bankDetails.length === 0 ? (
          <p className="text-sm text-slate-500">No bank data.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Country Code</Th>
                <Th>Bank</Th>
                <Th>Account</Th>
                <Th>IBAN</Th>
                <Th>Swift</Th>
              </tr>
            </thead>
            <tbody>
              {provider.bankDetails.map((b, idx) => (
                <tr key={idx}>
                  <Td>{b.countryCode}</Td>
                  <Td>{b.bankName}</Td>
                  <Td>{b.accountNumber}</Td>
                  <Td>{b.iban}</Td>
                  <Td>{b.swift || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Contact persons */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Contact Persons</h3>
        {provider.contactPersons.length === 0 ? (
          <p className="text-sm text-slate-500">No contact persons.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Mobile</Th>
                <Th>Job Title</Th>
              </tr>
            </thead>
            <tbody>
              {provider.contactPersons.map((c, idx) => (
                <tr key={idx}>
                  <Td>
                    {c.firstName} {c.lastName}
                  </Td>
                  <Td>{c.email}</Td>
                  <Td>{c.mobileNumber}</Td>
                  <Td>{c.jobTitle || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Tax / Qualif */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold">Taxation</h3>
          {provider.taxation ? (
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">VAT Applicable: </span>
                {provider.taxation.vatApplicable ? "Yes" : "No"}
              </div>
              {provider.taxation.vatNumber && (
                <div>
                  <span className="font-medium">VAT Number: </span>
                  {provider.taxation.vatNumber}
                </div>
              )}
              {provider.taxation.taxPayerCountry && (
                <div>
                  <span className="font-medium">Tax Payer Country: </span>
                  {provider.taxation.taxPayerCountry}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No taxation data.</p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold">Qualifications</h3>
          {provider.qualifications ? (
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Conflicts of interest: </span>
                {provider.qualifications.hasConflicts ? "Yes" : "No"}
              </div>
              <div>
                <span className="font-medium">ICV Applicable: </span>
                {provider.qualifications.isIcvApplicable ? "Yes" : "No"}
              </div>
              <div>
                <span className="font-medium">Declaration accepted: </span>
                {provider.qualifications.declarationAccepted ? "Yes" : "No"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No qualification data.</p>
          )}
        </div>
      </section>

      {/* Admin actions */}
      <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Admin Decision</h3>

        {provider.adminComment && (
          <p className="text-xs text-slate-500">
            Last admin comment: {provider.adminComment}
          </p>
        )}

        <textarea
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add internal comment for approval or reason for rejection…"
          value={adminComment}
          onChange={(e) => setAdminComment(e.target.value)}
          rows={3}
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApprove}
            disabled={actionLoading}
            className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {actionLoading ? "Processing…" : "Approve Provider"}
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={actionLoading}
            className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {actionLoading ? "Processing…" : "Reject Provider"}
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: Provider["status"] }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";
  if (status === "approved") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`}>
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className={`${base} bg-red-50 text-red-700`}>
        Rejected
      </span>
    );
  }
  return (
    <span className={`${base} bg-amber-50 text-amber-700`}>
      Pending
    </span>
  );
}
