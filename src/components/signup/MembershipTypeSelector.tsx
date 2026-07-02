import type { MembershipType } from "@/types/membership";

interface Choice {
  value: MembershipType;
  title: string;
  description: string;
  icon: string;
}

const CHOICES: Choice[] = [
  {
    value: "individual",
    title: "Individual",
    description: "A personal membership for a single person.",
    icon: "👤",
  },
  {
    value: "business",
    title: "Business",
    description: "A membership registered under a company.",
    icon: "🏢",
  },
];

interface MembershipTypeSelectorProps {
  value: MembershipType;
  onChange: (value: MembershipType) => void;
}

/** Card-style radio group for choosing the membership type. */
export function MembershipTypeSelector({
  value,
  onChange,
}: MembershipTypeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Membership type"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {CHOICES.map((choice) => {
        const selected = value === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(choice.value)}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
              selected
                ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                : "border-slate-300 bg-white hover:border-slate-400"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {choice.icon}
            </span>
            <span className="flex flex-col">
              <span className="font-semibold text-slate-900">
                {choice.title}
              </span>
              <span className="text-sm text-slate-500">
                {choice.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
