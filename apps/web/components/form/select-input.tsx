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
  hidden?: boolean;
}

export interface SelectInputProps
  extends Omit<React.ComponentProps<'select'>, OmittedSelectProps> {
  label: string;
  placeholder: string;
  items: SelectItem[];
  description?: string;
  isRequired?: boolean;
  emptyOptionsLabel?: string;
}

export default function SelectInput({
  label,
  placeholder,
  items,
  description,
  isRequired = false,
  emptyOptionsLabel,
  ...inputProps
}: SelectInputProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      {/* @ts-expect-error - inputProps may contain defaultValue with number type but Select expects string */}
      <Select
        value={field.state.value ?? ''}
        onValueChange={field.handleChange}
        {...inputProps}
      >
        <SelectTrigger aria-invalid={hasFieldErrors(field)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyOptionsLabel && !items.length && (
            <SelectItem
              key="empty-list-label"
              value="empty-list-label"
              disabled
            >
              {emptyOptionsLabel}
            </SelectItem>
          )}
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id} hidden={item.hidden}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
