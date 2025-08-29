import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { pathwayOptionTolls } from './pathway-options-tolls.schema';
import type {
  CreatePathwayOptionTollPayload,
  PathwayOptionToll,
  UpdatePathwayOptionTollPayload,
} from './pathway-options-tolls.types';

/**
 * Creates a repository for managing pathway option toll entities
 */
export function createPathwayOptionTollRepository() {
  const baseRepository = createBaseRepository<
    PathwayOptionToll,
    CreatePathwayOptionTollPayload,
    UpdatePathwayOptionTollPayload,
    typeof pathwayOptionTolls
  >(db, pathwayOptionTolls, 'PathwayOptionToll', {
    softDeleteEnabled: true,
  });

  return {
    ...baseRepository,
  };
}

export const pathwayOptionTollRepository = createPathwayOptionTollRepository();
