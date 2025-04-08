import { cities } from './cities.schema';
import type {
  City,
  CreateCityPayload,
  UpdateCityPayload,
  PaginatedCities,
} from './cities.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

/**
 * Creates a repository for managing city entities
 * @returns {Object} An object containing city-specific operations and base CRUD operations
 */
export const createCityRepository = () => {
  const baseRepository = createBaseRepository<
    City,
    CreateCityPayload,
    UpdateCityPayload,
    typeof cities
  >(db, cities, 'City');

  /**
   * Creates a new city
   * @param data - The city data to create
   * @returns The created city
   */
  const create = async (data: CreateCityPayload): Promise<City> => {
    return baseRepository.create(data);
  };

  /**
   * Updates a city
   * @param id - The ID of the city to update
   * @param data - The city data to update
   * @returns The updated city
   */
  const update = async (id: number, data: UpdateCityPayload): Promise<City> => {
    return baseRepository.update(id, data);
  };

  /**
   * Lists cities with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of cities
   */
  const listPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedCities> => {
    return baseRepository.findAllPaginated(params);
  };

  return {
    ...baseRepository,
    create,
    update,
    findAllPaginated: listPaginated,
  };
};

// Export the city repository instance
export const cityRepository = createCityRepository();
