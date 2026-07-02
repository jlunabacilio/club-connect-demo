import { randomUUID } from "node:crypto";
import type { MembershipType, PaymentMethodType } from "@/types/membership";
import { getDb } from "./index";

export type EnrollmentStatus =
  | "pending_payment"
  | "paid"
  | "payment_failed"
  | "active";

/** A row from the `enrollments` table, mapped to camelCase. */
export interface EnrollmentRow {
  id: string;
  membershipType: MembershipType;
  applicantName: string;
  applicantEmail: string;
  paymentMethod: PaymentMethodType;
  amountCents: number;
  currency: string;
  status: EnrollmentStatus;
  membershipNumber: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EnrollmentDbRow {
  id: string;
  membership_type: MembershipType;
  applicant_name: string;
  applicant_email: string;
  payment_method: PaymentMethodType;
  amount_cents: number;
  currency: string;
  status: EnrollmentStatus;
  membership_number: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapEnrollment(row: EnrollmentDbRow): EnrollmentRow {
  return {
    id: row.id,
    membershipType: row.membership_type,
    applicantName: row.applicant_name,
    applicantEmail: row.applicant_email,
    paymentMethod: row.payment_method,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    membershipNumber: row.membership_number,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetch a single enrollment by id, or undefined if it doesn't exist. */
export function getEnrollment(id: string): EnrollmentRow | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM enrollments WHERE id = ?")
    .get(id) as EnrollmentDbRow | undefined;
  return row ? mapEnrollment(row) : undefined;
}

/**
 * Mark an enrollment as approved (e.g. after identity verification passes).
 * Idempotent: the original approval timestamp is preserved on repeat calls.
 * Returns true if the enrollment exists.
 */
export function approveEnrollment(id: string): boolean {
  const db = getDb();
  const info = db
    .prepare(
      `UPDATE enrollments
         SET approved_at = COALESCE(approved_at, @now),
             updated_at  = @now
       WHERE id = @id`,
    )
    .run({ id, now: new Date().toISOString() });
  return info.changes > 0;
}

export interface CreateEnrollmentInput {
  membershipType: MembershipType;
  applicantName: string;
  applicantEmail: string;
  paymentMethod: PaymentMethodType;
  amountCents: number;
  currency: string;
  /** Snapshot of the form, with sensitive card data already stripped. */
  details: unknown;
}

/** Insert a new enrollment in the `pending_payment` state. Returns its id. */
export function createEnrollment(input: CreateEnrollmentInput): string {
  const db = getDb();
  const id = `enr_${randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO enrollments (
       id, membership_type, applicant_name, applicant_email,
       payment_method, amount_cents, currency, status,
       details_json, created_at, updated_at
     ) VALUES (
       @id, @membershipType, @applicantName, @applicantEmail,
       @paymentMethod, @amountCents, @currency, 'pending_payment',
       @details, @now, @now
     )`,
  ).run({
    id,
    membershipType: input.membershipType,
    applicantName: input.applicantName,
    applicantEmail: input.applicantEmail,
    paymentMethod: input.paymentMethod,
    amountCents: input.amountCents,
    currency: input.currency,
    details: JSON.stringify(input.details),
    now,
  });

  return id;
}

export function updateEnrollmentStatus(
  id: string,
  status: EnrollmentStatus,
): void {
  const db = getDb();
  db.prepare(
    `UPDATE enrollments
       SET status = @status, updated_at = @now
     WHERE id = @id`,
  ).run({ id, status, now: new Date().toISOString() });
}

export interface RecordPaymentInput {
  enrollmentId: string;
  amountCents: number;
  currency: string;
  method: PaymentMethodType;
  status: "succeeded" | "failed";
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
}

/** Persist a payment attempt (success or failure). Returns its id. */
export function recordPayment(input: RecordPaymentInput): string {
  const db = getDb();
  const id = `pay_${randomUUID()}`;

  db.prepare(
    `INSERT INTO payments (
       id, enrollment_id, amount_cents, currency, method,
       status, transaction_id, error_code, error_message, created_at
     ) VALUES (
       @id, @enrollmentId, @amountCents, @currency, @method,
       @status, @transactionId, @errorCode, @errorMessage, @now
     )`,
  ).run({
    id,
    enrollmentId: input.enrollmentId,
    amountCents: input.amountCents,
    currency: input.currency,
    method: input.method,
    status: input.status,
    transactionId: input.transactionId ?? null,
    errorCode: input.errorCode ?? null,
    errorMessage: input.errorMessage ?? null,
    now: new Date().toISOString(),
  });

  return id;
}
