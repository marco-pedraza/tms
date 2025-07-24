import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

type OmittedInputProps = 'id' | 'name' | 'value' | 'onChange' | 'aria-invalid';

interface NumberInputProps
  extends Omit<React.ComponentProps<'input'>, OmittedInputProps> {
  label: string;
  description?: string;
  isRequired?: boolean;
  allowDecimals?: boolean;
}

export default function NumberInput({
  label,
  description,
  isRequired = false,
  allowDecimals = true,
  ...inputProps
}: NumberInputProps) {
  const field = useFieldContext<string>();

  function positiveNumber(value: string): string {
    if (value === '') {
      return '';
    }

    // Allow decimal numbers based on allowDecimals prop
    if (allowDecimals) {
      // Remove all non-numeric and non-dot characters first
      const cleaned = value.replace(/[^0-9.]/g, '');

      // Find the first decimal point
      const firstDotIndex = cleaned.indexOf('.');

      if (firstDotIndex === -1) {
        // No decimal point found, return as is
        return cleaned;
      }

      // Keep everything up to and including the first decimal point
      const beforeFirstDot = cleaned.substring(0, firstDotIndex + 1);

      // Get all digits after the first decimal point
      const afterFirstDot = cleaned
        .substring(firstDotIndex + 1)
        .replace(/\./g, '');

      return beforeFirstDot + afterFirstDot;
    } else {
      // Only allow digits
      return value.replace(/[^0-9]/g, '');
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={field.name}
        type="number"
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(positiveNumber(e.target.value))}
        onKeyDown={(e) => {
          if (!allowDecimals && e.key === '.') {
            e.preventDefault();
          }
        }}
        aria-invalid={hasFieldErrors(field)}
        {...inputProps}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {hasFieldErrors(field) && (
        <>
          {field.state.meta.errors.map((error) => (
            <p key={error.message} className="text-sm text-red-500">
              {error.message}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
