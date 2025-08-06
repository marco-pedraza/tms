'use client';

import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Represents a time slot with opening and closing times
 */
export interface TimeSlot {
  /** Opening time in HH:MM format */
  open: string;
  /** Closing time in HH:MM format */
  close: string;
}

/**
 * Operating hours configuration for each day of the week
 * Each day can have a single time slot or multiple time slots
 */
export interface OperatingHours {
  monday?: TimeSlot | TimeSlot[];
  tuesday?: TimeSlot | TimeSlot[];
  wednesday?: TimeSlot | TimeSlot[];
  thursday?: TimeSlot | TimeSlot[];
  friday?: TimeSlot | TimeSlot[];
  saturday?: TimeSlot | TimeSlot[];
  sunday?: TimeSlot | TimeSlot[];
}

interface OperatingHoursFormProps {
  value?: OperatingHours | null;
  onChange: (value: OperatingHours | null) => void;
  errors?: string[];
}

const DAYS_OF_WEEK = [
  { key: 'monday' },
  { key: 'tuesday' },
  { key: 'wednesday' },
  { key: 'thursday' },
  { key: 'friday' },
  { key: 'saturday' },
  { key: 'sunday' },
] as const;

/**
 * Form component for managing operating hours for each day of the week
 * Supports closed, 24-hour, and custom time slots per day
 * Allows multiple time slots per day
 */
export default function OperatingHoursForm({
  value = null,
  onChange,
  errors,
}: OperatingHoursFormProps) {
  const tNodes = useTranslations('nodes');
  const tCommon = useTranslations('common');

  const handleDayChange = (
    day: keyof OperatingHours,
    newValue: TimeSlot | TimeSlot[] | null,
  ) => {
    const currentValue = value ?? {};
    const updatedValue = {
      ...currentValue,
      [day]: newValue ?? undefined,
    };
    onChange(updatedValue);
  };

  const handle24Hours = (day: keyof OperatingHours) => {
    const timeSlot: TimeSlot = { open: '00:00', close: '23:59' };
    handleDayChange(day, timeSlot);
  };

  const handleClosed = (day: keyof OperatingHours) => {
    handleDayChange(day, null);
  };

  const handleCustomHours = (day: keyof OperatingHours, timeSlot: TimeSlot) => {
    handleDayChange(day, timeSlot);
  };

  const addTimeSlot = (day: keyof OperatingHours) => {
    const currentValue = value?.[day];
    const newTimeSlot: TimeSlot = { open: '', close: '' };

    const newValue = !currentValue
      ? newTimeSlot
      : Array.isArray(currentValue)
        ? [...currentValue, newTimeSlot]
        : [currentValue, newTimeSlot]; // Convert single slot to array

    handleDayChange(day, newValue);
  };

  const removeTimeSlot = (day: keyof OperatingHours, index: number) => {
    const currentValue = value?.[day];
    if (!currentValue) return;

    // Single slot - remove it
    if (!Array.isArray(currentValue)) {
      handleDayChange(day, null);
      return;
    }

    const updatedSlots = currentValue.filter((_, i) => i !== index);
    const newValue =
      updatedSlots.length === 0
        ? null
        : updatedSlots.length === 1
          ? updatedSlots[0] || null
          : updatedSlots;

    handleDayChange(day, newValue);
  };

  const updateTimeSlot = (
    day: keyof OperatingHours,
    index: number,
    updatedSlot: TimeSlot,
  ) => {
    const currentValue = value?.[day];
    if (!currentValue) return;

    const newValue = Array.isArray(currentValue)
      ? currentValue.map((slot, i) => (i === index ? updatedSlot : slot))
      : updatedSlot; // Single slot

    handleDayChange(day, newValue);
  };

  const getDayStatus = (day: keyof OperatingHours) => {
    const dayValue = value?.[day];

    // Early return for no value
    if (!dayValue) return 'closed';

    // Handle array of time slots
    if (Array.isArray(dayValue)) {
      return dayValue.length > 0 ? 'custom' : 'closed';
    }

    // Check if it's 24 hours
    if (dayValue.open === '00:00' && dayValue.close === '23:59') {
      return '24hours';
    }

    // Return 'custom' if it has the required properties, otherwise 'closed'
    return 'open' in dayValue && 'close' in dayValue ? 'custom' : 'closed';
  };

  const getDayTimeSlots = (day: keyof OperatingHours): TimeSlot[] => {
    const dayValue = value?.[day];
    return !dayValue ? [] : Array.isArray(dayValue) ? dayValue : [dayValue];
  };

  return (
    <div className="space-y-4">
      {errors && errors.length > 0 && (
        <div className="space-y-2" role="alert" aria-live="polite">
          {errors.map((errorMessage, index) => (
            <div
              key={index}
              className="text-sm text-destructive"
              aria-describedby={`error-${index}`}
            >
              {errorMessage}
            </div>
          ))}
        </div>
      )}

      {DAYS_OF_WEEK.map(({ key }) => {
        const status = getDayStatus(key);
        const timeSlots = getDayTimeSlots(key);

        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {tCommon(`days.${key}`)}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={status === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handleClosed(key);
                  }}
                >
                  {tNodes('fields.operatingHours.closed')}
                </Button>
                <Button
                  type="button"
                  variant={status === '24hours' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handle24Hours(key);
                  }}
                >
                  {tNodes('fields.operatingHours.24hours')}
                </Button>
                <Button
                  type="button"
                  variant={status === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (status !== 'custom') {
                      handleCustomHours(key, { open: '08:00', close: '18:00' });
                    }
                  }}
                >
                  {tNodes('fields.operatingHours.custom')}
                </Button>
              </div>
            </div>

            {status === 'custom' && (
              <div className="space-y-3">
                {timeSlots.map((timeSlot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50/50"
                  >
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 min-w-[60px]">
                        {tNodes('fields.operatingHours.open')}:
                      </Label>
                      <Input
                        type="time"
                        value={timeSlot.open}
                        onChange={(e) => {
                          updateTimeSlot(key, index, {
                            ...timeSlot,
                            open: e.target.value,
                          });
                        }}
                        className="w-24"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 min-w-[60px]">
                        {tNodes('fields.operatingHours.close')}:
                      </Label>
                      <Input
                        type="time"
                        value={timeSlot.close}
                        onChange={(e) => {
                          updateTimeSlot(key, index, {
                            ...timeSlot,
                            close: e.target.value,
                          });
                        }}
                        className="w-24"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeTimeSlot(key, index);
                      }}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    addTimeSlot(key);
                  }}
                  className="w-fit"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {tNodes('fields.operatingHours.addTimeSlot')}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { DAYS_OF_WEEK };
