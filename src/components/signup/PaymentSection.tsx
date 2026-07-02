import type { PaymentMethod, PaymentMethodType } from "@/types/membership";
import { PAYMENT_METHOD_LABELS } from "@/types/membership";
import type { FormErrors } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";

const METHODS: PaymentMethodType[] = [
  "credit_card",
  "debit_card",
  "bank_transfer",
];

interface PaymentSectionProps {
  payment: PaymentMethod;
  errors: FormErrors;
  onTypeChange: (type: PaymentMethodType) => void;
  onChange: (path: string, value: string) => void;
}

/** Payment method selector + card/bank details.
 *  Note: details are only captured here — actual processing happens
 *  in a later subtask. */
export function PaymentSection({
  payment,
  errors,
  onTypeChange,
  onChange,
}: PaymentSectionProps) {
  const isCard = payment.type !== "bank_transfer";

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {METHODS.map((method) => {
          const selected = payment.type === method;
          return (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onTypeChange(method)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                selected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          );
        })}
      </div>

      {isCard ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label="Cardholder name"
              name="payment.card.cardholderName"
              value={payment.card.cardholderName}
              error={errors["payment.card.cardholderName"]}
              onChange={(e) =>
                onChange("payment.card.cardholderName", e.target.value)
              }
              autoComplete="cc-name"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <TextField
              label="Card number"
              name="payment.card.cardNumber"
              value={payment.card.cardNumber}
              error={errors["payment.card.cardNumber"]}
              onChange={(e) =>
                onChange("payment.card.cardNumber", e.target.value)
              }
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>
          <TextField
            label="Expiry (MM/YY)"
            name="payment.card.expiry"
            value={payment.card.expiry}
            error={errors["payment.card.expiry"]}
            onChange={(e) => onChange("payment.card.expiry", e.target.value)}
            autoComplete="cc-exp"
            placeholder="MM/YY"
            required
          />
          <TextField
            label="CVC"
            name="payment.card.cvc"
            value={payment.card.cvc}
            error={errors["payment.card.cvc"]}
            onChange={(e) => onChange("payment.card.cvc", e.target.value)}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            required
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Account holder"
            name="payment.bank.accountHolder"
            value={payment.bank.accountHolder}
            error={errors["payment.bank.accountHolder"]}
            onChange={(e) =>
              onChange("payment.bank.accountHolder", e.target.value)
            }
            required
          />
          <TextField
            label="Account number / IBAN"
            name="payment.bank.accountNumber"
            value={payment.bank.accountNumber}
            error={errors["payment.bank.accountNumber"]}
            onChange={(e) =>
              onChange("payment.bank.accountNumber", e.target.value)
            }
            required
          />
        </div>
      )}
    </div>
  );
}
