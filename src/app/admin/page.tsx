import Link from "next/link";
import type { Metadata } from "next";
import { listEnrollments } from "@/lib/db/repository";
import { MEMBERSHIP_TYPE_LABELS } from "@/types/membership";
import { formatMoney } from "@/lib/payment/pricing";

export const metadata: Metadata = {
  title: "Enrollments · Admin",
};

// Reads live data from SQLite on every request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BADGE_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  succeeded: "bg-emerald-100 text-emerald-800",
  verified: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
  rejected: "bg-rose-100 text-rose-800",
};

function Badge({ value }: { value: string }) {
  const style = BADGE_STYLES[value] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {value}
    </span>
  );
}

function fmtDate(iso: string): string {
  // Deterministic, locale-independent (avoids server/client mismatch).
  return iso.slice(0, 16).replace("T", " ");
}

export default function AdminPage() {
  const enrollments = listEnrollments();

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Enrollments
            </h1>
            <p className="text-sm text-slate-500">
              {enrollments.length} application
              {enrollments.length === 1 ? "" : "s"} · newest first
            </p>
          </div>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            New sign-up
          </Link>
        </header>

        {enrollments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            No enrollments yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Membership #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {fmtDate(e.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {e.applicantName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {e.applicantEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {MEMBERSHIP_TYPE_LABELS[e.membershipType]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatMoney(e.amountCents, e.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={e.verificationStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={e.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={e.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">
                      {e.membershipNumber ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
