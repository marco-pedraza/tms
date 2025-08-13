import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { db } from '@/inventory/db-service';
import { City } from '@/inventory/locations/cities/cities.types';
import { populationCities, populations } from './populations.schema';
import type {
  AssignCitiesPayload,
  ListAvailableCitiesResult,
  PopulationWithRelations,
} from './populations.types';
import { populationRepository } from './populations.repository';

/**
 * Creates use cases for population management with complex business logic
 * @returns Object with population-specific use case functions
 */
export function createPopulationUseCases() {
  // Initialize repositories
  const populationRepo = populationRepository;

  /**
   * Updates the population's updatedAt field
   * @param tx - Database transaction
   * @param populationId - The ID of the population to update
   */
  async function updatePopulationTimestamp(
    tx: unknown,
    populationId: number,
  ): Promise<void> {
    await (tx as typeof db)
      .update(populations)
      .set({ updatedAt: sql`NOW()` })
      .where(eq(populations.id, populationId));
  }

  /**
   * Assigns cities to a population, replacing all existing assignments
   * This operation involves multiple repositories and requires transactional integrity
   * @param populationId - The ID of the population
   * @param data - The assignment data containing city IDs
   * @returns Promise<PopulationWithRelations> The updated population
   * @note Validation should be performed in the controller before calling this method
   */
  async function assignCities(
    populationId: number,
    data: AssignCitiesPayload,
  ): Promise<PopulationWithRelations> {
    // Perform the assignment within a transaction
    return await populationRepo
      .transaction(async (txPopRepo, tx) => {
        // If cityIds is empty, just remove all existing assignments
        if (data.cityIds.length === 0) {
          await tx
            .delete(populationCities)
            .where(eq(populationCities.populationId, populationId));
          await updatePopulationTimestamp(tx, populationId);
          return populationId;
        }

        // Get currently assigned cities for this population
        const currentAssignments = await tx
          .select({ cityId: populationCities.cityId })
          .from(populationCities)
          .where(eq(populationCities.populationId, populationId));

        const currentCityIds = currentAssignments.map(
          (assignment) => assignment.cityId,
        );
        const newCityIds = data.cityIds;

        // Cities to remove (currently assigned but not in new list)
        const citiesToRemove = currentCityIds.filter(
          (id) => !newCityIds.includes(id),
        );

        // Cities to add (in new list but not currently assigned)
        const citiesToAdd = newCityIds.filter(
          (id) => !currentCityIds.includes(id),
        );

        // Remove cities that are no longer assigned
        if (citiesToRemove.length > 0) {
          await tx
            .delete(populationCities)
            .where(
              and(
                eq(populationCities.populationId, populationId),
                inArray(populationCities.cityId, citiesToRemove),
              ),
            );
        }

        // Add new city assignments
        if (citiesToAdd.length > 0) {
          await tx.insert(populationCities).values(
            citiesToAdd.map((cityId) => ({
              populationId,
              cityId,
            })),
          );
        }

        // Update population's updated_at field
        await updatePopulationTimestamp(tx, populationId);

        // Return population ID for post-transaction processing
        return populationId;
      })
      .then((id) => {
        // After transaction completes, fetch and return the updated population
        return populationRepo.findOneWithRelations(id);
      });
  }

  /**
   * Finds cities available for assignment to a population
   * This operation crosses multiple domains (cities, populations) and contains complex business logic
   * @param params - Object with optional populationId
   * @returns Array of cities with state and country information
   *
   * Logic:
   * - If no populationId provided: returns cities not assigned to any population
   * - If populationId provided: returns cities not assigned to any population + cities assigned to the specified population
   */
  async function findAvailableCities(params: {
    populationId?: number;
  }): Promise<ListAvailableCitiesResult> {
    const { populationId } = params;

    // Get excluded city IDs based on population logic
    let excludedCityIds: number[] = [];

    if (populationId) {
      // Get cities assigned to other populations (exclude cities assigned to the specified population)
      const assignedToOthers = await db
        .select({ cityId: populationCities.cityId })
        .from(populationCities)
        .where(not(eq(populationCities.populationId, populationId)));

      excludedCityIds = assignedToOthers.map((item) => item.cityId);
    } else {
      // Get all assigned cities (exclude all assigned cities)
      const allAssigned = await db
        .select({ cityId: populationCities.cityId })
        .from(populationCities);

      excludedCityIds = allAssigned.map((item) => item.cityId);
    }

    // Build the query using db.query API to get cities with relations
    const citiesWithRelations = await db.query.cities.findMany({
      where: (cities, { eq, and, isNull, not, inArray }) => {
        const conditions = [eq(cities.active, true), isNull(cities.deletedAt)];

        // Exclude assigned cities based on logic above
        if (excludedCityIds.length > 0) {
          conditions.push(not(inArray(cities.id, excludedCityIds)));
        }

        return and(...conditions);
      },
      orderBy: (cities, { asc }) => [asc(cities.name)], // Default ordering by name
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
    };
  }

  async function assignCityToPopulation(
    populationId: number,
    cityId: number,
  ): Promise<PopulationWithRelations> {
    await populationRepo.transaction(async (txPopRepo, tx) => {
      // Get currently assigned cities for this population
      const currentAssignments = await tx
        .select({ cityId: populationCities.cityId })
        .from(populationCities)
        .where(eq(populationCities.populationId, populationId));

      const cityIsAlreadyAssignedToPopulation = currentAssignments.some(
        (assignment) => assignment.cityId === cityId,
      );
      if (cityIsAlreadyAssignedToPopulation) {
        return;
      }
      // Check if the city is already assigned to another population
      const cityIsAlreadyAssignedToAnotherPopulation = await tx
        .select({ populationId: populationCities.populationId })
        .from(populationCities)
        .where(eq(populationCities.cityId, cityId));
      if (cityIsAlreadyAssignedToAnotherPopulation.length > 0) {
        await tx
          .delete(populationCities)
          .where(
            and(
              eq(populationCities.cityId, cityId),
              not(eq(populationCities.populationId, populationId)),
            ),
          );
      }
      // Assign the city to the population
      await tx.insert(populationCities).values({
        populationId,
        cityId,
      });
      await updatePopulationTimestamp(tx, populationId);
    });
    return await populationRepo.findOneWithRelations(populationId);
  }

  async function findPopulationByAssignedCity(
    cityId: number,
  ): Promise<PopulationWithRelations | undefined> {
    // Get current assignments for the city
    const currentAssignments = await db
      .select({ populationId: populationCities.populationId })
      .from(populationCities)
      .where(eq(populationCities.cityId, cityId));

    const populationId = currentAssignments[0]?.populationId;
    if (!populationId) {
      return undefined;
    }
    return await populationRepo.findOneWithRelations(populationId);
  }

  /**
   * Gets cities assigned to a specific population
   * @param populationId - The ID of the population
   * @returns Array of cities assigned to the population
   * @throws {NotFoundError} If the population doesn't exist
   */
  async function getPopulationCities(populationId: number): Promise<City[]> {
    // First, verify the population exists
    await populationRepo.findOne(populationId);

    // Query cities through the intermediate table population_cities
    const result = await db.query.populationCities.findMany({
      where: eq(populationCities.populationId, populationId),
      with: {
        city: true,
      },
    });

    // Extract just the city data from the result
    return result.map((item) => item.city);
  }

  return {
    assignCities,
    findAvailableCities,
    assignCityToPopulation,
    findPopulationByAssignedCity,
    getPopulationCities,
  };
}

// Export the use case instance
export const populationUseCases = createPopulationUseCases();
