import { cities } from './cities.schema';
import type {
  City,
  CreateCityPayload,
  UpdateCityPayload,
  PaginatedCities,
} from './cities.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '../db-service';
import { createSlug } from '../../shared/utils';

/**
 * Creates a repository for managing city entities
 * @returns {Object} An object containing city-specific operations and base CRUD operations
 */
export const createCityRepository = () => {
  const baseRepository = createBaseRepository<
    City,
    CreateCityPayload & { slug: string },
    UpdateCityPayload & { slug?: string },
    typeof cities
  >(db, cities, 'City', {
    searchableFields: [cities.name, cities.slug],
  });

  /**
   * Creates a new city with auto-generated slug
   * @param data - The city data to create
   * @returns The created city
   */
  const create = async (data: CreateCityPayload): Promise<City> => {
    const slug = createSlug(data.name);
    return await baseRepository.create({ ...data, slug });
  };

  /**
   * Updates a city
   * @param id - The ID of the city to update
   * @param data - The city data to update
   * @returns The updated city
   */
  const update = async (id: number, data: UpdateCityPayload): Promise<City> => {
    const updateData: UpdateCityPayload & { slug?: string } = { ...data };
    if (data.name) {
      updateData.slug = createSlug(data.name);
    }
    return await baseRepository.update(id, updateData);
  };

  /**
   * Lists cities with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of cities
   */
  const listPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedCities> => {
    return await baseRepository.findAllPaginated(params);
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
