import { randomUUID } from "node:crypto";
import type { PaymentMethodType } from "@/types/membership";

// Mock payment gateway.
//
// This stands in for a real processor (Stripe, Adyen, …). It exposes a small
// async interface so the API route doesn't care about the implementation —
// swapping in a real gateway later only touches this file.
//
// Card outcomes are driven by well-known test numbers so both the success and
// failure paths can be exercised deterministically:
//   4242 4242 4242 4242  -> succeeds
//   4000 0000 0000 0002  -> declined (generic)
//   4000 0000 0000 9995  -> insufficient funds
//   4000 0000 0000 0069  -> expired card
// Any other syntactically-valid card number also succeeds.

export interface ProcessPaymentInput {
  method: PaymentMethodType;
  amountCents: number;
  currency: string;
  /** Present for credit_card / debit_card. Digits only or spaced. */
  cardNumber?: string;
}

export type GatewayOutcome =
  | { status: "succeeded"; transactionId: string }
  | { status: "failed"; errorCode: string; errorMessage: string };

const DECLINE_MAP: Record<string, { code: string; message: string }> = {
  "4000000000000002": {
    code: "card_declined",
    message: "Your card was declined. Please try a different payment method.",
  },
  "4000000000009995": {
    code: "insufficient_funds",
    message: "The card has insufficient funds.",
  },
  "4000000000000069": {
    code: "expired_card",
    message: "The card has expired.",
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processPayment(
  input: ProcessPaymentInput,
): Promise<GatewayOutcome> {
  // Simulate network/processing latency.
  await delay(700);

  if (input.method === "bank_transfer") {
    // Bank transfers are accepted as initiated in this demo.
    return { status: "succeeded", transactionId: `txn_${randomUUID()}` };
  }

  const digits = (input.cardNumber ?? "").replace(/\D/g, "");
  const decline = DECLINE_MAP[digits];
  if (decline) {
    return {
      status: "failed",
      errorCode: decline.code,
      errorMessage: decline.message,
    };
  }

  return { status: "succeeded", transactionId: `txn_${randomUUID()}` };
}
