import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFieldContext } from '@/context/form-context';

interface SwitchInputProps {
  label: string;
  description?: string;
}

export default function SwitchInput({ label, description }: SwitchInputProps) {
  const field = useFieldContext<boolean>();
  return (
    <div className="space-x-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor={field.name}>{label}</Label>
        <Switch
          id={field.name}
          checked={field.state.value}
          onCheckedChange={field.handleChange}
        />
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
