import { and, eq, inArray } from 'drizzle-orm';
import { populationCities } from './populations.schema';
import type { AssignCitiesPayload, Population } from './populations.types';
import { populationRepository } from './populations.repository';

/**
 * Creates use cases for population management with complex business logic
 * @returns Object with population-specific use case functions
 */
export function createPopulationUseCases() {
  // Initialize repositories
  const populationRepo = populationRepository;

  /**
   * Assigns cities to a population, replacing all existing assignments
   * This operation involves multiple repositories and requires transactional integrity
   * @param populationId - The ID of the population
   * @param data - The assignment data containing city IDs
   * @returns Promise<Population> The updated population
   * @note Validation should be performed in the controller before calling this method
   */
  async function assignCities(
    populationId: number,
    data: AssignCitiesPayload,
  ): Promise<Population> {
    // Perform the assignment within a transaction
    return await populationRepo
      .transaction(async (txPopRepo, tx) => {
        // If cityIds is empty, just remove all existing assignments
        if (data.cityIds.length === 0) {
          await tx
            .delete(populationCities)
            .where(eq(populationCities.populationId, populationId));
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

        // Return population ID for post-transaction processing
        return populationId;
      })
      .then((id) => {
        // After transaction completes, fetch and return the updated population
        return populationRepo.findOne(id);
      });
  }

  return {
    assignCities,
  };
}

// Export the use case instance
export const populationUseCases = createPopulationUseCases();
