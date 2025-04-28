import { pathways } from './pathways.schema';
import type {
  Pathway,
  CreatePathwayPayload,
  UpdatePathwayPayload,
  PathwayWithServiceAssignments,
} from './pathways.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../../shared/errors';

export const createPathwayRepository = () => {
  const baseRepository = createBaseRepository<
    Pathway,
    CreatePathwayPayload,
    UpdatePathwayPayload,
    typeof pathways
  >(db, pathways, 'Pathway');

  /**
   * Finds a pathway by ID and includes its service assignments and associated services
   *
   * @param id - The ID of the pathway to find
   * @returns A pathway object with its services and assignment details
   * @throws {NotFoundError} If no pathway is found with the given ID
   *
   * The returned pathway includes:
   * - Basic pathway information
   * - An array of services, each containing:
   *   - Service details
   *   - Assignment metadata (sequence, distance, cost, mandatory status)
   */
  const findOneWithServiceAssignments = async (
    id: number,
  ): Promise<PathwayWithServiceAssignments> => {
    const result = (await db.query.pathways.findFirst({
      where: eq(pathways.id, id),
      with: {
        pathwayServiceAssignments: {
          with: {
            pathwayService: true,
          },
          orderBy: (assignments) => assignments.sequence,
        },
      },
    })) as PathwayWithServiceAssignments;

    if (!result) {
      throw new NotFoundError(`Pathway with id ${id} not found`);
    }

    return result;
  };

  return {
    ...baseRepository,
    findOneWithServiceAssignments,
  };
};

export const pathwayRepository = createPathwayRepository();
