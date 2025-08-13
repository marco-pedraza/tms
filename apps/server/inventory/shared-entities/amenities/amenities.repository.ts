import { and, eq, inArray, isNull } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { amenities } from './amenities.schema';
import type {
  Amenity,
  AmenityType,
  CreateAmenityPayload,
  UpdateAmenityPayload,
} from './amenities.types';

/**
 * Creates a repository for managing amenity entities
 */
export function createAmenityRepository() {
  const baseRepository = createBaseRepository<
    Amenity,
    CreateAmenityPayload,
    UpdateAmenityPayload,
    typeof amenities
  >(db, amenities, 'Amenity', {
    searchableFields: [amenities.name],
    softDeleteEnabled: true,
  });

  /**
   * Validates that multiple amenity IDs exist, are active, and have the correct type
   * @param amenityIds - Array of amenity IDs to validate
   * @param requiredType - Required amenity type (e.g., 'installation')
   * @param tx - Optional transaction instance
   * @returns Array of missing or invalid amenity IDs (empty if all are valid)
   */
  async function validateAmenityIds(
    amenityIds: number[],
    requiredType: AmenityType,
    tx?: TransactionalDB,
  ): Promise<number[]> {
    if (amenityIds.length === 0) {
      return [];
    }

    // Use transaction instance if provided, otherwise use default db
    const dbInstance = tx ?? db;

    // Get existing amenities that match criteria
    const validAmenities = await dbInstance
      .select({ id: amenities.id })
      .from(amenities)
      .where(
        and(
          inArray(amenities.id, amenityIds),
          eq(amenities.amenityType, requiredType),
          eq(amenities.active, true),
          isNull(amenities.deletedAt),
        ),
      );

    // Extract valid IDs
    const validIds = validAmenities.map((amenity) => amenity.id);

    // Find invalid IDs (missing, inactive, wrong type, or deleted)
    const invalidIds = amenityIds.filter((id) => !validIds.includes(id));

    return invalidIds;
  }

  return {
    ...baseRepository,
    validateInstallationAmenityIds: validateAmenityIds,
  };
}

export const amenitiesRepository = createAmenityRepository();
