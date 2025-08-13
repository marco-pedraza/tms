import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
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

  /**
   * Finds all active bus seat models for a specific bus diagram model
   * @param busDiagramModelId - The ID of the bus diagram model
   * @returns {Promise<BusSeatModel[]>} Array of active bus seat models ordered by seat number
   */
  async function findActiveByBusDiagramModelId(
    busDiagramModelId: number,
  ): Promise<BusSeatModel[]> {
    return await baseRepository.findAll({
      filters: {
        busDiagramModelId,
        active: true,
      },
      orderBy: [{ field: 'seatNumber', direction: 'asc' }],
    });
  }

  return {
    ...baseRepository,
    findActiveByBusDiagramModelId,
  };
};

// Export the bus seat model repository instance
export const busSeatModelRepository = createBusSeatModelRepository();
