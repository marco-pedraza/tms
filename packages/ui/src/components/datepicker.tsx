import {
  type ChangeEvent,
  type ComponentProps,
  type MouseEvent,
  useState,
} from 'react';
import { type VariantProps } from 'class-variance-authority';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Calendar } from './calendar';
import { Input, inputVariants } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Text } from './text';

interface DatepickerProps
  extends Omit<ComponentProps<'input'>, 'type'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  staticLabel?: boolean;
  feedback?: string;
}

/**
 * Datepicker component built on top of the Input component
 *
 * Uses custom Calendar with Popover while maintaining
 * all Input functionality including floating labels and descriptions
 */
function Datepicker({
  className,
  staticLabel = false,
  label,
  feedback,
  variant,
  disabled,
  value,
  onChange,
  placeholder = 'Select a date',
  ...props
}: DatepickerProps) {
  const [open, setOpen] = useState(false);

  // Parse date string to Date object in local timezone
  const parseDateString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;

    // Parse YYYY-MM-DD in local timezone to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return undefined;

    return new Date(year, month - 1, day);
  };

  // Get selected date from props
  const currentValue = typeof value === 'string' ? value : '';
  const selectedDate = parseDateString(currentValue);

  // Calculate if floating label should be visible (no state needed)
  const shouldShowFloatingLabel =
    label && (staticLabel || open || !!selectedDate);

  const handleDateSelect = (date: Date | undefined) => {
    setOpen(false);

    // Call onChange with the formatted date string
    if (onChange && date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange({
        target: { value: formattedDate },
      } as ChangeEvent<HTMLInputElement>);
    }
  };

  const handleReset = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onChange) {
      onChange({
        target: { value: '' },
      } as ChangeEvent<HTMLInputElement>);
    }
  };

  const displayValue = selectedDate ? format(selectedDate, 'MMM dd, yyyy') : '';

  const floatingLabelElement = label && (
    <label
      className={cn(
        'absolute -top-3 left-3 bg-white px-1 text-sm font-medium transition-all duration-200 z-10',
        disabled ? 'text-gray-400' : 'text-gray-500',
        shouldShowFloatingLabel ? 'opacity-100' : 'opacity-0',
      )}
    >
      {label}
    </label>
  );

  return (
    <div className={cn('relative w-full')}>
      {floatingLabelElement}
      <Popover
        open={disabled ? false : open}
        onOpenChange={disabled ? undefined : setOpen}
      >
        <PopoverTrigger asChild disabled={disabled}>
          <div>
            <Input
              type="text"
              className={cn(
                // Date-specific styling adjustments
                disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                'pr-10', // Add padding for icon
                className,
              )}
              staticLabel={staticLabel}
              label={label}
              variant={variant}
              disabled={disabled}
              value={displayValue}
              placeholder={placeholder}
              readOnly
              data-popover-open={open}
              {...props}
            />
            <div className="absolute right-3 top-3 flex items-center space-x-1">
              {selectedDate && !disabled && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label="Clear date"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="rounded-2xl">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {feedback && (
        <Text variant="sm" italic textColor="destructive" className="mt-2">
          * {feedback}
        </Text>
      )}
    </div>
  );
}

export { Datepicker };
