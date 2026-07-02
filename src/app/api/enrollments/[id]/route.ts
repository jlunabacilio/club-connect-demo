import { NextResponse } from "next/server";
import { getEnrollmentWithDetails } from "@/lib/db/repository";

// better-sqlite3 requires the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fetch a single enrollment with its application snapshot and all statuses. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const enrollment = getEnrollmentWithDetails(id);
  if (!enrollment) {
    return NextResponse.json(
      { error: "Enrollment not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ enrollment });
}
