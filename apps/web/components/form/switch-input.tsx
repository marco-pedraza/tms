import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFieldContext } from '@/context/form-context';

interface SwitchInputProps {
  label: string;
}

export default function SwitchInput({ label }: SwitchInputProps) {
  const field = useFieldContext<boolean>();
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
      />
      <Label htmlFor={field.name}>{label}</Label>
    </div>
  );
}
