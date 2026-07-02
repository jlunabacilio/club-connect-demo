// Lightweight client-side validation for the sign-up form.
// Errors are returned as a flat map keyed by dotted field paths
// (e.g. "individual.email", "payment.card.cvc") so each input can
// look up its own message.

import type { PaymentMethodType, SignupFormData } from "@/types/membership";

export type FormErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d][\d\s()-]{6,}$/;
// MM/YY with month 01-12.
const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;

function required(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}

/** Digits only, ignoring spaces and dashes used for readability. */
function digitsOnly(value: string): string {
  return value.replace(/[\s-]/g, "");
}

function validateAddress(
  prefix: string,
  address: SignupFormData["individual"]["address"],
  errors: FormErrors,
): void {
  const street = required(address.street, "Street");
  if (street) errors[`${prefix}.street`] = street;

  const city = required(address.city, "City");
  if (city) errors[`${prefix}.city`] = city;

  const state = required(address.state, "State/Province");
  if (state) errors[`${prefix}.state`] = state;

  const postalCode = required(address.postalCode, "Postal code");
  if (postalCode) errors[`${prefix}.postalCode`] = postalCode;

  const country = required(address.country, "Country");
  if (country) errors[`${prefix}.country`] = country;
}

function validateEmail(
  path: string,
  value: string,
  errors: FormErrors,
): void {
  const missing = required(value, "Email");
  if (missing) {
    errors[path] = missing;
  } else if (!EMAIL_RE.test(value.trim())) {
    errors[path] = "Enter a valid email address.";
  }
}

function validatePhone(
  path: string,
  value: string,
  errors: FormErrors,
): void {
  const missing = required(value, "Phone");
  if (missing) {
    errors[path] = missing;
  } else if (!PHONE_RE.test(value.trim())) {
    errors[path] = "Enter a valid phone number.";
  }
}

function validatePayment(
  type: PaymentMethodType,
  payment: SignupFormData["payment"],
  errors: FormErrors,
): void {
  if (type === "bank_transfer") {
    const holder = required(payment.bank.accountHolder, "Account holder");
    if (holder) errors["payment.bank.accountHolder"] = holder;

    const account = required(payment.bank.accountNumber, "Account number");
    if (account) errors["payment.bank.accountNumber"] = account;
    return;
  }

  // Credit / debit card.
  const name = required(payment.card.cardholderName, "Cardholder name");
  if (name) errors["payment.card.cardholderName"] = name;

  const number = digitsOnly(payment.card.cardNumber);
  if (!number) {
    errors["payment.card.cardNumber"] = "Card number is required.";
  } else if (!/^\d{13,19}$/.test(number)) {
    errors["payment.card.cardNumber"] = "Enter a valid card number.";
  }

  if (!payment.card.expiry.trim()) {
    errors["payment.card.expiry"] = "Expiry is required.";
  } else if (!EXPIRY_RE.test(payment.card.expiry.trim())) {
    errors["payment.card.expiry"] = "Use MM/YY format.";
  }

  const cvc = digitsOnly(payment.card.cvc);
  if (!cvc) {
    errors["payment.card.cvc"] = "CVC is required.";
  } else if (!/^\d{3,4}$/.test(cvc)) {
    errors["payment.card.cvc"] = "Enter a valid CVC.";
  }
}

/** Validate the whole form and return a map of field path -> message. */
export function validateSignupForm(data: SignupFormData): FormErrors {
  const errors: FormErrors = {};

  if (data.membershipType === "individual") {
    const p = data.individual;
    const firstName = required(p.firstName, "First name");
    if (firstName) errors["individual.firstName"] = firstName;

    const lastName = required(p.lastName, "Last name");
    if (lastName) errors["individual.lastName"] = lastName;

    validateEmail("individual.email", p.email, errors);
    validatePhone("individual.phone", p.phone, errors);

    const dob = required(p.dateOfBirth, "Date of birth");
    if (dob) {
      errors["individual.dateOfBirth"] = dob;
    } else if (new Date(p.dateOfBirth) > new Date()) {
      errors["individual.dateOfBirth"] = "Date of birth cannot be in the future.";
    }

    validateAddress("individual.address", p.address, errors);
  } else {
    const b = data.business;
    const companyName = required(b.companyName, "Company name");
    if (companyName) errors["business.companyName"] = companyName;

    const taxId = required(b.taxId, "Tax ID");
    if (taxId) errors["business.taxId"] = taxId;

    const contactFirst = required(b.contactFirstName, "Contact first name");
    if (contactFirst) errors["business.contactFirstName"] = contactFirst;

    const contactLast = required(b.contactLastName, "Contact last name");
    if (contactLast) errors["business.contactLastName"] = contactLast;

    validateEmail("business.email", b.email, errors);
    validatePhone("business.phone", b.phone, errors);
    validateAddress("business.address", b.address, errors);
  }

  validatePayment(data.payment.type, data.payment, errors);

  return errors;
}
