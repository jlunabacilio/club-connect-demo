import type { SignupFormData } from "@/types/membership";

/** Derive a display name and contact email from the applicant's data. */
export function deriveApplicant(data: SignupFormData): {
  name: string;
  email: string;
} {
  if (data.membershipType === "individual") {
    return {
      name: `${data.individual.firstName} ${data.individual.lastName}`.trim(),
      email: data.individual.email.trim(),
    };
  }
  return {
    name: data.business.companyName.trim(),
    email: data.business.email.trim(),
  };
}

/**
 * Return a copy of the form safe to persist: the CVC is dropped and the card
 * number is reduced to its last 4 digits. Raw PAN/CVC must never hit storage.
 */
export function redactForStorage(data: SignupFormData): SignupFormData {
  const digits = data.payment.card.cardNumber.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return {
    ...data,
    payment: {
      ...data.payment,
      card: {
        ...data.payment.card,
        cardNumber: last4 ? `•••• ${last4}` : "",
        cvc: "",
      },
    },
  };
}
