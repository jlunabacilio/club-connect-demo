// Shared domain types for the member sign-up flow.
// These are reused across upcoming subtasks (ID verification, payment,
// membership number generation, confirmation email).

export type MembershipType = "individual" | "business";

export type PaymentMethodType = "credit_card" | "debit_card" | "bank_transfer";

/** Postal address used by both individual and business applicants. */
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/** Card details captured when the payment method is a credit/debit card. */
export interface CardDetails {
  cardholderName: string;
  cardNumber: string;
  /** Expiry in MM/YY format. */
  expiry: string;
  cvc: string;
}

/** Bank details captured when the payment method is a bank transfer. */
export interface BankDetails {
  accountHolder: string;
  /** IBAN / CLABE / account number depending on region. */
  accountNumber: string;
}

export interface PaymentMethod {
  type: PaymentMethodType;
  card: CardDetails;
  bank: BankDetails;
}

/** Personal data for an individual applicant. */
export interface IndividualData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: Address;
}

/** Personal + company data for a business applicant. */
export interface BusinessData {
  companyName: string;
  taxId: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  address: Address;
}

/** The full payload captured by the sign-up form. */
export interface SignupFormData {
  membershipType: MembershipType;
  individual: IndividualData;
  business: BusinessData;
  payment: PaymentMethod;
}

export const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  individual: "Individual",
  business: "Business",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  credit_card: "Credit card",
  debit_card: "Debit card",
  bank_transfer: "Bank transfer",
};

const emptyAddress: Address = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

/** A blank form used to initialize component state. */
export function emptySignupForm(): SignupFormData {
  return {
    membershipType: "individual",
    individual: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      address: { ...emptyAddress },
    },
    business: {
      companyName: "",
      taxId: "",
      contactFirstName: "",
      contactLastName: "",
      email: "",
      phone: "",
      address: { ...emptyAddress },
    },
    payment: {
      type: "credit_card",
      card: { cardholderName: "", cardNumber: "", expiry: "", cvc: "" },
      bank: { accountHolder: "", accountNumber: "" },
    },
  };
}
