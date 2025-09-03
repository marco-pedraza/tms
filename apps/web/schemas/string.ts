import { z } from 'zod';
import { UseValidationsTranslationsResult } from '@/types/translations';

const baseStringSchema = z.string().trim();

export function optionalStringSchema() {
  return baseStringSchema.transform((val) => val || null);
}

export function requiredStringSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return baseStringSchema.min(1, { message: tValidations('required') });
}
