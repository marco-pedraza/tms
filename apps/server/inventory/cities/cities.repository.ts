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
import { createSlug } from '../../shared/utils';

type CreateCityPayloadWithSlug = CreateCityPayload & { slug: string };
type UpdateCityPayloadWithSlug = UpdateCityPayload & { slug?: string };

/**
 * Creates a repository for managing city entities
 * @returns {Object} An object containing city-specific operations and base CRUD operations
 */
export const createCityRepository = () => {
  const baseRepository = createBaseRepository<
    City,
    CreateCityPayloadWithSlug,
    UpdateCityPayloadWithSlug,
    typeof cities
  >(db, cities, 'City');

  /**
   * Creates a new city with auto-generated slug
   * @param data - The city data to create
   * @returns The created city
   */
  const create = async (data: CreateCityPayload): Promise<City> => {
    // Generate slug from the city name
    const slug = createSlug(data.name);

    // Add slug to the data and create the city
    return await baseRepository.create({
      ...data,
      slug,
    });
  };

  /**
   * Updates a city
   * @param id - The ID of the city to update
   * @param data - The city data to update
   * @returns The updated city
   */
  const update = async (id: number, data: UpdateCityPayload): Promise<City> => {
    const updateData: UpdateCityPayloadWithSlug = {
      ...data,
    };

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
