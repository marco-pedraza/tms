import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { busSeatModels } from './bus-seat-models.schema';
import type {
  BusSeatModel,
  BusSeatModels,
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

  /**
   * Creates multiple bus seat models in a batch transaction
   * @param data - Array of bus seat model creation payloads
   * @returns Promise resolving to the created bus seat models
   */
  function createBatch(
    data: CreateBusSeatModelPayload[],
  ): Promise<BusSeatModels> {
    return baseRepository.transaction(async (txRepo) => {
      const createdSeatModels = await Promise.all(
        data.map(async (seatModelData) => await txRepo.create(seatModelData)),
      );

      return {
        busSeatModels: createdSeatModels,
      };
    });
  }

  return {
    ...baseRepository,
    createBatch,
  };
};

// Export the bus seat model repository instance
export const busSeatModelRepository = createBusSeatModelRepository();
