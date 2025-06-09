import { formOptions } from '@tanstack/react-form';
import { Hours, Minutes } from '@/types/time';
import {
  OperatingHours,
  TerminalFormRawValues,
  editTerminalSchema,
} from './terminal-form-schemas';

export const defaultOperatingHours: OperatingHours = {
  is24Hours: false,
  isClosed: false,
  open: {
    hour: Hours._09,
    minute: Minutes._00,
  },
  close: {
    hour: Hours._17,
    minute: Minutes._00,
  },
};

export const fallbackValues: TerminalFormRawValues = {
  name: '',
  address: '',
  code: '',
  latitude: '',
  cityId: '',
  longitude: '',
  contactPhone: '',
  active: true,
  operatingHours: {
    monday: defaultOperatingHours,
    tuesday: defaultOperatingHours,
    wednesday: defaultOperatingHours,
    thursday: defaultOperatingHours,
    friday: defaultOperatingHours,
    saturday: defaultOperatingHours,
    sunday: defaultOperatingHours,
  },
  facilities: [],
};

export default formOptions({
  defaultValues: fallbackValues,
  validators: {
    onChange: editTerminalSchema,
  },
});
