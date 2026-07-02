import { NextResponse } from "next/server";
import type { PaymentResponse } from "@/types/payment";
import { parseSignupPayload } from "@/lib/signup-payload";
import { getPrice } from "@/lib/payment/pricing";
import { processPayment } from "@/lib/payment/gateway";
import { deriveApplicant, redactForStorage } from "@/lib/signup";
import {
  createEnrollment,
  recordPayment,
  setPaymentStatus,
} from "@/lib/db/repository";
import { finalizeEnrollment } from "@/lib/membership/finalize";

// better-sqlite3 requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", errors: { _: "Malformed request body." } },
      { status: 400 },
    );
  }

  // Safely parse & validate the untrusted payload (shape, types, enums, and
  // field rules) before doing anything with it.
  const parsed = parseSignupPayload(raw);
  if (!parsed.ok) {
    const body: PaymentResponse = { status: "invalid", errors: parsed.errors };
    return NextResponse.json(body, { status: 400 });
  }
  const data = parsed.data;

  const price = getPrice(data.membershipType);
  const applicant = deriveApplicant(data);

  // Persist the application before attempting payment.
  const enrollmentId = createEnrollment({
    membershipType: data.membershipType,
    applicantName: applicant.name,
    applicantEmail: applicant.email,
    paymentMethod: data.payment.type,
    amountCents: price.amountCents,
    currency: price.currency,
    details: redactForStorage(data),
  });

  const outcome = await processPayment({
    method: data.payment.type,
    amountCents: price.amountCents,
    currency: price.currency,
    cardNumber: data.payment.card.cardNumber,
  });

  // Record the attempt regardless of outcome.
  recordPayment({
    enrollmentId,
    amountCents: price.amountCents,
    currency: price.currency,
    method: data.payment.type,
    status: outcome.status,
    transactionId:
      outcome.status === "succeeded" ? outcome.transactionId : undefined,
    errorCode: outcome.status === "failed" ? outcome.errorCode : undefined,
    errorMessage:
      outcome.status === "failed" ? outcome.errorMessage : undefined,
  });

  if (outcome.status === "failed") {
    setPaymentStatus(enrollmentId, "failed");
    const body: PaymentResponse = {
      status: "failed",
      enrollmentId,
      errorCode: outcome.errorCode,
      errorMessage: outcome.errorMessage,
    };
    // 402 Payment Required — the request was valid but payment did not succeed.
    return NextResponse.json(body, { status: 402 });
  }

  setPaymentStatus(enrollmentId, "succeeded");

  // Payment just completed — if the application is already approved, the
  // membership number is issued now; otherwise it's assigned once approval
  // completes (see the approve endpoint).
  const finalized = finalizeEnrollment(enrollmentId);
  const membershipNumber =
    finalized.status === "assigned" || finalized.status === "already_assigned"
      ? finalized.membershipNumber
      : undefined;

  const body: PaymentResponse = {
    status: "succeeded",
    enrollmentId,
    transactionId: outcome.transactionId,
    amountCents: price.amountCents,
    currency: price.currency,
    membershipNumber,
  };
  return NextResponse.json(body, { status: 200 });
}
