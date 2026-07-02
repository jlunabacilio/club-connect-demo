import type { MembershipType } from "@/types/membership";

export interface Price {
  amountCents: number;
  currency: string;
}

/** Membership fees. Amounts are in minor units (cents). */
export const MEMBERSHIP_PRICING: Record<MembershipType, Price> = {
  individual: { amountCents: 4900, currency: "USD" },
  business: { amountCents: 19900, currency: "USD" },
};

export function getPrice(type: MembershipType): Price {
  return MEMBERSHIP_PRICING[type];
}

/** Format minor units as a localized currency string, e.g. 4900 -> "$49.00". */
export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}
