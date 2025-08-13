import { z } from 'zod';
import { UseValidationsTranslationsResult } from '@/types/translations';

/**
 * Common validation schemas for use across the application
 */

// Name validation with translations
export function nameSchema(tValidations: UseValidationsTranslationsResult) {
  return z
    .string()
    .trim()
    .min(1, { message: tValidations('required') })
    .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
      message: tValidations('name.letters'),
    });
}

// Uppercase code validation with configurable length and translations
export function codeSchema(
  tValidations: UseValidationsTranslationsResult,
  minLength = 2,
  maxLength = 2,
) {
  const useExactLengthMessage = minLength === maxLength;

  return z
    .string()
    .min(minLength, {
      message: useExactLengthMessage
        ? tValidations('code.length', { length: minLength })
        : tValidations('code.length-range', { min: minLength, max: maxLength }),
    })
    .max(maxLength)
    .regex(/^[A-Z]+$/, {
      message: tValidations('code.uppercase'),
    });
}

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9][\d\s()-]{1,20}$/)
  .optional();
