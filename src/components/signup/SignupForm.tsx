"use client";

import { useState } from "react";
import {
  emptySignupForm,
  MEMBERSHIP_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type MembershipType,
  type PaymentMethodType,
  type SignupFormData,
} from "@/types/membership";
import type { PaymentResponse, PaymentSuccess } from "@/types/payment";
import { validateSignupForm, type FormErrors } from "@/lib/validation";
import { getPrice, formatMoney } from "@/lib/payment/pricing";
import { MembershipTypeSelector } from "./MembershipTypeSelector";
import { PersonalDataSection } from "./PersonalDataSection";
import { PaymentSection } from "./PaymentSection";

type Phase = "form" | "review" | "processing" | "success" | "failed";

interface Failure {
  code: string;
  message: string;
}

/** Immutably set a nested value on the form using a dotted path. */
function setByPath(
  data: SignupFormData,
  path: string,
  value: string,
): SignupFormData {
  const keys = path.split(".");
  const next: Record<string, unknown> = { ...data };
  let cursor = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    cursor[key] = { ...(cursor[key] as Record<string, unknown>) };
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return next as unknown as SignupFormData;
}

interface SectionProps {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ step, title, description, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {step}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function SignupForm() {
  const [data, setData] = useState<SignupFormData>(emptySignupForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [success, setSuccess] = useState<PaymentSuccess | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const update = (path: string, value: string) => {
    setData((prev) => setByPath(prev, path, value));
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const setMembershipType = (membershipType: MembershipType) => {
    setData((prev) => ({ ...prev, membershipType }));
    setErrors({});
  };

  const setPaymentType = (type: PaymentMethodType) => {
    setData((prev) => ({ ...prev, payment: { ...prev.payment, type } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateSignupForm(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstField = Object.keys(validationErrors)[0];
      document
        .querySelector(`[name="${firstField}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setPhase("review");
  };

  const handlePay = async () => {
    setPhase("processing");
    setFailure(null);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json()) as PaymentResponse;

      if (body.status === "succeeded") {
        setSuccess(body);
        setPhase("success");
      } else if (body.status === "failed") {
        setFailure({ code: body.errorCode, message: body.errorMessage });
        setPhase("failed");
      } else {
        // Validation error — shouldn't normally happen after client checks.
        setErrors(body.errors);
        setPhase("form");
      }
    } catch {
      setFailure({
        code: "network_error",
        message:
          "We couldn't reach the payment service. Check your connection and try again.",
      });
      setPhase("failed");
    }
  };

  const price = getPrice(data.membershipType);

  if (phase === "success" && success) {
    return <SuccessScreen data={data} result={success} />;
  }

  if (phase === "review" || phase === "processing" || phase === "failed") {
    return (
      <ReviewAndPay
        data={data}
        priceLabel={formatMoney(price.amountCents, price.currency)}
        processing={phase === "processing"}
        failure={phase === "failed" ? failure : null}
        onPay={handlePay}
        onEdit={() => {
          setFailure(null);
          setPhase("form");
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Section
        step={1}
        title="Membership type"
        description="Choose the kind of membership you want to enroll in."
      >
        <MembershipTypeSelector
          value={data.membershipType}
          onChange={setMembershipType}
        />
      </Section>

      <Section
        step={2}
        title={
          data.membershipType === "individual"
            ? "Personal information"
            : "Company information"
        }
        description="We use this to create your membership profile."
      >
        <PersonalDataSection
          membershipType={data.membershipType}
          individual={data.individual}
          business={data.business}
          errors={errors}
          onChange={update}
        />
      </Section>

      <Section
        step={3}
        title="Payment method"
        description={`Membership fee: ${formatMoney(
          price.amountCents,
          price.currency,
        )}. Your card is not charged until you confirm.`}
      >
        <PaymentSection
          payment={data.payment}
          errors={errors}
          onTypeChange={setPaymentType}
          onChange={update}
        />
      </Section>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 sm:w-auto sm:self-end"
        >
          Review &amp; pay
        </button>
      </div>
    </form>
  );
}

interface ReviewAndPayProps {
  data: SignupFormData;
  priceLabel: string;
  processing: boolean;
  failure: Failure | null;
  onPay: () => void;
  onEdit: () => void;
}

function ReviewAndPay({
  data,
  priceLabel,
  processing,
  failure,
  onPay,
  onEdit,
}: ReviewAndPayProps) {
  const rows: [string, string][] =
    data.membershipType === "individual"
      ? [
          ["Name", `${data.individual.firstName} ${data.individual.lastName}`],
          ["Email", data.individual.email],
          ["Phone", data.individual.phone],
          ["Date of birth", data.individual.dateOfBirth],
        ]
      : [
          ["Company", data.business.companyName],
          ["Tax ID", data.business.taxId],
          [
            "Contact",
            `${data.business.contactFirstName} ${data.business.contactLastName}`,
          ],
          ["Email", data.business.email],
          ["Phone", data.business.phone],
        ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Review your details
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          {MEMBERSHIP_TYPE_LABELS[data.membershipType]} membership ·{" "}
          {PAYMENT_METHOD_LABELS[data.payment.type]}
        </p>
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-2 text-sm"
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-900">{value || "—"}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-2 text-sm">
            <dt className="text-slate-500">Total due</dt>
            <dd className="font-semibold text-slate-900">{priceLabel}</dd>
          </div>
        </dl>
      </div>

      {failure && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"
        >
          <span className="text-lg text-rose-500" aria-hidden>
            ✕
          </span>
          <div>
            <p className="font-semibold text-rose-800">Payment failed</p>
            <p className="text-sm text-rose-700">{failure.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-start">
        <button
          type="button"
          onClick={onPay}
          disabled={processing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden
            />
          )}
          {processing
            ? "Processing…"
            : failure
              ? `Retry payment · ${priceLabel}`
              : `Pay ${priceLabel}`}
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={processing}
          className="text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-60"
        >
          ← Edit information
        </button>
      </div>
    </div>
  );
}

interface SuccessScreenProps {
  data: SignupFormData;
  result: PaymentSuccess;
}

function SuccessScreen({ data, result }: SuccessScreenProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
          ✓
        </span>
        <h2 className="text-xl font-semibold text-slate-900">
          Payment confirmed
        </h2>
      </div>
      <p className="mb-4 text-sm text-slate-600">
        We&apos;ve received your{" "}
        {MEMBERSHIP_TYPE_LABELS[data.membershipType].toLowerCase()} membership
        payment. A receipt reference is below.
      </p>
      <dl className="divide-y divide-slate-100">
        <div className="flex justify-between gap-4 py-2 text-sm">
          <dt className="text-slate-500">Amount paid</dt>
          <dd className="font-semibold text-slate-900">
            {formatMoney(result.amountCents, result.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-2 text-sm">
          <dt className="text-slate-500">Transaction ID</dt>
          <dd className="font-mono text-xs text-slate-700">
            {result.transactionId}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-2 text-sm">
          <dt className="text-slate-500">Enrollment ID</dt>
          <dd className="font-mono text-xs text-slate-700">
            {result.enrollmentId}
          </dd>
        </div>
      </dl>
      <div className="mt-6 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
        Next: your membership number will be generated and a confirmation email
        sent (coming in a following step).
      </div>
    </div>
  );
}
