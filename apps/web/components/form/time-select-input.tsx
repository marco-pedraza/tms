import { Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/context/form-context';
import { Hours, Minutes, TimeValue } from '@/types/time';

interface TimeSelectInputProps {
  label: string;
  disabled?: boolean;
}

export default function TimeSelectInput({
  label,
  disabled = false,
}: TimeSelectInputProps) {
  const field = useFieldContext<TimeValue>();

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center space-x-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select
          value={field.state.value?.hour}
          onValueChange={(hour: Hours) => {
            field.handleChange({ ...field.state.value, hour });
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Hours).map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          value={field.state.value?.minute}
          onValueChange={(minute: Minutes) => {
            field.handleChange({ ...field.state.value, minute });
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Minutes).map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
