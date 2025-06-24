import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { populations } from './populations.schema';
import type {
  CreatePopulationPayload,
  Population,
  UpdatePopulationPayload,
} from './populations.types';

/**
 * Creates a repository for managing population entities
 * @returns {Object} An object containing population-specific operations and base CRUD operations
 */
export function createPopulationRepository() {
  const baseRepository = createBaseRepository<
    Population,
    CreatePopulationPayload,
    UpdatePopulationPayload,
    typeof populations
  >(db, populations, 'Population', {
    searchableFields: [populations.name, populations.code],
    softDeleteEnabled: true,
  });

  return baseRepository;
}

// Export the population repository instance
export const populationRepository = createPopulationRepository();
