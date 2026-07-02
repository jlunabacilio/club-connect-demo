import { NextResponse } from "next/server";
import { getEnrollment, markRejected } from "@/lib/db/repository";

// better-sqlite3 requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

/**
 * Reject an enrollment's identity verification (management action). This also
 * moves the overall enrollment to 'rejected'. Integration point for a failed
 * identity verification.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!markRejected(id)) {
    return NextResponse.json(
      { error: "Enrollment not found." },
      { status: 404 },
    );
  }

  const enrollment = getEnrollment(id);
  return NextResponse.json({
    enrollmentId: id,
    status: enrollment?.status,
    verificationStatus: enrollment?.verificationStatus,
  });
}
