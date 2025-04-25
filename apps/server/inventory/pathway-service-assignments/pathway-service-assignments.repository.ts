import { pathwayServiceAssignments } from './pathway-service-assignments.schema';
import type {
  PathwayServiceAssignment,
  CreatePathwayServiceAssignmentPayload,
  UpdatePathwayServiceAssignmentPayload,
} from './pathway-service-assignments.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/db';
import { PgTransaction } from 'drizzle-orm/pg-core';

/**
 * Defining internal types to avoid exposing the sequence number to the outside world
 */
type CreatePathwayServiceAssignmentPayloadWithSequence =
  CreatePathwayServiceAssignmentPayload & { sequence: number };

type UpdatePathwayServiceAssignmentPayloadWithSequence =
  UpdatePathwayServiceAssignmentPayload & { sequence: number };

// More generic typing for database or transaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseOrTransaction = typeof db | PgTransaction<any, any, any>;

/**
 * Creates a repository for managing pathway service assignments
 *
 * This repository intentionally exposes only a subset of the base repository methods
 * since pathway service assignments have specific constraints:
 * - The pathwayId and pathwayServiceId cannot be updated after creation
 * - Assignments should be deleted and recreated to change these relationships
 * - Other base methods like findAll are not needed for this entity
 *
 * @returns {Object} An object containing pathway service assignment operations
 */
export const createPathwayServiceAssignmentRepository = (
  dbOrTx?: DatabaseOrTransaction,
) => {
  const dbInstance = dbOrTx || db;

  const baseRepository = createBaseRepository<
    PathwayServiceAssignment,
    CreatePathwayServiceAssignmentPayloadWithSequence,
    UpdatePathwayServiceAssignmentPayloadWithSequence,
    typeof pathwayServiceAssignments
  >(dbInstance, pathwayServiceAssignments, 'PathwayServiceAssignment');

  const { create, update, delete: deleteAssignment } = baseRepository;

  return {
    /**
     * Creates a new pathway service assignment
     */
    create,

    /**
     * Updates a pathway service assignment
     * Note: Cannot update pathwayId or pathwayServiceId - must delete and create new assignment instead
     */
    update,

    /**
     * Deletes a pathway service assignment
     */
    delete: deleteAssignment,
  };
};

export const pathwayServiceAssignmentRepository =
  createPathwayServiceAssignmentRepository();

// TODO: We need to move this to the base repo
export const transactionalPathwayServiceAssignmentRepository = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: PgTransaction<any, any, any>,
) => createPathwayServiceAssignmentRepository(tx);
