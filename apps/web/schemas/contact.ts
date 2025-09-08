import { z } from 'zod';
import { UseValidationsTranslationsResult } from '@/types/translations';

export function phoneSchema(tValidations: UseValidationsTranslationsResult) {
  return z
    .string()
    .trim()
    .transform((val) => val.replace(/[^\d+]/g, ''))
    .refine((val) => val.length === 0 || /^\+[1-9]\d{1,14}$/.test(val), {
      message: tValidations('phone.invalid'),
    });
}

export function emailSchema(tValidations: UseValidationsTranslationsResult) {
  return z.union([
    z
      .string()
      .email()
      .refine(() => true, { message: tValidations('email.invalid') }),
    z.literal(''),
  ]);
}
