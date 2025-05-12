import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { seatLayoutModels } from './seat-layout-models.schema';
import {
  CreateSeatLayoutModelPayload,
  SeatLayoutModel,
  SeatLayoutModels,
  UpdateSeatLayoutModelPayload,
} from './seat-layout-models.types';

/**
 * Creates a repository for managing seat layout model entities
 * @returns {Object} An object containing seat layout model-specific operations and base CRUD operations
 */
export const createSeatLayoutModelRepository = () => {
  const baseRepository = createBaseRepository<
    SeatLayoutModel,
    CreateSeatLayoutModelPayload,
    UpdateSeatLayoutModelPayload,
    typeof seatLayoutModels
  >(db, seatLayoutModels, 'Seat Layout Model', {
    searchableFields: [seatLayoutModels.name, seatLayoutModels.description],
  });

  const findAll = async (): Promise<SeatLayoutModels> => {
    const seatLayoutModelsList = await baseRepository.findAll({
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
    return {
      seatLayoutModels: seatLayoutModelsList,
    };
  };

  return {
    ...baseRepository,
    findAll,
  };
};

// Export the seat layout model repository instance
export const seatLayoutModelRepository = createSeatLayoutModelRepository();
