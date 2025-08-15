import { eq } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { serviceTypeAmenities } from './amenities.schema';
import type {
  CreateServiceTypeAmenityPayload,
  ServiceTypeAmenityAssignment,
} from './service-type-amenities.types';

/**
 * Creates a repository for managing service-type amenity assignments
 */
export function createServiceTypeAmenityRepository() {
  const baseRepository = createBaseRepository<
    ServiceTypeAmenityAssignment,
    CreateServiceTypeAmenityPayload,
    never, // No updates needed for join table
    typeof serviceTypeAmenities
  >(db, serviceTypeAmenities, 'ServiceTypeAmenity', {
    searchableFields: [],
    softDeleteEnabled: false, // Join tables don't use soft delete
  });

  /**
   * Removes all amenity assignments for a specific service type
   * @param serviceTypeId - The service type ID to clear assignments for
   * @param tx - Optional transaction instance
   */
  async function clearServiceTypeAmenities(
    serviceTypeId: number,
    tx?: TransactionalDB,
  ): Promise<void> {
    const dbInstance = tx ?? db;

    await dbInstance
      .delete(serviceTypeAmenities)
      .where(eq(serviceTypeAmenities.serviceTypeId, serviceTypeId));
  }

  /**
   * Assigns multiple amenities to a service type in a single operation
   * @param serviceTypeId - The service type ID to assign amenities to
   * @param amenityIds - Array of amenity IDs to assign
   * @param tx - Optional transaction instance
   */
  async function assignAmenitiesToServiceType(
    serviceTypeId: number,
    amenityIds: number[],
    tx?: TransactionalDB,
  ): Promise<void> {
    if (amenityIds.length === 0) {
      return;
    }

    const dbInstance = tx ?? db;

    const assignments = amenityIds.map((amenityId) => ({
      serviceTypeId,
      amenityId,
    }));

    await dbInstance.insert(serviceTypeAmenities).values(assignments);
  }

  /**
   * Gets all amenities assigned to a specific service type
   * @param serviceTypeId - The service type ID to get amenities for
   * @returns Array of amenities with proper typing
   */
  async function getServiceTypeAmenities(serviceTypeId: number) {
    const serviceTypeAmenitiesData =
      await db.query.serviceTypeAmenities.findMany({
        where: eq(serviceTypeAmenities.serviceTypeId, serviceTypeId),
        with: {
          amenity: true,
        },
      });

    return serviceTypeAmenitiesData.map((sta) => sta.amenity);
  }

  return {
    ...baseRepository,
    clearServiceTypeAmenities,
    assignAmenitiesToServiceType,
    getServiceTypeAmenities,
  };
}

export const serviceTypeAmenityRepository =
  createServiceTypeAmenityRepository();
