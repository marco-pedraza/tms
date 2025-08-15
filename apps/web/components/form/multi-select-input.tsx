import { useState } from 'react';
import { Label } from '@radix-ui/react-label';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFieldContext } from '@/context/form-context';
import hasFieldErrors from '@/utils/has-field-errors';

interface SelectItem {
  id: string;
  name: string;
  color?: string;
}

interface MultiSelectInputProps {
  label: string;
  placeholder: string;
  items: SelectItem[];
  description?: string;
  isRequired?: boolean;
  emptyOptionsLabel?: string;
}

export default function MultiSelectInput({
  label,
  placeholder,
  items,
  description,
  isRequired = false,
  emptyOptionsLabel,
}: MultiSelectInputProps) {
  const field = useFieldContext<number[]>();
  const [isOpen, setIsOpen] = useState(false);

  const selectedItems = items.filter((item) =>
    field.state.value?.includes(parseInt(item.id)),
  );

  const handleItemChange = (itemId: string, checked: boolean) => {
    const currentValues = field.state.value || [];
    const numericId = parseInt(itemId);

    if (checked) {
      field.handleChange([...currentValues, numericId]);
    } else {
      field.handleChange(currentValues.filter((id) => id !== numericId));
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            aria-invalid={hasFieldErrors(field)}
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedItems.slice(0, 3).map((item, index, arr) => (
                    <div key={item.id} className="flex items-center gap-1">
                      {item.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span className="text-sm">
                        {item.name}
                        {!item.color && index < arr.length - 1 && ', '}
                      </span>
                    </div>
                  ))}
                  {selectedItems.length > 3 && (
                    <span className="text-sm text-muted-foreground">
                      +{selectedItems.length - 3} more
                    </span>
                  )}
                </div>
              )}
              {selectedItems.length === 0 && (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)]">
          {emptyOptionsLabel && !items.length && (
            <div className="p-2 text-sm text-muted-foreground">
              {emptyOptionsLabel}
            </div>
          )}
          {items.map((item) => (
            <DropdownMenuCheckboxItem
              key={item.id}
              checked={field.state.value?.includes(parseInt(item.id)) || false}
              onCheckedChange={(checked: boolean) =>
                handleItemChange(item.id, checked)
              }
              onSelect={(event: Event) => event.preventDefault()}
              className="flex items-center gap-2"
            >
              {item.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {item.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
