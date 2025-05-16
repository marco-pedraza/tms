import { z } from 'zod';

/**
 * Common validation schemas for use across the application
 */

// Name validation - for resources that require a human-readable name
export const nameSchema = z
  .string()
  .min(1)
  .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/);

// Uppercase code validation with configurable length
export const codeSchema = (minLength = 2, maxLength = 2) =>
  z
    .string()
    .min(minLength)
    .max(maxLength)
    .regex(/^[A-Z]+$/);

// Latitude validation schema
export const latitudeSchema = z
  .string()
  .min(1)
  .refine((val) => !isNaN(parseFloat(val)))
  .refine((val) => {
    const num = parseFloat(val);
    return num >= -90 && num <= 90;
  })
  .transform((val) => parseFloat(val));

// Longitude validation schema
export const longitudeSchema = z
  .string()
  .min(1)
  .refine((val) => !isNaN(parseFloat(val)))
  .refine((val) => {
    const num = parseFloat(val);
    return num >= -180 && num <= 180;
  })
  .transform((val) => parseFloat(val));

// Time format schema for 24-hour time (HH:MM)
const timeFormatSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);

// Time slot schema for operating hours
const timeSlotSchema = z.object({
  open: timeFormatSchema,
  close: timeFormatSchema,
});

export const operatingHoursSchema = z.object({
  monday: z.array(timeSlotSchema).optional(),
  tuesday: z.array(timeSlotSchema).optional(),
  wednesday: z.array(timeSlotSchema).optional(),
  thursday: z.array(timeSlotSchema).optional(),
  friday: z.array(timeSlotSchema).optional(),
  saturday: z.array(timeSlotSchema).optional(),
  sunday: z.array(timeSlotSchema).optional(),
});

const facilitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const facilitiesSchema = z.array(facilitySchema);

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9][\d\s()-]{1,20}$/)
  .optional();
