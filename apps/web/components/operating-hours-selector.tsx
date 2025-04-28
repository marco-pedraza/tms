'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { terminals } from '@repo/ims-client';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils/cn';

type TimeSlot = terminals.TimeSlot;

// Simplified type for 24-hour time format
interface TimeValue {
  hour: string;
  minute: string;
}

interface TimePickerProps {
  value: TimeValue;
  onChange: (field: keyof TimeValue, value: string) => void;
  disabled?: boolean;
  label: string;
}

interface OperatingHoursSelectorProps {
  day: string;
  timeSlots?: TimeSlot[];
  onChange: (timeSlots: TimeSlot[] | undefined) => void;
  dayLabel: string;
}

// Constants - Updated for 24-hour format
const DEFAULT_OPEN_TIME: TimeValue = { hour: '09', minute: '00' };
const DEFAULT_CLOSE_TIME: TimeValue = { hour: '18', minute: '00' };
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0'),
);
const MINUTES = ['00', '15', '30', '45'];

/**
 * Time picker component with hours and minutes in 24h format
 */
function TimePicker({
  value,
  onChange,
  disabled = false,
  label,
}: TimePickerProps) {
  const t = useTranslations('terminals.operatingHours');

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center space-x-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select
          value={value.hour}
          onValueChange={(value: string) => {
            onChange('hour', value);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder={t('timeSelectors.hour')} />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((hour) => (
              <SelectItem key={`${label}-hour-${hour}`} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          value={value.minute}
          onValueChange={(value: string) => {
            onChange('minute', value);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder={t('timeSelectors.minute')} />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((minute) => (
              <SelectItem key={`${label}-min-${minute}`} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Extracts TimeValue from HH:MM format
 */
function parseTimeFromString(
  timeString: string,
  defaultValue: TimeValue,
): TimeValue {
  try {
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (match?.length && match?.[1] && match?.[2]) {
      return {
        hour: match[1].padStart(2, '0'),
        minute: match[2],
      };
    }
  } catch {
    // Fallback to default value
  }

  return defaultValue;
}

/**
 * Formats TimeValue to string in 24h format
 */
function formatTimeToString(time: TimeValue): string {
  return `${time.hour}:${time.minute}`;
}

/**
 * Creates a TimeSlot from time values
 */
function createTimeSlot(openTime: TimeValue, closeTime: TimeValue): TimeSlot {
  return {
    open: formatTimeToString(openTime),
    close: formatTimeToString(closeTime),
  };
}

/**
 * Main component for selecting operating hours
 */
export function OperatingHoursSelector({
  day,
  timeSlots = [],
  onChange,
  dayLabel,
}: OperatingHoursSelectorProps) {
  const t = useTranslations('terminals.operatingHours');

  // Reference to prevent updates on first render
  const initialRender = useRef(true);

  // Determine initial state based on timeSlots
  const is24Hours =
    timeSlots.length === 1 &&
    timeSlots[0]?.open === '00:00' &&
    timeSlots[0]?.close === '23:59';
  const isClosed = timeSlots.length === 0;

  // States
  const [is24HoursState, setIs24Hours] = useState(is24Hours);
  const [isClosedState, setIsClosed] = useState(isClosed);

  // Get default time values from first slot if available
  const getDefaultTimeValues = () => {
    if (timeSlots && timeSlots.length > 0 && !is24Hours && !isClosed) {
      const firstSlot = timeSlots[0];
      if (firstSlot?.open && firstSlot.close) {
        return {
          open: parseTimeFromString(
            firstSlot.open as string,
            DEFAULT_OPEN_TIME,
          ),
          close: parseTimeFromString(
            firstSlot.close as string,
            DEFAULT_CLOSE_TIME,
          ),
        };
      }
    }
    return { open: DEFAULT_OPEN_TIME, close: DEFAULT_CLOSE_TIME };
  };

  const defaultTimes = getDefaultTimeValues();

  // Initialize opening and closing time states
  const [openTime, setOpenTime] = useState<TimeValue>(defaultTimes.open);
  const [closeTime, setCloseTime] = useState<TimeValue>(defaultTimes.close);

  // Time change handlers with parent value update
  const handleOpenTimeChange = (field: keyof TimeValue, newValue: string) => {
    setOpenTime((prev) => {
      const updated = { ...prev, [field]: newValue };

      // Only update parent value if not initial render
      if (!initialRender.current && !is24HoursState && !isClosedState) {
        setTimeout(() => {
          onChange([createTimeSlot(updated, closeTime)]);
        }, 0);
      }

      return updated;
    });
  };

  const handleCloseTimeChange = (field: keyof TimeValue, newValue: string) => {
    setCloseTime((prev) => {
      const updated = { ...prev, [field]: newValue };

      // Only update parent value if not initial render
      if (!initialRender.current && !is24HoursState && !isClosedState) {
        setTimeout(() => {
          onChange([createTimeSlot(openTime, updated)]);
        }, 0);
      }

      return updated;
    });
  };

  // Special state change handlers
  const handle24HoursChange = (checked: boolean) => {
    setIs24Hours(checked);

    if (checked) {
      setIsClosed(false);
      // Set 24 hours as 00:00-23:59
      onChange([{ open: '00:00', close: '23:59' }]);
    } else if (!initialRender.current) {
      onChange([createTimeSlot(openTime, closeTime)]);
    }
  };

  const handleClosedChange = (checked: boolean) => {
    setIsClosed(checked);

    if (checked) {
      setIs24Hours(false);
      // Closed means no time slots
      onChange(undefined);
    } else if (!initialRender.current) {
      onChange([createTimeSlot(openTime, closeTime)]);
    }
  };

  // Mark that initial render has passed
  useEffect(() => {
    initialRender.current = false;
  }, []);

  const timeSelectorDisabled = is24HoursState || isClosedState;

  return (
    <div className="grid grid-cols-[1fr_3fr] gap-4 items-start">
      <Label htmlFor={`hours-${day}`} className="capitalize pt-2">
        {dayLabel}
      </Label>

      <div className="space-y-3">
        {/* Special state switches */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Switch
              id={`24hours-${day}`}
              checked={is24HoursState}
              onCheckedChange={handle24HoursChange}
            />
            <Label htmlFor={`24hours-${day}`} className="text-sm font-normal">
              {t('open24hours')}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id={`closed-${day}`}
              checked={isClosedState}
              onCheckedChange={handleClosedChange}
            />
            <Label htmlFor={`closed-${day}`} className="text-sm font-normal">
              {t('closed')}
            </Label>
          </div>
        </div>

        {/* Time selectors */}
        <div
          className={cn(
            'grid grid-cols-2 gap-2',
            timeSelectorDisabled && 'opacity-50 pointer-events-none',
          )}
        >
          <TimePicker
            value={openTime}
            onChange={handleOpenTimeChange}
            disabled={timeSelectorDisabled}
            label={t('openingTime')}
          />

          <TimePicker
            value={closeTime}
            onChange={handleCloseTimeChange}
            disabled={timeSelectorDisabled}
            label={t('closingTime')}
          />
        </div>
      </div>
    </div>
  );
}
