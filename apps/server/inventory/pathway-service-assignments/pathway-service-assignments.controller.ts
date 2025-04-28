import { api } from 'encore.dev/api';
import { pathwayServiceAssignmentRepository } from './pathway-service-assignments.repository';
import {
  UpdatePathwayServiceAssignmentPayload,
  PathwayServiceAssignment,
} from './pathway-service-assignments.types';

/**
 * Updates an existing pathway service assignment's metadata
 * Only allows updating associatedCost, distanceFromOrigin, and mandatory fields
 * @param params - Object containing the assignment ID and update data
 * @param params.id - The ID of the assignment to update
 * @returns {Promise<PathwayServiceAssignment>} The updated assignment
 * @throws {APIError} If the assignment is not found or update fails
 */
export const updatePathwayServiceAssignment = api(
  { method: 'PATCH', path: '/pathway-service-assignments/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdatePathwayServiceAssignmentPayload & {
    id: number;
  }): Promise<PathwayServiceAssignment> => {
    return await pathwayServiceAssignmentRepository.update(id, data);
  },
);
