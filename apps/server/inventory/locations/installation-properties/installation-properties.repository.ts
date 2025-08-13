import { and, eq, isNull } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import type {
  CreateInstallationPropertyPayload,
  InstallationProperty,
  InstallationPropertyWithSchema,
  UpdateInstallationPropertyPayload,
} from './installation-properties.types';
import { installationProperties } from './installation-properties.schemas';

/**
 * Creates a repository for managing installation property entities
 * @returns {Object} An object containing installation property-specific operations and base CRUD operations
 */
export function createInstallationPropertyRepository() {
  const baseRepository = createBaseRepository<
    InstallationProperty,
    CreateInstallationPropertyPayload,
    UpdateInstallationPropertyPayload,
    typeof installationProperties
  >(db, installationProperties, 'InstallationProperty', {
    softDeleteEnabled: true,
  });

  /**
   * Finds all installation properties for a specific installation with schema data
   * @param installationId - The ID of the installation
   * @returns Array of installation properties with schema data
   */
  async function findByInstallationWithSchema(
    installationId: number,
  ): Promise<InstallationPropertyWithSchema[]> {
    const result = await db.query.installationProperties.findMany({
      where: and(
        eq(installationProperties.installationId, installationId),
        isNull(installationProperties.deletedAt),
      ),
      with: {
        installationSchema: true,
      },
    });
    return result as InstallationPropertyWithSchema[];
  }

  /**
   * Finds a single installation property with schema data
   * @param id - The ID of the installation property
   * @returns Installation property with schema data or undefined
   */
  async function findOneWithSchema(
    id: number,
  ): Promise<InstallationPropertyWithSchema | undefined> {
    const result = await db.query.installationProperties.findFirst({
      where: and(
        eq(installationProperties.id, id),
        isNull(installationProperties.deletedAt),
      ),
      with: {
        installationSchema: true,
      },
    });
    return result as InstallationPropertyWithSchema | undefined;
  }

  return {
    ...baseRepository,
    findByInstallationWithSchema,
    findOneWithSchema,
  };
}

// Export the installation property repository instance
export const installationPropertyRepository =
  createInstallationPropertyRepository();
