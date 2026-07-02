import type { Address } from "@/types/membership";
import type { FormErrors } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";

interface AddressFieldsProps {
  /** Dotted path prefix, e.g. "individual.address". */
  prefix: string;
  value: Address;
  errors: FormErrors;
  onChange: (path: string, value: string) => void;
}

/** Reused address block for both individual and business applicants. */
export function AddressFields({
  prefix,
  value,
  errors,
  onChange,
}: AddressFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          label="Street address"
          name={`${prefix}.street`}
          value={value.street}
          error={errors[`${prefix}.street`]}
          onChange={(e) => onChange(`${prefix}.street`, e.target.value)}
          autoComplete="street-address"
          required
        />
      </div>
      <TextField
        label="City"
        name={`${prefix}.city`}
        value={value.city}
        error={errors[`${prefix}.city`]}
        onChange={(e) => onChange(`${prefix}.city`, e.target.value)}
        autoComplete="address-level2"
        required
      />
      <TextField
        label="State / Province"
        name={`${prefix}.state`}
        value={value.state}
        error={errors[`${prefix}.state`]}
        onChange={(e) => onChange(`${prefix}.state`, e.target.value)}
        autoComplete="address-level1"
        required
      />
      <TextField
        label="Postal code"
        name={`${prefix}.postalCode`}
        value={value.postalCode}
        error={errors[`${prefix}.postalCode`]}
        onChange={(e) => onChange(`${prefix}.postalCode`, e.target.value)}
        autoComplete="postal-code"
        required
      />
      <TextField
        label="Country"
        name={`${prefix}.country`}
        value={value.country}
        error={errors[`${prefix}.country`]}
        onChange={(e) => onChange(`${prefix}.country`, e.target.value)}
        autoComplete="country-name"
        required
      />
    </div>
  );
}
