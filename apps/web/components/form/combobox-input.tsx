'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { SelectInputProps } from '@/components/form/select-input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useFieldContext } from '@/context/form-context';
import { cn } from '@/utils/cn';
import hasFieldErrors from '@/utils/has-field-errors';

export function ComboboxInput({
  label,
  placeholder,
  items,
  description,
  isRequired = false,
  disabled = false,
  emptyOptionsLabel,
  searchPlaceholder,
  noResultsLabel,
}: SelectInputProps & {
  searchPlaceholder: string;
  noResultsLabel: string;
}) {
  const field = useFieldContext<string>();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            disabled={disabled}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={hasFieldErrors(field)}
            className={cn(
              'justify-between font-normal',
              !field.state.value && 'text-muted-foreground',
            )}
          >
            {field.state.value
              ? items.find((item) => item.id === field.state.value)?.name
              : placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="h-9" />
            <CommandList>
              <CommandEmpty>
                {items.length === 0 ? emptyOptionsLabel : noResultsLabel}
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={(itemName: string) => {
                      const currentValue = items.find(
                        (item) => item.name === itemName,
                      )?.id;
                      field.handleChange(
                        currentValue === field.state.value
                          ? ''
                          : (currentValue ?? ''),
                      );
                      setOpen(false);
                    }}
                  >
                    {item.name}
                    <Check
                      className={cn(
                        'ml-auto',
                        field.state.value === item.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
