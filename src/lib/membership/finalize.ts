import { getDb } from "@/lib/db";
import { getEnrollment } from "@/lib/db/repository";
import { generateMembershipNumber } from "./number";

export type FinalizeResult =
  | { status: "assigned"; membershipNumber: string }
  | { status: "already_assigned"; membershipNumber: string }
  | {
      status: "not_eligible";
      reason: "not_found" | "not_paid" | "not_approved";
    };

const MAX_ATTEMPTS = 5;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

/**
 * Assign a unique membership number to an enrollment, but only once both
 * preconditions hold: the application is approved AND payment has completed.
 *
 * Safe to call from either trigger point (payment success or approval) and
 * safe to call repeatedly — it is idempotent and never issues a second number.
 */
export function finalizeEnrollment(enrollmentId: string): FinalizeResult {
  const enrollment = getEnrollment(enrollmentId);
  if (!enrollment) {
    return { status: "not_eligible", reason: "not_found" };
  }
  if (enrollment.membershipNumber) {
    return {
      status: "already_assigned",
      membershipNumber: enrollment.membershipNumber,
    };
  }
  // Payment must have completed. "active" also implies paid.
  if (enrollment.status !== "paid" && enrollment.status !== "active") {
    return { status: "not_eligible", reason: "not_paid" };
  }
  if (!enrollment.approvedAt) {
    return { status: "not_eligible", reason: "not_approved" };
  }

  const db = getDb();
  // The `membership_number IS NULL` guard makes the assignment atomic: only the
  // first writer wins, so a number is never overwritten or issued twice.
  const assign = db.prepare(
    `UPDATE enrollments
       SET membership_number = @number, status = 'active', updated_at = @now
     WHERE id = @id AND membership_number IS NULL`,
  );

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const number = generateMembershipNumber();
    try {
      const info = assign.run({
        number,
        id: enrollmentId,
        now: new Date().toISOString(),
      });
      if (info.changes === 1) {
        return { status: "assigned", membershipNumber: number };
      }
      // No row updated -> another writer assigned a number first. Return it.
      const current = getEnrollment(enrollmentId);
      if (current?.membershipNumber) {
        return {
          status: "already_assigned",
          membershipNumber: current.membershipNumber,
        };
      }
    } catch (error) {
      // The generated number collided with an existing one — try another.
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new Error(
    `Could not allocate a unique membership number for ${enrollmentId} after ${MAX_ATTEMPTS} attempts`,
  );
}
