import { z } from 'zod';
import {
  optionalFloatSchema,
  requiredFloatSchema,
  requiredIntegerSchema,
} from '@/schemas/number';
import { UseValidationsTranslationsResult } from '@/types/translations';
import { optionalStringSchema, requiredStringSchema } from './string';

/**
 * Backend → Frontend (default values) for a Toll
 */
export const tollDefaultValuesSchema = z.object({
  id: z.coerce.number().optional(),
  nodeId: z.coerce.number().default(0),
  passTimeMin: z.coerce.string().default(''),
  distance: z.coerce.string().default(''),
});

/**
 * Frontend → Backend (validation) Toll schema
 */
export function createTollSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return z.object({
    id: z.coerce.number().optional(),
    nodeId: requiredIntegerSchema(tValidations),
    passTimeMin: requiredFloatSchema(tValidations),
    distance: requiredFloatSchema(tValidations),
  });
}

/**
 * Backend → Frontend (default values) for a Pathway Option
 */
export const pathwayOptionDefaultValuesSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.coerce.string().default(''),
  description: z.coerce.string().default(''),
  distanceKm: z.coerce.string().default(''),
  typicalTimeMin: z.coerce.string().default(''),
  avgSpeedKmh: z.coerce.string().default(''),
  isPassThrough: z.boolean().default(false),
  passThroughTimeMin: z.coerce.string().default(''),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
  tolls: z.array(tollDefaultValuesSchema),
});

/**
 * Frontend → Backend (validation) Pathway Option schema
 */
export function createPathwayOptionSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return z
    .object({
      id: z.coerce.number().optional(),
      name: requiredStringSchema(tValidations),
      description: optionalStringSchema(),
      distanceKm: requiredFloatSchema(tValidations),
      typicalTimeMin: requiredFloatSchema(tValidations),
      avgSpeedKmh: requiredFloatSchema(tValidations),
      isDefault: z.boolean(),
      isPassThrough: z.boolean(),
      passThroughTimeMin: optionalFloatSchema(),
      active: z.boolean(),
      tolls: z.array(createTollSchema(tValidations)).optional(),
    })
    .refine(
      (data) => {
        if (data.isPassThrough && data.passThroughTimeMin === null) {
          return false;
        }
        return true;
      },
      {
        message: tValidations('required'),
        path: ['passThroughTimeMin'],
      },
    );
}

/**
 * Frontend → Backend (validation) for creating a list of Pathway Options
 */
export function createPathwayOptionsSchema(
  tValidations: UseValidationsTranslationsResult,
) {
  return z.object({
    options: z
      .array(createPathwayOptionSchema(tValidations))
      .min(1, { message: tValidations('required') }),
  });
}

export type Toll = z.output<ReturnType<typeof createTollSchema>>;
export type PathwayOption = z.output<
  ReturnType<typeof createPathwayOptionSchema>
>;
export type PathwayOptionsFormValues = z.output<
  ReturnType<typeof createPathwayOptionsSchema>
>;
export type TollRaw = z.input<ReturnType<typeof createTollSchema>>;
export type PathwayOptionRaw = z.input<
  ReturnType<typeof createPathwayOptionSchema>
>;
