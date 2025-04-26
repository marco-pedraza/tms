import { pathwayServiceAssignmentRepository } from '../pathway-service-assignments/pathway-service-assignments.repository';
import {
  CreatePathwayServiceAssignmentPayload,
  DeletePathwayServiceAssignmentPayload,
} from '../pathway-service-assignments/pathway-service-assignments.types';
import { pathwayRepository } from './pathways.repository';

export const createPathwayUseCases = () => {
  const assignServicesToPathway = async (
    data: CreatePathwayServiceAssignmentPayload,
  ) => {
    const { pathwayId } = data;
    const pathway =
      await pathwayRepository.findOneWithServiceAssignments(pathwayId);

    const currentServiceAssignments = pathway.pathwayServiceAssignments;
    const lastSequence =
      Math.max(0, ...currentServiceAssignments.map((a) => a.sequence)) + 1;

    await pathwayServiceAssignmentRepository.create({
      ...data,
      sequence: lastSequence,
    });

    const updatedPathway =
      await pathwayRepository.findOneWithServiceAssignments(pathwayId);

    return updatedPathway;
  };

  const unassignServiceFromPathway = async (
    data: DeletePathwayServiceAssignmentPayload,
  ) => {
    const { pathwayId, assignmentId } = data;

    // Get current pathway state before modifications
    const pathway =
      await pathwayRepository.findOneWithServiceAssignments(pathwayId);
    const assignments = pathway.pathwayServiceAssignments;

    // Prepare the assignments that will need sequence updates
    const remainingAssignments = assignments
      .filter((a) => a.id !== assignmentId)
      .sort((a, b) => a.sequence - b.sequence);

    // Use transaction to ensure all operations (delete + sequence updates) are atomic
    await pathwayServiceAssignmentRepository.transaction(async (txRepo) => {
      await txRepo.delete(assignmentId);

      // Update sequences for remaining assignments
      for (let i = 0; i < remainingAssignments.length; i++) {
        const assignment = remainingAssignments[i];
        if (assignment.sequence !== i + 1) {
          await txRepo.update(assignment.id, {
            sequence: i + 1,
          });
        }
      }
    });

    // Get the updated pathway after all changes
    const updatedPathway =
      await pathwayRepository.findOneWithServiceAssignments(pathwayId);

    return updatedPathway;
  };

  return {
    assignServicesToPathway,
    unassignServiceFromPathway,
  };
};

export const pathwayUseCases = createPathwayUseCases();
