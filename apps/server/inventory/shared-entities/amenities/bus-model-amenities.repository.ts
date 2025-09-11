import { eq } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { busModelAmenities } from './amenities.schema';
import type {
  BusModelAmenityAssignment,
  CreateBusModelAmenityPayload,
} from './bus-model-amenities.types';

/**
 * Creates a repository for managing bus model amenity assignments
 */
export function createBusModelAmenitiesRepository() {
  const baseRepository = createBaseRepository<
    BusModelAmenityAssignment,
    CreateBusModelAmenityPayload,
    never, // No updates needed for join table
    typeof busModelAmenities
  >(db, busModelAmenities, 'BusModelAmenity', {
    searchableFields: [],
    softDeleteEnabled: false, // Join tables don't use soft delete
  });

  /**
   * Removes all amenity assignments for a specific bus model
   * @param busModelId - The bus model ID to clear assignments for
   * @param tx - Optional transaction instance
   */
  async function clearBusModelAmenities(
    busModelId: number,
    tx?: TransactionalDB,
  ): Promise<void> {
    const dbInstance = tx ?? db;

    await dbInstance
      .delete(busModelAmenities)
      .where(eq(busModelAmenities.busModelId, busModelId));
  }

  /**
   * Assigns multiple amenities to a bus model in a single operation
   * @param busModelId - The bus model ID to assign amenities to
   * @param amenityIds - Array of amenity IDs to assign
   * @param tx - Optional transaction instance
   */
  async function assignAmenitiesToBusModel(
    busModelId: number,
    amenityIds: number[],
    tx?: TransactionalDB,
  ): Promise<void> {
    if (amenityIds.length === 0) {
      return;
    }

    const dbInstance = tx ?? db;

    const assignments = amenityIds.map((amenityId) => ({
      busModelId,
      amenityId,
    }));

    await dbInstance.insert(busModelAmenities).values(assignments);
  }

  /**
   * Gets all amenities assigned to a specific bus model
   * @param busModelId - The bus model ID to get amenities for
   * @returns Array of amenities with proper typing
   */
  async function getBusModelAmenities(busModelId: number) {
    const busModelAmenitiesData = await db
      .select()
      .from(busModelAmenities)
      .where(eq(busModelAmenities.busModelId, busModelId));

    return busModelAmenitiesData;
  }

  return {
    ...baseRepository,
    clearBusModelAmenities,
    assignAmenitiesToBusModel,
    getBusModelAmenities,
  };
}

// Export the repository instance
export const busModelAmenitiesRepository = createBusModelAmenitiesRepository();
