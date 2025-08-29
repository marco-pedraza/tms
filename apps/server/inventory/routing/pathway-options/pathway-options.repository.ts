import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { pathwayOptions } from './pathway-options.schema';
import type {
  CreatePathwayOptionPayload,
  PathwayOption,
  UpdatePathwayOptionPayload,
} from './pathway-options.types';

/**
 * Creates a repository for managing pathway option entities
 */
export function createPathwayOptionRepository() {
  const baseRepository = createBaseRepository<
    PathwayOption,
    CreatePathwayOptionPayload,
    UpdatePathwayOptionPayload,
    typeof pathwayOptions
  >(db, pathwayOptions, 'PathwayOption', {
    searchableFields: [pathwayOptions.name],
    softDeleteEnabled: true,
  });

  return {
    ...baseRepository,
  };
}

export const pathwayOptionRepository = createPathwayOptionRepository();
