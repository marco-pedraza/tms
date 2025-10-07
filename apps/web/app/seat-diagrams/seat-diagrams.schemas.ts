import { z } from 'zod';
import {
  SeatType,
  SpaceType,
  seatTypes,
  spaceTypesWithoutSeat,
} from '@/services/ims-client';
import { UseValidationsTranslationsResult } from '@/types/translations';

const baseSpaceSchema = z.object({
  floorNumber: z.number(),
  active: z.boolean(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const createSeatSpaceTypeSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  baseSpaceSchema.extend({
    spaceType: z.enum([SpaceType.SEAT]).transform((val) => val as SpaceType),
    seatType: z
      .enum(seatTypes as [string, ...string[]], {
        message: tValidations('required'),
      })
      .transform((val) => val as SeatType),
    seatNumber: z.string({ message: tValidations('required') }).min(1, {
      message: tValidations('required'),
    }),
    amenities: z
      .array(
        z.union([
          z
            .string()
            .transform((val) => (isNaN(parseInt(val)) ? '' : String(val))),
          z.number().transform((val) => String(val)),
        ]),
      )
      .default([]),
    reclinementAngle: z.union([
      z
        .string()
        .transform((val) => (isNaN(parseInt(val)) ? '' : parseInt(val))),
      z.number().transform((val) => val),
    ]),
  });

type SeatSpaceType = z.output<ReturnType<typeof createSeatSpaceTypeSchema>>;

const otherSpaceTypeSchema = (tValidations: UseValidationsTranslationsResult) =>
  baseSpaceSchema.extend({
    spaceType: z
      .enum(spaceTypesWithoutSeat as [string, ...string[]], {
        message: tValidations('required'),
      })
      .transform((val) => val as SpaceType),
  });

const createSeatDiagramSpaceSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.discriminatedUnion('spaceType', [
    createSeatSpaceTypeSchema(tValidations),
    otherSpaceTypeSchema(tValidations),
  ]);

type SeatDiagramSpace = z.output<
  ReturnType<typeof createSeatDiagramSpaceSchema>
>;

export { createSeatDiagramSpaceSchema };
export type { SeatDiagramSpace, SeatSpaceType };
