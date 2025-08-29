import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { pathways } from './pathways.schema';
import type {
  CreatePathwayPayload,
  Pathway,
  UpdatePathwayPayload,
} from './pathways.types';

export function createPathwayRepository() {
  const baseRepository = createBaseRepository<
    Pathway,
    CreatePathwayPayload,
    UpdatePathwayPayload,
    typeof pathways
  >(db, pathways, 'Pathway', {
    searchableFields: [pathways.name, pathways.code],
    softDeleteEnabled: true,
  });

  return {
    ...baseRepository,
  };
}

export const pathwayRepository = createPathwayRepository();
