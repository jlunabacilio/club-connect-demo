import { randomUUID } from "node:crypto";
import type {
  MembershipType,
  PaymentMethodType,
  SignupFormData,
} from "@/types/membership";
import { getDb } from "./index";

/** Overall enrollment lifecycle. */
export type MembershipStatus = "pending" | "active" | "rejected";
/** Identity verification outcome. */
export type VerificationStatus = "pending" | "verified" | "rejected";
/** Payment outcome. */
export type PaymentStatus = "pending" | "succeeded" | "failed";

/** A row from the `enrollments` table, mapped to camelCase. */
export interface EnrollmentRow {
  id: string;
  membershipType: MembershipType;
  applicantName: string;
  applicantEmail: string;
  paymentMethod: PaymentMethodType;
  amountCents: number;
  currency: string;
  status: MembershipStatus;
  verificationStatus: VerificationStatus;
  approvedAt: string | null;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  membershipNumber: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** An enrollment together with the full (redacted) application snapshot. */
export interface EnrollmentWithDetails extends EnrollmentRow {
  details: SignupFormData;
}

interface EnrollmentDbRow {
  id: string;
  membership_type: MembershipType;
  applicant_name: string;
  applicant_email: string;
  payment_method: PaymentMethodType;
  amount_cents: number;
  currency: string;
  status: MembershipStatus;
  verification_status: VerificationStatus;
  approved_at: string | null;
  payment_status: PaymentStatus;
  paid_at: string | null;
  membership_number: string | null;
  activated_at: string | null;
  details_json: string;
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
    verificationStatus: row.verification_status,
    approvedAt: row.approved_at,
    paymentStatus: row.payment_status,
    paidAt: row.paid_at,
    membershipNumber: row.membership_number,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

/**
 * Insert a new application. All three tracked statuses start as 'pending'
 * (overall / verification / payment). Returns the new enrollment id.
 */
export function createEnrollment(input: CreateEnrollmentInput): string {
  const db = getDb();
  const id = `enr_${randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO enrollments (
       id, membership_type, applicant_name, applicant_email,
       payment_method, amount_cents, currency,
       status, verification_status, payment_status,
       details_json, created_at, updated_at
     ) VALUES (
       @id, @membershipType, @applicantName, @applicantEmail,
       @paymentMethod, @amountCents, @currency,
       'pending', 'pending', 'pending',
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

/** Fetch a single enrollment by id, or undefined if it doesn't exist. */
export function getEnrollment(id: string): EnrollmentRow | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM enrollments WHERE id = ?")
    .get(id) as EnrollmentDbRow | undefined;
  return row ? mapEnrollment(row) : undefined;
}

/** Fetch an enrollment plus the parsed application snapshot. */
export function getEnrollmentWithDetails(
  id: string,
): EnrollmentWithDetails | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM enrollments WHERE id = ?")
    .get(id) as EnrollmentDbRow | undefined;
  if (!row) return undefined;
  return {
    ...mapEnrollment(row),
    details: JSON.parse(row.details_json) as SignupFormData,
  };
}

/** List enrollments (newest first) for tracking/management. */
export function listEnrollments(): EnrollmentRow[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM enrollments ORDER BY created_at DESC")
    .all() as EnrollmentDbRow[];
  return rows.map(mapEnrollment);
}

/** Update the payment status, stamping paid_at on success. */
export function setPaymentStatus(id: string, status: PaymentStatus): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE enrollments
       SET payment_status = @status,
           paid_at = CASE WHEN @status = 'succeeded'
                          THEN COALESCE(paid_at, @now) ELSE paid_at END,
           updated_at = @now
     WHERE id = @id`,
  ).run({ id, status, now });
}

/**
 * Mark identity verification as passed. Idempotent — the original approval
 * timestamp is kept. Returns true if the enrollment exists.
 */
export function markVerified(id: string): boolean {
  const db = getDb();
  const info = db
    .prepare(
      `UPDATE enrollments
         SET verification_status = 'verified',
             approved_at = COALESCE(approved_at, @now),
             updated_at = @now
       WHERE id = @id`,
    )
    .run({ id, now: new Date().toISOString() });
  return info.changes > 0;
}

/**
 * Mark identity verification as rejected, which also rejects the overall
 * enrollment. Returns true if the enrollment exists.
 */
export function markRejected(id: string): boolean {
  const db = getDb();
  const info = db
    .prepare(
      `UPDATE enrollments
         SET verification_status = 'rejected',
             status = 'rejected',
             updated_at = @now
       WHERE id = @id`,
    )
    .run({ id, now: new Date().toISOString() });
  return info.changes > 0;
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
