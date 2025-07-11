import { ValidationError, createBaseRepository } from '@repo/base-repo';
import { validateInstallationSchemasBatch } from '../installation-schemas/installation-schemas.domain';
import { installationSchemaRepository } from '../installation-schemas/installation-schemas.repository';
import { installationSchemas } from '../installation-schemas/installation-schemas.schema';
import type {
  CreateInstallationSchemaPayload,
  InstallationSchema,
  UpdateInstallationSchemaPayload,
} from '../installation-schemas/installation-schemas.types';
import type { SyncInstallationSchemaPayload } from './installation-types.types';

// Type alias for transaction repository using the base repository type
type TransactionSchemaRepo = ReturnType<
  typeof createBaseRepository<
    InstallationSchema,
    CreateInstallationSchemaPayload,
    UpdateInstallationSchemaPayload,
    typeof installationSchemas
  >
>;

// Define domain-specific error messages as constants
const INSTALLATION_TYPE_ERRORS = {
  SCHEMA_SYNC_FAILED: 'Failed to synchronize installation schemas',
  INVALID_SCHEMA_DATA: 'Invalid schema data provided',
  INSTALLATION_TYPE_NOT_FOUND: (id: number) =>
    `Installation type with id ${id} not found`,
};

/**
 * Detects what operations need to be performed based on current vs new schemas
 */
function detectSchemaOperations(
  currentSchemas: InstallationSchema[],
  newSchemas: SyncInstallationSchemaPayload[],
) {
  const currentIds = currentSchemas.map((s) => s.id);
  const newIds = newSchemas
    .map((s) => s.id)
    .filter((id): id is number => id != null);

  return {
    toCreate: newSchemas.filter((s) => s.id == null),
    toUpdate: newSchemas.filter(
      (s) => s.id != null && currentIds.includes(s.id),
    ),
    toDelete: currentSchemas.filter((s) => !newIds.includes(s.id)),
  };
}

/**
 * Executes the detected operations within a transaction
 */
async function executeSchemaOperations(
  txRepo: TransactionSchemaRepo,
  operations: {
    toCreate: SyncInstallationSchemaPayload[];
    toUpdate: SyncInstallationSchemaPayload[];
    toDelete: InstallationSchema[];
  },
  installationTypeId: number,
) {
  // Delete schemas that are no longer needed
  if (operations.toDelete.length > 0) {
    const idsToDelete = operations.toDelete.map((schema) => schema.id);
    await txRepo.deleteMany(idsToDelete);
  }

  // Create new schemas
  for (const schema of operations.toCreate) {
    await txRepo.create({
      ...schema,
      installationTypeId,
    });
  }

  // Update existing schemas
  for (const schema of operations.toUpdate) {
    if (schema.id != null) {
      await txRepo.update(schema.id, schema);
    }
  }
}

/**
 * Synchronizes installation schemas for a specific installation type
 * This maintains the aggregate boundary with InstallationType as root
 * @param installationTypeId - The ID of the installation type to sync schemas for
 * @param schemas - Array of schema definitions to sync
 * @returns Array of synchronized installation schemas
 * @throws {ValidationError} If the operation fails
 */
async function syncInstallationSchemas(
  installationTypeId: number,
  schemas: SyncInstallationSchemaPayload[],
): Promise<InstallationSchema[]> {
  const schemaRepository = installationSchemaRepository;

  try {
    // 1. Validate aggregate root exists and all schemas using batch validation
    const schemasWithContext = schemas.map((schema, index) => ({
      payload: schema,
      currentId: schema.id ?? undefined,
      index,
    }));

    await validateInstallationSchemasBatch(
      schemasWithContext,
      installationTypeId,
    );

    // 2. Perform sync operation using installation schema repository
    return await schemaRepository
      .transaction(async (txRepo) => {
        // Get current schemas for this installation type using transactional repository
        const currentSchemas = await txRepo.findAll({
          filters: { installationTypeId },
        });

        // Detect operations
        const operations = detectSchemaOperations(currentSchemas, schemas);

        // Execute operations
        await executeSchemaOperations(txRepo, operations, installationTypeId);

        // Return installation type ID for post-transaction processing
        return installationTypeId;
      })
      .then((id) => {
        // After transaction completes, fetch and return updated schemas
        return schemaRepository.findByInstallationTypeId(id);
      });
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(
        `${INSTALLATION_TYPE_ERRORS.SCHEMA_SYNC_FAILED}: ${error.message}`,
      );
    }
    throw error;
  }
}

// Export the use case object directly (not a factory)
export const installationTypeUseCases = {
  syncInstallationSchemas,
};
