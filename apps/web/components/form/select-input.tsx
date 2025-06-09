import { Label } from '@radix-ui/react-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

type OmittedSelectProps = 'id' | 'name' | 'value' | 'onChange' | 'aria-invalid';

interface SelectItem {
  id: string;
  name: string;
}

interface SelectInputProps
  extends Omit<React.ComponentProps<'select'>, OmittedSelectProps> {
  label: string;
  placeholder: string;
  items: SelectItem[];
}

export default function SelectInput({
  label,
  placeholder,
  items,
  ...inputProps
}: SelectInputProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Select
        value={field.state.value ?? ''}
        onValueChange={field.handleChange}
        {...inputProps}
      >
        <SelectTrigger aria-invalid={hasFieldErrors(field)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
