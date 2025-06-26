import { inArray } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import type {
  PaginatedListQueryParams,
  PaginatedListQueryResult,
  PaginationMeta,
} from '../../shared/types';
import type { City } from '../cities/cities.types';
import { db } from '../db-service';
import { populationCities, populations } from './populations.schema';
import type {
  CreatePopulationPayload,
  Population,
  PopulationWithRelations,
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

  /**
   * Finds a single population with its related cities
   * @param id - The ID of the population to find
   * @returns The population with its related cities
   * @throws {NotFoundError} If the population is not found
   */
  const findOneWithRelations = async (
    id: number,
  ): Promise<PopulationWithRelations> => {
    const population = await db.query.populations.findFirst({
      where: (populations, { eq, and, isNull }) =>
        and(
          eq(populations.id, id),
          isNull(populations.deletedAt), // Respect soft delete
        ),
      with: {
        populationCities: {
          with: {
            city: true,
          },
        },
      },
    });

    if (!population) {
      throw new NotFoundError(`Population with id ${id} not found`);
    }

    // Transform the data to return only cities directly
    const { populationCities, ...populationData } = population;

    return {
      ...populationData,
      cities: populationCities.map((pc) => pc.city),
    };
  };

  /**
   * Appends relations (cities) to populations
   *
   * This function takes a list of populations and enriches them with related cities information.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param populationsResult - Array of populations to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @returns Populations with relations and pagination metadata
   */
  const appendRelations = async (
    populationsResult: Population[],
    pagination: PaginationMeta,
    params: PaginatedListQueryParams<Population>,
  ): Promise<PaginatedListQueryResult<PopulationWithRelations>> => {
    // Return early if no populations to process
    if (populationsResult.length === 0) {
      return {
        data: [],
        pagination,
      };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const populationIds = populationsResult.map((population) => population.id);

    // Get all population-city relationships for these populations
    const populationCitiesRelations = await db.query.populationCities.findMany({
      where: inArray(populationCities.populationId, populationIds),
      with: {
        city: true,
      },
    });

    // Create a map of population ID to cities for efficient lookup
    const populationCitiesMap = new Map<number, City[]>();

    for (const relation of populationCitiesRelations) {
      const populationId = relation.populationId;
      if (!populationCitiesMap.has(populationId)) {
        populationCitiesMap.set(populationId, []);
      }
      populationCitiesMap.get(populationId)?.push(relation.city);
    }

    // Get populations with correct ordering and relations
    const populationsWithRelations = await db.query.populations.findMany({
      where: inArray(populations.id, populationIds),
      orderBy: baseOrderBy,
    });

    // Transform the populations to include their cities
    const populationsWithCities: PopulationWithRelations[] =
      populationsWithRelations.map((population) => ({
        ...population,
        cities: populationCitiesMap.get(population.id) ?? [],
      }));

    return {
      data: populationsWithCities,
      pagination,
    };
  };

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
  };
}

// Export the population repository instance
export const populationRepository = createPopulationRepository();
