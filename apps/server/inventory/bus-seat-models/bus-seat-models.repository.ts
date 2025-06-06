import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { busSeatModels } from './bus-seat-models.schema';
import type {
  BusSeatModel,
  CreateBusSeatModelPayload,
  UpdateBusSeatModelPayload,
} from './bus-seat-models.types';

/**
 * Creates a repository for managing bus seat model entities
 * @returns {Object} An object containing bus seat model-specific operations and base CRUD operations
 */
export const createBusSeatModelRepository = () => {
  const baseRepository = createBaseRepository<
    BusSeatModel,
    CreateBusSeatModelPayload,
    UpdateBusSeatModelPayload,
    typeof busSeatModels
  >(db, busSeatModels, 'Bus Seat Model');

  return {
    ...baseRepository,
  };
};

// Export the bus seat model repository instance
export const busSeatModelRepository = createBusSeatModelRepository();
