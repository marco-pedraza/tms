import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

type OmittedInputProps = 'id' | 'name' | 'value' | 'onChange' | 'aria-invalid';

interface TextInputProps
  extends Omit<React.ComponentProps<'input'>, OmittedInputProps> {
  label: string;
}

export default function TextInput({ label, ...inputProps }: TextInputProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
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
