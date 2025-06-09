import { Hours, Minutes } from '@/types/time';
import { DaysOfWeek } from '@/types/time';
import type { TerminalFormProps } from './terminal-form';
import type {
  OperatingHours,
  TerminalFormRawValues,
} from './terminal-form-schemas';

export default function toRawOperatingHours(
  defaultValues: TerminalFormProps['defaultValues'],
  defaultOperatingHours: OperatingHours,
) {
  return function (
    acc: TerminalFormRawValues['operatingHours'],
    day: DaysOfWeek,
  ) {
    const slot = defaultValues?.operatingHours?.[day];
    if (!slot) {
      acc[day] = defaultOperatingHours;
    } else {
      const is24Hours = slot.open === '00:00' && slot.close === '23:59';
      const isClosed = slot.open === '00:00' && slot.close === '00:00';
      acc[day] = {
        is24Hours,
        isClosed,
        open: {
          hour: (slot.open.split(':')[0] || Hours._00) as Hours,
          minute: (slot.open.split(':')[1] || Minutes._00) as Minutes,
        },
        close: {
          hour: (slot.close.split(':')[0] || Hours._00) as Hours,
          minute: (slot.close.split(':')[1] || Minutes._00) as Minutes,
        },
      };
    }
    return acc;
  };
}
