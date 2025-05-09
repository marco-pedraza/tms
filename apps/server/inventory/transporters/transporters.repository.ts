import { transporters } from './transporters.schema';
import type {
  Transporter,
  CreateTransporterPayload,
  UpdateTransporterPayload,
} from './transporters.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';

/**
 * Creates a repository for managing transporter entities
 * @returns {Object} An object containing transporter-specific operations and base CRUD operations
 */
export const createTransporterRepository = () => {
  const baseRepository = createBaseRepository<
    Transporter,
    CreateTransporterPayload,
    UpdateTransporterPayload,
    typeof transporters
  >(db, transporters, 'Transporter', {
    searchableFields: [transporters.name, transporters.code],
  });

  return baseRepository;
};

// Export the transporter repository instance
export const transporterRepository = createTransporterRepository();
