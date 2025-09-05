import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { chromatics } from '@/inventory/fleet/chromatics/chromatics.schema';
import type {
  Chromatic,
  CreateChromaticPayload,
  UpdateChromaticPayload,
} from './chromatics.types';

/**
 * Creates a repository for managing chromatic entities
 */
export function createChromaticRepository() {
  const baseRepository = createBaseRepository<
    Chromatic,
    CreateChromaticPayload,
    UpdateChromaticPayload,
    typeof chromatics
  >(db, chromatics, 'Chromatic', {
    searchableFields: [chromatics.name],
    softDeleteEnabled: true,
  });

  return baseRepository;
}

export const chromaticsRepository = createChromaticRepository();
