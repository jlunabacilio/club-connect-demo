import { randomUUID } from "node:crypto";
import type { MembershipType, PaymentMethodType } from "@/types/membership";
import { getDb } from "./index";

export type EnrollmentStatus =
  | "pending_payment"
  | "paid"
  | "payment_failed";

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
