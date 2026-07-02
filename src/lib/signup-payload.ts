// Backend handling for the untrusted sign-up payload.
//
// The client posts arbitrary JSON, so we cannot cast it to SignupFormData and
// trust it. This module safely parses `unknown` into a normalized, typed form:
//   - guards the overall shape and every nested object,
//   - coerces non-string fields to "" (so required-checks catch them instead
//     of crashing on `.trim()` of undefined),
//   - validates the two enums (membership type, payment method) explicitly,
//   - keeps only known fields (drops any injected/extra keys),
//   - then runs the shared field-level rules.

import { emptySignupForm } from "@/types/membership";
import type {
  Address,
  MembershipType,
  PaymentMethodType,
  SignupFormData,
} from "@/types/membership";
import { validateSignupForm, type FormErrors } from "@/lib/validation";

const MEMBERSHIP_TYPES: readonly MembershipType[] = ["individual", "business"];
const PAYMENT_TYPES: readonly PaymentMethodType[] = [
  "credit_card",
  "debit_card",
  "bank_transfer",
];

export type ParsedSignup =
  | { ok: true; data: SignupFormData }
  | { ok: false; errors: FormErrors };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Coerce any value to a trimmed string; non-strings become "". */
function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapAddress(raw: unknown): Address {
  const a = isRecord(raw) ? raw : {};
  return {
    street: asString(a.street),
    city: asString(a.city),
    state: asString(a.state),
    postalCode: asString(a.postalCode),
    country: asString(a.country),
  };
}

/**
 * Parse and validate an untrusted sign-up payload.
 * Returns the normalized data on success, or a map of field errors.
 */
export function parseSignupPayload(input: unknown): ParsedSignup {
  const errors: FormErrors = {};
  const raw = isRecord(input) ? input : {};
  const data = emptySignupForm();

  // Membership type (enum) — drives which personal-details branch is required.
  const membershipType = asString(raw.membershipType) as MembershipType;
  if (MEMBERSHIP_TYPES.includes(membershipType)) {
    data.membershipType = membershipType;
  } else {
    errors["membershipType"] = "Select a valid membership type.";
  }

  // Personal details (individual).
  const ind = isRecord(raw.individual) ? raw.individual : {};
  data.individual = {
    firstName: asString(ind.firstName),
    lastName: asString(ind.lastName),
    email: asString(ind.email),
    phone: asString(ind.phone),
    dateOfBirth: asString(ind.dateOfBirth),
    address: mapAddress(ind.address),
  };

  // Company details (business).
  const biz = isRecord(raw.business) ? raw.business : {};
  data.business = {
    companyName: asString(biz.companyName),
    taxId: asString(biz.taxId),
    contactFirstName: asString(biz.contactFirstName),
    contactLastName: asString(biz.contactLastName),
    email: asString(biz.email),
    phone: asString(biz.phone),
    address: mapAddress(biz.address),
  };

  // Payment method (enum) + its details.
  const pay = isRecord(raw.payment) ? raw.payment : {};
  const paymentType = asString(pay.type) as PaymentMethodType;
  if (PAYMENT_TYPES.includes(paymentType)) {
    data.payment.type = paymentType;
  } else {
    errors["payment.type"] = "Select a valid payment method.";
  }

  const card = isRecord(pay.card) ? pay.card : {};
  data.payment.card = {
    cardholderName: asString(card.cardholderName),
    // Card number keeps internal spaces; only outer whitespace is trimmed.
    cardNumber: asString(card.cardNumber),
    expiry: asString(card.expiry),
    cvc: asString(card.cvc),
  };

  const bank = isRecord(pay.bank) ? pay.bank : {};
  data.payment.bank = {
    accountHolder: asString(bank.accountHolder),
    accountNumber: asString(bank.accountNumber),
  };

  // Field-level rules (email/phone/card format, required fields, DOB, …).
  const fieldErrors = validateSignupForm(data);
  const allErrors = { ...fieldErrors, ...errors };

  if (Object.keys(allErrors).length > 0) {
    return { ok: false, errors: allErrors };
  }
  return { ok: true, data };
}
