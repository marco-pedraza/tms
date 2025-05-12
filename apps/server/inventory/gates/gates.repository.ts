import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { gates } from './gates.schema';
import type { CreateGatePayload, Gate, UpdateGatePayload } from './gates.types';

/**
 * Creates a repository for managing gate entities
 * @returns {Object} An object containing gate-specific operations and base CRUD operations
 */
export const createGateRepository = () => {
  const baseRepository = createBaseRepository<
    Gate,
    CreateGatePayload,
    UpdateGatePayload,
    typeof gates
  >(db, gates, 'Gate');

  return baseRepository;
};

// Export the gate repository instance
export const gateRepository = createGateRepository();
