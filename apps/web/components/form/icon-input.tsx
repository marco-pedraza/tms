import { Label } from '@radix-ui/react-label';
import IconSelector from '@/components/icon-selector';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

interface IconInputProps {
  label: string;
  description?: string;
  isRequired?: boolean;
  placeholder?: string;
}

/**
 * Form input component for selecting Lucide icons
 */
export default function IconInput({
  label,
  description,
  isRequired = false,
  placeholder,
}: IconInputProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <IconSelector
        value={field.state.value}
        onValueChange={field.handleChange}
        placeholder={placeholder}
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
