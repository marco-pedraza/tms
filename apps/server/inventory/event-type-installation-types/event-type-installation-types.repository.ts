import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '../db-service';
import { eventTypeInstallationTypes } from '../event-types/event-types.schema';
import type {
  CreateEventTypeInstallationTypePayload,
  EventTypeInstallationType,
  UpdateEventTypeInstallationTypePayload,
} from './event-type-installation-types.types';

/**
 * Creates a repository for managing event type installation type assignments
 * @returns {Object} An object containing assignment-specific operations and base CRUD operations
 */
export function createEventTypeInstallationTypeRepository() {
  const baseRepository = createBaseRepository<
    EventTypeInstallationType,
    CreateEventTypeInstallationTypePayload,
    UpdateEventTypeInstallationTypePayload,
    typeof eventTypeInstallationTypes
  >(db, eventTypeInstallationTypes, 'EventTypeInstallationType', {
    softDeleteEnabled: false,
  });

  /**
   * Helper function to get the appropriate repository instance based on transaction context
   * @param tx - Optional transaction instance
   * @returns Repository instance (transactional or base)
   */
  function getRepository(tx?: TransactionalDB) {
    return tx ? baseRepository.withTransaction(tx) : baseRepository;
  }

  /**
   * Finds all event type assignments for a specific installation type
   * @param installationTypeId - The ID of the installation type
   * @param tx - Optional transaction instance
   * @returns Array of event type assignments
   */
  async function findByInstallationTypeId(
    installationTypeId: number,
    tx?: TransactionalDB,
  ): Promise<EventTypeInstallationType[]> {
    const repo = getRepository(tx);
    return await repo.findAllBy(
      eventTypeInstallationTypes.installationTypeId,
      installationTypeId,
    );
  }

  /**
   * Deletes all event type assignments for a specific installation type
   * @param installationTypeId - The ID of the installation type
   * @param tx - Optional transaction instance
   * @returns Array of deleted assignments
   */
  async function deleteByInstallationTypeId(
    installationTypeId: number,
    tx?: TransactionalDB,
  ): Promise<EventTypeInstallationType[]> {
    const repo = getRepository(tx);

    const existingAssignments = await findByInstallationTypeId(
      installationTypeId,
      tx,
    );

    if (existingAssignments.length === 0) {
      return [];
    }

    const deletedAssignments = await repo.deleteMany(
      existingAssignments.map((assignment) => assignment.id),
    );

    return deletedAssignments;
  }

  /**
   * Creates multiple event type assignments for an installation type atomically
   * @param assignments - Array of assignment payloads
   * @param tx - Optional transaction instance
   * @returns Array of created assignments
   */
  async function createMany(
    assignments: CreateEventTypeInstallationTypePayload[],
    tx?: TransactionalDB,
  ): Promise<EventTypeInstallationType[]> {
    if (assignments.length === 0) {
      return [];
    }

    const repo = getRepository(tx);

    // If we have a transaction, use it directly for atomic operations
    if (tx) {
      const results: EventTypeInstallationType[] = [];
      for (const assignment of assignments) {
        const created = await repo.create(assignment);
        results.push(created);
      }
      return results;
    }

    // If no transaction provided, create one to ensure atomicity
    return await baseRepository.transaction(async (txRepo) => {
      const results: EventTypeInstallationType[] = [];
      for (const assignment of assignments) {
        const created = await txRepo.create(assignment);
        results.push(created);
      }
      return results;
    });
  }

  return {
    ...baseRepository,
    findByInstallationTypeId,
    deleteByInstallationTypeId,
    createMany,
  };
}

// Export the repository instance
export const eventTypeInstallationTypeRepository =
  createEventTypeInstallationTypeRepository();
