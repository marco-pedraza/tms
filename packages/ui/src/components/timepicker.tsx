import {
  type ChangeEvent,
  type ComponentProps,
  type MouseEvent,
  useState,
} from 'react';
import { type VariantProps } from 'class-variance-authority';
import { Clock, X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Input, inputVariants } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Text } from './text';

interface TimepickerProps
  extends Omit<ComponentProps<'input'>, 'type'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  staticLabel?: boolean;
  feedback?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Timepicker component built on top of the Input component
 *
 * Uses custom time selector with Popover while maintaining
 * all Input functionality including floating labels and descriptions
 */
function Timepicker({
  className,
  staticLabel = false,
  label,
  feedback,
  placeholder = 'Select time',
  defaultValue,
  value,
  onChange,
  variant,
  disabled,
  ...props
}: TimepickerProps) {
  const [open, setOpen] = useState(false);

  // Get current time value from props
  const currentValue = value ?? defaultValue ?? '';

  // Parse current value to get hour, minute, and AM/PM
  const parseTime = (timeStr: string) => {
    if (!timeStr) {
      return { hour: null, minute: null, isAM: true };
    }

    const [hours, minutes] = timeStr.split(':');
    if (!hours || !minutes) {
      return { hour: null, minute: null, isAM: true };
    }

    const hour24 = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const isAM = hour24 < 12;
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

    return { hour: hour12, minute, isAM };
  };

  const {
    hour: selectedHour,
    minute: selectedMinute,
    isAM,
  } = parseTime(currentValue);

  // Calculate if floating label should be visible (no state needed)
  const shouldShowFloatingLabel =
    label && (staticLabel || open || currentValue.length > 0);

  const buildTimeString = (hour: number, minute: number, am: boolean) => {
    const hour24 = am ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleReset = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (onChange) {
      onChange({
        target: { value: '' },
      } as ChangeEvent<HTMLInputElement>);
    }
  };

  const handleHourSelect = (hour: number) => {
    if (!onChange) return;

    // Use current values or defaults when starting fresh
    const minute = selectedMinute !== null ? selectedMinute : 0;
    const am = isAM;
    const timeString = buildTimeString(hour, minute, am);

    onChange({
      target: { value: timeString },
    } as ChangeEvent<HTMLInputElement>);
  };

  const handleMinuteSelect = (minute: number) => {
    if (!onChange) return;

    // Use current hour or default to 12 when starting fresh
    const hour = selectedHour !== null ? selectedHour : 12;
    const am = isAM;
    const timeString = buildTimeString(hour, minute, am);

    onChange({
      target: { value: timeString },
    } as ChangeEvent<HTMLInputElement>);
  };

  const handleAMPMToggle = (am: boolean) => {
    if (!onChange) return;

    // Use current values or defaults when starting fresh
    const hour = selectedHour !== null ? selectedHour : 12;
    const minute = selectedMinute !== null ? selectedMinute : 0;
    const timeString = buildTimeString(hour, minute, am);

    onChange({
      target: { value: timeString },
    } as ChangeEvent<HTMLInputElement>);
  };

  const formatTimeForDisplay = (time: string) => {
    if (!time) return '';

    // Convert 24h format to 12h format for display
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return '';

    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';

    return `${hour12}:${minutes} ${ampm}`;
  };

  const displayValue = formatTimeForDisplay(currentValue);

  // Generate hour options (1-12)
  const generateHourOptions = () => {
    const options = [];
    for (let hour = 1; hour <= 12; hour++) {
      options.push(hour);
    }
    return options;
  };

  // Generate minute options (every 5 minutes)
  const generateMinuteOptions = () => {
    const options = [];
    for (let minute = 0; minute < 60; minute += 5) {
      options.push(minute);
    }
    return options;
  };

  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

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
                // Time-specific styling adjustments
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
            <div className="absolute right-3 top-2.5 flex items-center">
              {currentValue && !disabled && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer mr-1"
                  aria-label="Clear time"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="rounded-xl w-auto p-0">
          <div className="bg-background rounded-xl p-3">
            {/* AM/PM Toggle */}
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => handleAMPMToggle(true)}
                className={cn(
                  'px-4 py-2 text-sm rounded-md transition-colors',
                  'focus:outline-none',
                  'flex-1',
                  isAM
                    ? 'bg-accent text-white font-bold hover:bg-accent focus:bg-accent'
                    : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100',
                )}
              >
                AM
              </button>
              <button
                onClick={() => handleAMPMToggle(false)}
                className={cn(
                  'px-4 py-2 text-sm rounded-md transition-colors',
                  'focus:outline-none',
                  'flex-1',
                  !isAM
                    ? 'bg-accent text-white font-bold hover:bg-accent focus:bg-accent'
                    : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100',
                )}
              >
                PM
              </button>
            </div>

            {/* Hour and Minute Selectors */}
            <div className="flex gap-4">
              {/* Hour Selector */}
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Hour</div>
                <div className="grid grid-cols-3 gap-1">
                  {hourOptions.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => handleHourSelect(hour)}
                      className={cn(
                        'px-2 py-1 text-sm rounded-md border-1 border-dashed border-white transition-colors',
                        'hover:bg-gray-100 focus:bg-accent/15 focus:text-accent focus:outline-none focus:border-accent',
                        'flex items-center justify-center min-w-[32px] min-h-[28px]',
                        'font-medium', // Use consistent font weight
                        selectedHour === hour
                          ? 'bg-accent/15 text-accent font-semibold'
                          : 'text-gray-700',
                      )}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px bg-gray-200 self-stretch"></div>

              {/* Minute Selector */}
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Minute</div>
                <div className="grid grid-cols-3 gap-1">
                  {minuteOptions.map((minute) => (
                    <button
                      key={minute}
                      onClick={() => handleMinuteSelect(minute)}
                      className={cn(
                        'px-2 py-1 text-sm rounded-md border-1 border-dashed border-white transition-colors',
                        'hover:bg-gray-100 focus:bg-accent/15 focus:text-accent focus:outline-none focus:border-accent',
                        'flex items-center justify-center min-w-[32px] min-h-[28px]',
                        'font-medium', // Use consistent font weight
                        selectedMinute === minute
                          ? 'bg-accent/15 text-accent font-semibold'
                          : 'text-gray-700',
                      )}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
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

export { Timepicker };
