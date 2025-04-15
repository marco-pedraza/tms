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
