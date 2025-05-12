import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { pathwayServiceAssignments } from './pathway-service-assignments.schema';
import type {
  CreatePathwayServiceAssignmentPayload,
  PathwayServiceAssignment,
  UpdatePathwayServiceAssignmentPayload,
} from './pathway-service-assignments.types';

/**
 * Defining internal types to avoid exposing the sequence number to the outside world
 */
type CreatePathwayServiceAssignmentPayloadWithSequence =
  CreatePathwayServiceAssignmentPayload & { sequence: number };

type UpdatePathwayServiceAssignmentPayloadWithSequence =
  UpdatePathwayServiceAssignmentPayload & { sequence: number };

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
export const createPathwayServiceAssignmentRepository = () => {
  const baseRepository = createBaseRepository<
    PathwayServiceAssignment,
    CreatePathwayServiceAssignmentPayloadWithSequence,
    UpdatePathwayServiceAssignmentPayloadWithSequence,
    typeof pathwayServiceAssignments
  >(db, pathwayServiceAssignments, 'PathwayServiceAssignment');

  const {
    create,
    update,
    delete: deleteAssignment,
    transaction,
  } = baseRepository;

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

    /**
     * Executes operations within a transaction
     */
    transaction,
  };
};

export const pathwayServiceAssignmentRepository =
  createPathwayServiceAssignmentRepository();
