// Types shared between the payment API route and the client.

export type PaymentStatus = "succeeded" | "failed";

/** Successful payment confirmation returned to the client. */
export interface PaymentSuccess {
  status: "succeeded";
  enrollmentId: string;
  transactionId: string;
  amountCents: number;
  currency: string;
  /**
   * Set when the enrollment was already approved at payment time, so the
   * membership number is issued immediately. Otherwise it's assigned later,
   * when approval completes.
   */
  membershipNumber?: string;
}

/** Failed payment outcome returned to the client (HTTP 402). */
export interface PaymentFailure {
  status: "failed";
  enrollmentId: string;
  errorCode: string;
  errorMessage: string;
}

/** Validation error response (HTTP 400). */
export interface PaymentValidationError {
  status: "invalid";
  errors: Record<string, string>;
}

export type PaymentResponse =
  | PaymentSuccess
  | PaymentFailure
  | PaymentValidationError;
