import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { PaginationMeta } from '@/shared/types';
import { installationSchemas } from './installation-schemas.schema';
import type {
  CreateInstallationSchemaPayload,
  InstallationSchema,
  InstallationSchemaWithRelations,
  PaginatedListInstallationSchemasQueryParams,
  PaginatedListInstallationSchemasResult,
  UpdateInstallationSchemaPayload,
} from './installation-schemas.types';

/**
 * Creates a repository for managing installation schema entities
 * @returns {Object} An object containing installation schema-specific operations and base CRUD operations
 */
export function createInstallationSchemaRepository() {
  const baseRepository = createBaseRepository<
    InstallationSchema,
    CreateInstallationSchemaPayload,
    UpdateInstallationSchemaPayload,
    typeof installationSchemas
  >(db, installationSchemas, 'InstallationSchema', {
    searchableFields: [installationSchemas.name],
    softDeleteEnabled: true,
  });

  /**
   * Finds a single installation schema with its related installation type
   * @param id - The ID of the installation schema to find
   * @returns {Promise<InstallationSchemaWithRelations>} The installation schema with related data
   * @throws {NotFoundError} If the installation schema is not found
   */
  async function findOneWithRelations(
    id: number,
  ): Promise<InstallationSchemaWithRelations> {
    const schema = await db.query.installationSchemas.findFirst({
      where: (installationSchemas, { eq, and, isNull }) =>
        and(
          eq(installationSchemas.id, id),
          isNull(installationSchemas.deletedAt),
        ),
      with: {
        installationType: true,
      },
    });

    if (!schema) {
      throw new NotFoundError(`InstallationSchema with id ${id} not found`);
    }

    return schema as InstallationSchemaWithRelations;
  }

  /**
   * Appends relations (installation type) to installation schemas
   *
   * This function takes a list of installation schemas and enriches them with related information.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param schemasResult - Array of installation schemas to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @returns Installation schemas with relations and pagination metadata
   */
  async function appendRelations(
    schemasResult: InstallationSchema[],
    pagination: PaginationMeta,
    params: PaginatedListInstallationSchemasQueryParams,
  ): Promise<PaginatedListInstallationSchemasResult> {
    // Return early if no schemas to process
    if (schemasResult.length === 0) {
      return {
        data: [],
        pagination,
      };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = schemasResult.map((schema) => schema.id);

    const schemasWithRelations = await db.query.installationSchemas.findMany({
      where: (installationSchemas, { inArray, and, isNull }) =>
        and(
          inArray(installationSchemas.id, ids),
          isNull(installationSchemas.deletedAt),
        ),
      orderBy: baseOrderBy,
      with: {
        installationType: true,
      },
    });

    return {
      data: schemasWithRelations as InstallationSchemaWithRelations[],
      pagination,
    };
  }

  /**
   * Finds installation schemas by installation type ID
   * @param installationTypeId - The installation type ID to filter by
   * @returns Array of installation schemas for the given type
   */
  async function findByInstallationTypeId(
    installationTypeId: number,
  ): Promise<InstallationSchema[]> {
    return await baseRepository.findAll({
      filters: { installationTypeId },
    });
  }

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
    findByInstallationTypeId,
  };
}

// Export the installation schema repository instance
export const installationSchemaRepository =
  createInstallationSchemaRepository();
