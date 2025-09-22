import { UTCDate } from '@date-fns/utc';
import { formatISO } from 'date-fns';
import z from 'zod';
import { UseValidationsTranslationsResult } from '@/types/translations';

export function requiredDateSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return z
    .string()
    .min(1, { message: tValidations('required') })
    .transform((val) =>
      formatISO(new UTCDate(val), { representation: 'date' }),
    );
}

export function optionalDateSchema() {
  return z
    .string()
    .transform((val) =>
      val ? formatISO(new UTCDate(val), { representation: 'date' }) : null,
    );
}
