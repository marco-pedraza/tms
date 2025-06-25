import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { PaginationMeta } from '../../shared/types';
import { createSlug } from '../../shared/utils';
import { db } from '../db-service';
import { cities } from './cities.schema';
import type {
  City,
  CityWithRelations,
  CreateCityPayload,
  PaginatedListCitiesQueryParams,
  PaginatedListCitiesResult,
  UpdateCityPayload,
} from './cities.types';

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
    softDeleteEnabled: true,
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
   * Finds a single city with its relations (state and country)
   * @param id - The ID of the city to find
   * @returns The city with state and country information
   * @throws {NotFoundError} If the city is not found
   */
  const findOneWithRelations = async (
    id: number,
  ): Promise<CityWithRelations> => {
    const city = await db.query.cities.findFirst({
      where: (cities, { eq, and, isNull }) =>
        and(eq(cities.id, id), isNull(cities.deletedAt)),
      with: {
        state: {
          with: {
            country: true,
          },
        },
      },
    });

    if (!city) {
      throw new NotFoundError(`City with id ${id} not found`);
    }

    return city;
  };

  /**
   * Appends relations (state and country) to cities
   *
   * This function takes a list of cities and enriches them with related state and country information.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param citiesResult - Array of cities to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @returns Cities with relations and pagination metadata
   */
  const appendRelations = async (
    citiesResult: City[],
    pagination: PaginationMeta,
    params: PaginatedListCitiesQueryParams,
  ): Promise<PaginatedListCitiesResult> => {
    // Return early if no cities to process
    if (citiesResult.length === 0) {
      return {
        data: [],
        pagination,
      };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = citiesResult.map((city) => city.id);

    const citiesWithRelations = await db.query.cities.findMany({
      where: (cities, { inArray, and, isNull }) =>
        and(inArray(cities.id, ids), isNull(cities.deletedAt)),
      orderBy: baseOrderBy,
      with: {
        state: {
          with: {
            country: true,
          },
        },
      },
    });

    return {
      data: citiesWithRelations,
      pagination,
    };
  };

  return {
    ...baseRepository,
    create,
    update,
    findOneWithRelations,
    appendRelations,
  };
};

// Export the city repository instance
export const cityRepository = createCityRepository();
