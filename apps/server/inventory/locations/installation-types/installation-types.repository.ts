import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { installationTypes } from './installation-types.schema';
import type {
  CreateInstallationTypePayload,
  InstallationType,
  InstallationTypeWithRelations,
  UpdateInstallationTypePayload,
} from './installation-types.types';

/**
 * Creates a repository for managing installation type entities
 * @returns {Object} An object containing installation type-specific operations and base CRUD operations
 */
export function createInstallationTypeRepository() {
  const baseRepository = createBaseRepository<
    InstallationType,
    CreateInstallationTypePayload,
    UpdateInstallationTypePayload,
    typeof installationTypes
  >(db, installationTypes, 'InstallationType', {
    searchableFields: [installationTypes.name],
    softDeleteEnabled: true,
  });

  /**
   * Finds a single installation type with its related event types
   * @param id - The ID of the installation type to find
   * @returns The installation type with its related event types
   * @throws {NotFoundError} If the installation type is not found
   */
  const findOneWithRelations = async (
    id: number,
  ): Promise<InstallationTypeWithRelations> => {
    const installationType = await db.query.installationTypes.findFirst({
      where: (installationTypes, { eq, and, isNull }) =>
        and(
          eq(installationTypes.id, id),
          isNull(installationTypes.deletedAt), // Respect soft delete
        ),
      with: {
        eventTypeInstallationTypes: {
          with: {
            eventType: true,
          },
        },
      },
    });

    if (!installationType) {
      throw new NotFoundError(`InstallationType with id ${id} not found`);
    }

    // Transform the data to return only event types directly
    const { eventTypeInstallationTypes, ...installationTypeData } =
      installationType;

    return {
      ...installationTypeData,
      eventTypes: eventTypeInstallationTypes.map((etit) => etit.eventType),
    };
  };

  return {
    ...baseRepository,
    findOneWithRelations,
  };
}

// Export the installation type repository instance
export const installationTypeRepository = createInstallationTypeRepository();
