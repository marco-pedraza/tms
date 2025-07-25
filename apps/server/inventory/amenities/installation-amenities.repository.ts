import { eq } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '../db-service';
import { installationAmenities } from './amenities.schema';
import type {
  CreateInstallationAmenityPayload,
  InstallationAmenityAssignment,
} from './installation-amenities.types';

/**
 * Creates a repository for managing installation amenity assignments
 */
export function createInstallationAmenityRepository() {
  const baseRepository = createBaseRepository<
    InstallationAmenityAssignment,
    CreateInstallationAmenityPayload,
    never, // No updates needed for join table
    typeof installationAmenities
  >(db, installationAmenities, 'InstallationAmenity', {
    searchableFields: [],
    softDeleteEnabled: false, // Join tables don't use soft delete
  });

  /**
   * Removes all amenity assignments for a specific installation
   * @param installationId - The installation ID to clear assignments for
   * @param tx - Optional transaction instance
   */
  async function clearInstallationAmenities(
    installationId: number,
    tx?: TransactionalDB,
  ): Promise<void> {
    const dbInstance = tx ?? db;

    await dbInstance
      .delete(installationAmenities)
      .where(eq(installationAmenities.installationId, installationId));
  }

  /**
   * Assigns multiple amenities to an installation in a single operation
   * @param installationId - The installation ID to assign amenities to
   * @param amenityIds - Array of amenity IDs to assign
   * @param tx - Optional transaction instance
   */
  async function assignAmenitiesToInstallation(
    installationId: number,
    amenityIds: number[],
    tx?: TransactionalDB,
  ): Promise<void> {
    if (amenityIds.length === 0) {
      return;
    }

    const dbInstance = tx ?? db;

    const assignments = amenityIds.map((amenityId) => ({
      installationId,
      amenityId,
    }));

    await dbInstance.insert(installationAmenities).values(assignments);
  }

  /**
   * Gets all amenities assigned to a specific installation
   * @param installationId - The installation ID to get amenities for
   * @returns Array of amenities with proper typing
   */
  async function getInstallationAmenities(installationId: number) {
    const installationAmenitiesData =
      await db.query.installationAmenities.findMany({
        where: eq(installationAmenities.installationId, installationId),
        with: {
          amenity: true,
        },
      });

    return installationAmenitiesData.map((ia) => ia.amenity);
  }

  return {
    ...baseRepository,
    clearInstallationAmenities,
    assignAmenitiesToInstallation,
    getInstallationAmenities,
  };
}

export const installationAmenityRepository =
  createInstallationAmenityRepository();
