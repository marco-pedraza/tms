import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { pathways } from './pathways.schema';
import type {
  CreatePathwayPayload,
  Pathway,
  UpdatePathwayPayload,
} from './pathways.types';

export const createPathwayRepository = () => {
  const baseRepository = createBaseRepository<
    Pathway,
    CreatePathwayPayload,
    UpdatePathwayPayload,
    typeof pathways
  >(db, pathways, 'Pathway');

  return {
    ...baseRepository,
  };
};

export const pathwayRepository = createPathwayRepository();
