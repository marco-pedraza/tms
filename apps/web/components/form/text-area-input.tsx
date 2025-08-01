import { Label } from '@radix-ui/react-label';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

type OmittedInputProps = 'id' | 'name' | 'value' | 'onChange' | 'aria-invalid';

interface TextAreaInputProps
  extends Omit<React.ComponentProps<'textarea'>, OmittedInputProps> {
  label: string;
  description?: string;
  isRequired?: boolean;
}

export default function TextAreaInput({
  label,
  description,
  isRequired = false,
  ...inputProps
}: TextAreaInputProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
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
