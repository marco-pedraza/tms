import { Label } from '@radix-ui/react-label';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

type OmittedInputProps = 'id' | 'name' | 'value' | 'onChange' | 'aria-invalid';

interface TextAreaInputProps
  extends Omit<React.ComponentProps<'textarea'>, OmittedInputProps> {
  label: string;
}

export default function TextAreaInput({
  label,
  ...inputProps
}: TextAreaInputProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={hasFieldErrors(field)}
        {...inputProps}
      />
    </div>
  );
}
