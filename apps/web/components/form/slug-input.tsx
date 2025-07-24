import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

type OmittedInputProps = 'id' | 'name' | 'value' | 'onChange' | 'aria-invalid';

interface SlugInputProps
  extends Omit<React.ComponentProps<'input'>, OmittedInputProps> {
  label: string;
  description?: string;
  isRequired?: boolean;
}

export default function SlugInput({
  label,
  description,
  isRequired = false,
  ...inputProps
}: SlugInputProps) {
  const field = useFieldContext<string>();

  /**
   * Formats a string into a slug, replacing spaces with dashes,
   * uppercasing all letters, and removing non-alphanumeric characters except dashes.
   * Example: "It works now" -> "IT-WORKS-NOW"
   */
  function formatSlug(value: string): string {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatSlug(e.target.value);
    field.handleChange(formattedValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={handleChange}
        aria-invalid={hasFieldErrors(field)}
        {...inputProps}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {hasFieldErrors(field) &&
        field.state.meta.errors.map((error) => (
          <p key={error.message} className="text-sm text-red-500">
            {error.message}
          </p>
        ))}
    </div>
  );
}
