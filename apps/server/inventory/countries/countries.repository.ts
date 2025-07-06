import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { countries } from './countries.schema';
import type {
  Country,
  CreateCountryPayload,
  UpdateCountryPayload,
} from './countries.types';

/**
 * Creates a repository for managing country entities
 * @returns {Object} An object containing country-specific operations and base CRUD operations
 */
export const createCountryRepository = () => {
  const baseRepository = createBaseRepository<
    Country,
    CreateCountryPayload,
    UpdateCountryPayload,
    typeof countries
  >(db, countries, 'Country', {
    searchableFields: [countries.name, countries.code],
    softDeleteEnabled: true,
    checkDependenciesOnSoftDelete: true,
  });

  return baseRepository;
};

// Export the country repository instance
export const countryRepository = createCountryRepository();
