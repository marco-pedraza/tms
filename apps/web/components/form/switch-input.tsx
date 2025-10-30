import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFieldContext } from '@/context/form-context';

interface BaseSwitchInputProps {
  name: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function BaseSwitchInput({
  label,
  description,
  name,
  value,
  onChange,
  disabled,
}: BaseSwitchInputProps) {
  return (
    <div className="space-x-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor={name}>{label}</Label>
        <Switch
          id={name}
          checked={value}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>

      {description && (
        <p className="pt-4 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
interface SwitchInputProps {
  label: string;
  description?: string;
  disabled?: boolean;
}

export default function SwitchInput({
  label,
  description,
  disabled,
}: SwitchInputProps) {
  const field = useFieldContext<boolean>();
  return (
    <BaseSwitchInput
      label={label}
      description={description}
      name={field.name}
      value={field.state.value}
      onChange={field.handleChange}
      disabled={disabled}
    />
  );
}
