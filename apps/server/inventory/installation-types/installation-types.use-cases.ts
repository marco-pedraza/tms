import {
  FieldErrorCollector,
  ValidationError,
  createBaseRepository,
} from '@repo/base-repo';
import { eventTypeInstallationTypeRepository } from '../event-type-installation-types/event-type-installation-types.repository';
import type { EventTypeInstallationType } from '../event-type-installation-types/event-type-installation-types.types';
import { eventTypeRepository } from '../event-types/event-types.repository';
import { validateInstallationSchemasBatch } from '../installation-schemas/installation-schemas.domain';
import { installationSchemaRepository } from '../installation-schemas/installation-schemas.repository';
import { installationSchemas } from '../installation-schemas/installation-schemas.schema';
import type {
  CreateInstallationSchemaPayload,
  InstallationSchema,
  UpdateInstallationSchemaPayload,
} from '../installation-schemas/installation-schemas.types';
import type {
  InstallationTypeWithRelations,
  SyncInstallationSchemaPayload,
} from './installation-types.types';
import { installationTypeRepository } from './installation-types.repository';

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
  EVENT_TYPE_ASSIGNMENT_FAILED:
    'Failed to assign event types to installation type',
  EVENT_TYPE_NOT_FOUND: (id: number) => `Event type with id ${id} not found`,
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
 * @throws {NotFoundError} If the installation type is not found
 * @throws {FieldValidationError} If schema validation fails
 * @throws {ValidationError} If the sync operation fails
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

/**
 * Validates that all event type IDs exist and adds errors to collector if any are missing
 * @param eventTypeIds - Array of event type IDs to validate
 * @param collector - Field error collector to add errors to
 */
async function validateEventTypeIds(
  eventTypeIds: number[],
  collector: FieldErrorCollector,
): Promise<void> {
  if (eventTypeIds.length === 0) {
    return;
  }

  const missingEventTypeIds =
    await eventTypeRepository.validateEventTypeIds(eventTypeIds);

  if (missingEventTypeIds.length > 0) {
    // Add field errors for each missing event type ID
    for (const missingId of missingEventTypeIds) {
      collector.addError(
        'event_type_ids',
        'NOT_FOUND',
        INSTALLATION_TYPE_ERRORS.EVENT_TYPE_NOT_FOUND(missingId),
        missingId,
      );
    }
    collector.throwIfErrors();
  }
}

/**
 * Creates assignment payloads for event types and installation type
 * @param eventTypeIds - Array of event type IDs
 * @param installationTypeId - Installation type ID
 * @returns Array of assignment payloads
 */
function createAssignmentPayloads(
  eventTypeIds: number[],
  installationTypeId: number,
) {
  return eventTypeIds.map((eventTypeId) => ({
    eventTypeId,
    installationTypeId,
  }));
}

/**
 * Performs the destructive assignment operation within a transaction
 * @param assignmentRepository - Repository for event type assignments
 * @param installationTypeId - Installation type ID
 * @param eventTypeIds - Array of event type IDs to assign
 * @returns Array of created assignments
 */
async function performDestructiveAssignment(
  assignmentRepository: typeof eventTypeInstallationTypeRepository,
  installationTypeId: number,
  eventTypeIds: number[],
): Promise<EventTypeInstallationType[]> {
  return await assignmentRepository.transaction(async (txRepo, tx) => {
    // Delete all existing assignments for this installation type
    await assignmentRepository.deleteByInstallationTypeId(
      installationTypeId,
      tx,
    );

    // Create new assignments if any event types provided
    if (eventTypeIds.length > 0) {
      const assignmentPayloads = createAssignmentPayloads(
        eventTypeIds,
        installationTypeId,
      );
      return await assignmentRepository.createMany(assignmentPayloads, tx);
    }

    // Return empty array if no event types provided
    return [];
  });
}

/**
 * Assigns multiple event types to an installation type (destructive operation)
 * This maintains the aggregate boundary with InstallationType as root
 * @param installationTypeId - The ID of the installation type to assign event types to
 * @param eventTypeIds - Array of event type IDs to assign
 * @returns The updated installation type with its event type relationships
 * @throws {NotFoundError} If the installation type is not found
 * @throws {FieldValidationError} If event type IDs are invalid or not found
 * @throws {ValidationError} If the assignment operation fails
 */
async function assignEventTypes(
  installationTypeId: number,
  eventTypeIds: number[],
): Promise<InstallationTypeWithRelations> {
  const assignmentRepository = eventTypeInstallationTypeRepository;
  const collector = new FieldErrorCollector();

  try {
    // 1. Validate that the installation type exists (aggregate root validation)
    await installationTypeRepository.findOne(installationTypeId);

    // 2. Validate that all event types exist
    await validateEventTypeIds(eventTypeIds, collector);

    // 3. Perform destructive assignment using transaction
    await performDestructiveAssignment(
      assignmentRepository,
      installationTypeId,
      eventTypeIds,
    );

    // 4. Return the updated installation type with its relations
    return await installationTypeRepository.findOneWithRelations(
      installationTypeId,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(
        `${INSTALLATION_TYPE_ERRORS.EVENT_TYPE_ASSIGNMENT_FAILED}: ${error.message}`,
      );
    }
    throw error;
  }
}

// Export the use case object directly (not a factory)
export const installationTypeUseCases = {
  syncInstallationSchemas,
  assignEventTypes,
};
