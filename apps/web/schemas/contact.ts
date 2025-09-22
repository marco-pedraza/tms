import { z } from 'zod';
import { UseValidationsTranslationsResult } from '@/types/translations';

export function optionalPhoneSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return z
    .string()
    .trim()
    .transform((val) => val.replace(/[^\d+]/g, ''))
    .refine((val) => val.length === 0 || /^\+[1-9]\d{1,14}$/.test(val), {
      message: tValidations('phone.invalid'),
    })
    .transform((val) => (val === '' ? null : val));
}

export function optionalEmailSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return z
    .union([z.email({ message: tValidations('email.invalid') }), z.literal('')])
    .transform((val) => (val === '' ? null : val));
}

export function optionalUrlSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return z
    .union([z.url({ message: tValidations('url.invalid') }), z.literal('')])
    .transform((val) => (val === '' ? null : val));
}
