import type {
  BusinessData,
  IndividualData,
  MembershipType,
} from "@/types/membership";
import type { FormErrors } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { AddressFields } from "./AddressFields";

interface PersonalDataSectionProps {
  membershipType: MembershipType;
  individual: IndividualData;
  business: BusinessData;
  errors: FormErrors;
  onChange: (path: string, value: string) => void;
}

/** Renders personal/company fields depending on the membership type. */
export function PersonalDataSection({
  membershipType,
  individual,
  business,
  errors,
  onChange,
}: PersonalDataSectionProps) {
  if (membershipType === "individual") {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            name="individual.firstName"
            value={individual.firstName}
            error={errors["individual.firstName"]}
            onChange={(e) => onChange("individual.firstName", e.target.value)}
            autoComplete="given-name"
            required
          />
          <TextField
            label="Last name"
            name="individual.lastName"
            value={individual.lastName}
            error={errors["individual.lastName"]}
            onChange={(e) => onChange("individual.lastName", e.target.value)}
            autoComplete="family-name"
            required
          />
          <TextField
            label="Email"
            type="email"
            name="individual.email"
            value={individual.email}
            error={errors["individual.email"]}
            onChange={(e) => onChange("individual.email", e.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            label="Phone"
            type="tel"
            name="individual.phone"
            value={individual.phone}
            error={errors["individual.phone"]}
            onChange={(e) => onChange("individual.phone", e.target.value)}
            autoComplete="tel"
            required
          />
          <TextField
            label="Date of birth"
            type="date"
            name="individual.dateOfBirth"
            value={individual.dateOfBirth}
            error={errors["individual.dateOfBirth"]}
            onChange={(e) => onChange("individual.dateOfBirth", e.target.value)}
            autoComplete="bday"
            required
          />
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-semibold text-slate-700">
            Address
          </legend>
          <AddressFields
            prefix="individual.address"
            value={individual.address}
            errors={errors}
            onChange={onChange}
          />
        </fieldset>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Company name"
          name="business.companyName"
          value={business.companyName}
          error={errors["business.companyName"]}
          onChange={(e) => onChange("business.companyName", e.target.value)}
          autoComplete="organization"
          required
        />
        <TextField
          label="Tax ID"
          name="business.taxId"
          value={business.taxId}
          error={errors["business.taxId"]}
          onChange={(e) => onChange("business.taxId", e.target.value)}
          required
        />
        <TextField
          label="Contact first name"
          name="business.contactFirstName"
          value={business.contactFirstName}
          error={errors["business.contactFirstName"]}
          onChange={(e) =>
            onChange("business.contactFirstName", e.target.value)
          }
          autoComplete="given-name"
          required
        />
        <TextField
          label="Contact last name"
          name="business.contactLastName"
          value={business.contactLastName}
          error={errors["business.contactLastName"]}
          onChange={(e) => onChange("business.contactLastName", e.target.value)}
          autoComplete="family-name"
          required
        />
        <TextField
          label="Email"
          type="email"
          name="business.email"
          value={business.email}
          error={errors["business.email"]}
          onChange={(e) => onChange("business.email", e.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          label="Phone"
          type="tel"
          name="business.phone"
          value={business.phone}
          error={errors["business.phone"]}
          onChange={(e) => onChange("business.phone", e.target.value)}
          autoComplete="tel"
          required
        />
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold text-slate-700">
          Business address
        </legend>
        <AddressFields
          prefix="business.address"
          value={business.address}
          errors={errors}
          onChange={onChange}
        />
      </fieldset>
    </div>
  );
}
