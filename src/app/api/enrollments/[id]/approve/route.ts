import { NextResponse } from "next/server";
import { approveEnrollment, getEnrollment } from "@/lib/db/repository";
import { finalizeEnrollment } from "@/lib/membership/finalize";

// better-sqlite3 requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

/**
 * Approve an enrollment and, if payment has already completed, assign its
 * membership number. This is the integration point for the identity
 * verification step — once verification passes, it calls this to approve.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!approveEnrollment(id)) {
    return NextResponse.json(
      { error: "Enrollment not found." },
      { status: 404 },
    );
  }

  // Approval just completed — assign the number if payment is already done.
  const finalized = finalizeEnrollment(id);
  const enrollment = getEnrollment(id);

  return NextResponse.json({
    enrollmentId: id,
    status: enrollment?.status,
    approvedAt: enrollment?.approvedAt,
    membershipNumber: enrollment?.membershipNumber ?? null,
    finalize: finalized,
  });
}
