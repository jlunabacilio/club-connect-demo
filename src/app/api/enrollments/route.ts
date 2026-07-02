import { NextResponse } from "next/server";
import { listEnrollments } from "@/lib/db/repository";

// better-sqlite3 requires the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List all enrollments (newest first) for tracking/management. */
export async function GET() {
  return NextResponse.json({ enrollments: listEnrollments() });
}
