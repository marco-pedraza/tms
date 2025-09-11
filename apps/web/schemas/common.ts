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
    .trim()
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

/**
 * Alphanumeric code validation with uppercase letters, hyphens, and numbers
 * @param tValidations - Translation functions for validation messages
 * @param config - Configuration object with minLength and maxLength
 * @returns Zod schema for alphanumeric codes
 */
export function alphanumericCodeSchema(
  tValidations: UseValidationsTranslationsResult,
  { minLength = 2, maxLength = 10 } = {},
) {
  const useExactLengthMessage = minLength === maxLength;

  return z
    .string()
    .trim()
    .min(minLength, {
      message: useExactLengthMessage
        ? tValidations('code.length', { length: minLength })
        : tValidations('code.length-range', { min: minLength, max: maxLength }),
    })
    .max(maxLength)
    .regex(/^[A-Z0-9-]+$/, {
      message: tValidations('code.alphanumeric'),
    });
}
