import { z } from 'zod';
import { UseValidationsTranslationsResult } from '@/types/translations';

const baseNumberSchema = z.string().trim();

export function optionalIntegerSchema() {
  return baseNumberSchema.transform((val) => (val ? parseInt(val) : null));
}

export function requiredIntegerSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return baseNumberSchema
    .min(1, { message: tValidations('required') })
    .transform((val) => parseInt(val));
}

export function optionalFloatSchema() {
  return baseNumberSchema.transform((val) => (val ? parseFloat(val) : null));
}

export function requiredFloatSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return baseNumberSchema
    .min(1, { message: tValidations('required') })
    .transform((val) => parseFloat(val));
}
