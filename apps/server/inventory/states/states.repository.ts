import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
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

  return baseRepository;
};

// Export the state repository instance
export const stateRepository = createStateRepository();
