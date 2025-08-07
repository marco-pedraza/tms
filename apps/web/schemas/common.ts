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

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9][\d\s()-]{1,20}$/)
  .optional();
