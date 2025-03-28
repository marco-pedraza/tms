import { cities } from './cities.schema';
import type {
  City,
  CreateCityPayload,
  UpdateCityPayload,
  PaginatedCities,
} from './cities.types';
import { createBaseRepository } from '../../shared/base-repository';
import { stateRepository } from '../states/states.repository';
import { PaginationParams } from '../../shared/types';

const DEFAULT_ERROR_MESSAGE = 'City with this slug already exists';
const DEFAULT_SORT_BY = 'name';
const DEFAULT_SORT_DIRECTION = 'asc';

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
  >(cities, 'City');

  /**
   * Validates that a state exists in the database
   * @param stateId - The ID of the state to validate
   */
  const validateStateExists = async (stateId: number): Promise<void> => {
    await stateRepository.findOne(stateId);
  };

  /**
   * Validates that a slug is unique
   * @param slug - The slug to validate
   */
  const validateUniqueSlug = async (slug: string): Promise<void> => {
    await baseRepository.validateUniqueness(
      [{ field: cities.slug, value: slug }],
      undefined,
      DEFAULT_ERROR_MESSAGE,
    );
  };

  /**
   * Creates a new city with state validation
   * @param data - The city data to create
   * @returns The created city
   */
  const create = async (data: CreateCityPayload): Promise<City> => {
    await validateStateExists(data.stateId);
    await validateUniqueSlug(data.slug);

    return baseRepository.create(data);
  };

  /**
   * Updates a city with state validation
   * @param id - The ID of the city to update
   * @param data - The city data to update
   * @returns The updated city
   */
  const update = async (id: number, data: UpdateCityPayload): Promise<City> => {
    if (data.stateId) {
      await validateStateExists(data.stateId);
    }

    if (data.slug) {
      await validateUniqueSlug(data.slug);
    }

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
    return baseRepository.findAllPaginated({
      ...params,
      sortBy: params.sortBy || DEFAULT_SORT_BY,
      sortDirection: params.sortDirection || DEFAULT_SORT_DIRECTION,
    });
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
