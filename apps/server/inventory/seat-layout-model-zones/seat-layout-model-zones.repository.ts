import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { seatLayoutModelZones } from './seat-layout-model-zones.schema';
import {
  CreateSeatLayoutModelZonePayload,
  SeatLayoutModelZone,
  UpdateSeatLayoutModelZonePayload,
} from './seat-layout-model-zones.types';

/**
 * Creates a repository for managing seat layout model zone entities
 * @returns {Object} An object containing seat layout model zone operations
 */
export const createSeatLayoutModelZoneRepository = () => {
  const baseRepository = createBaseRepository<
    SeatLayoutModelZone,
    CreateSeatLayoutModelZonePayload,
    UpdateSeatLayoutModelZonePayload,
    typeof seatLayoutModelZones
  >(db, seatLayoutModelZones, 'Seat Layout Model Zone', {
    searchableFields: [seatLayoutModelZones.name],
  });

  /**
   * Finds a zone for a specific seat layout model by ID
   * @param seatLayoutModelId - The ID of the seat layout model
   * @param id - The ID of the zone
   * @returns Promise<SeatLayoutModelZone | null> The zone if found, otherwise null
   */
  const findOneForLayoutModel = async (
    seatLayoutModelId: number,
    id: number,
  ): Promise<SeatLayoutModelZone | null> => {
    const results = await baseRepository.findAll({
      filters: {
        id,
        seatLayoutModelId,
      },
    });

    return results.length > 0 ? results[0] : null;
  };

  return {
    ...baseRepository,
    findOneForLayoutModel,
  };
};

// Export the seat layout model zone repository instance
export const seatLayoutModelZoneRepository =
  createSeatLayoutModelZoneRepository();
