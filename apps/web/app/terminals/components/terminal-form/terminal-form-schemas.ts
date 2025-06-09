import { z } from 'zod';
import { latitudeSchema, longitudeSchema, phoneSchema } from '@/schemas/common';
import { Hours, Minutes } from '@/types/time';

const MIN_CODE_LENGTH = 2;
const MAX_CODE_LENGTH = 20;

const timeFormatSchema = z
  .object({
    hour: z.nativeEnum(Hours),
    minute: z.nativeEnum(Minutes),
  })
  .transform((val) => `${val.hour}:${val.minute}`);

const timeSlotSchema = z.object({
  is24Hours: z.boolean(),
  isClosed: z.boolean(),
  open: timeFormatSchema,
  close: timeFormatSchema,
});

const facilitiesSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});

// Validation schema for terminal form
export const editTerminalSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  cityId: z
    .string()
    .min(1)
    .transform((val) => parseInt(val)),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  contactPhone: phoneSchema,
  code: z.string().min(MIN_CODE_LENGTH).max(MAX_CODE_LENGTH),
  active: z.boolean(),
  operatingHours: z.object({
    monday: timeSlotSchema,
    tuesday: timeSlotSchema,
    wednesday: timeSlotSchema,
    thursday: timeSlotSchema,
    friday: timeSlotSchema,
    saturday: timeSlotSchema,
    sunday: timeSlotSchema,
  }),
  facilities: z.array(facilitiesSchema),
});

export type TerminalFormValues = z.output<typeof editTerminalSchema>;
export type TerminalFormRawValues = z.input<typeof editTerminalSchema>;
export type OperatingHours = z.input<typeof timeSlotSchema>;
