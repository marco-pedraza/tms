import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { states } from './states.schema';
import type {
  CreateStatePayload,
  State,
  UpdateStatePayload,
} from './states.types';

/**
 * Creates a repository for managing state entities
 * @returns {Object} An object containing state-specific operations and base CRUD operations
 */
export const createStateRepository = () => {
  const baseRepository = createBaseRepository<
    State,
    CreateStatePayload,
    UpdateStatePayload,
    typeof states
  >(db, states, 'State', {
    searchableFields: [states.name, states.code],
    softDeleteEnabled: true,
  });

  /**
   * Gets state code for slug generation
   * @param stateId - The ID of the state
   * @returns The state code
   * @throws {NotFoundError} If the state is not found
   */
  const getStateCode = async (stateId: number): Promise<string> => {
    const state = await db.query.states.findFirst({
      where: (states, { eq, and, isNull }) =>
        and(eq(states.id, stateId), isNull(states.deletedAt)),
      columns: { code: true },
    });

    if (!state) {
      throw new NotFoundError(`State with id ${stateId} not found`);
    }

    return state.code;
  };

  return {
    ...baseRepository,
    getStateCode,
  };
};

// Export the state repository instance
export const stateRepository = createStateRepository();
