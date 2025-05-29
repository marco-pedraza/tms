import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { busDiagramModelZones } from './bus-diagram-model-zones.schema';
import {
  BusDiagramModelZone,
  CreateBusDiagramModelZonePayload,
  UpdateBusDiagramModelZonePayload,
} from './bus-diagram-model-zones.types';

/**
 * Creates a repository for managing bus diagram model zone entities
 * @returns {Object} An object containing bus diagram model zone operations
 */
export const createBusDiagramModelZoneRepository = () => {
  const baseRepository = createBaseRepository<
    BusDiagramModelZone,
    CreateBusDiagramModelZonePayload,
    UpdateBusDiagramModelZonePayload,
    typeof busDiagramModelZones
  >(db, busDiagramModelZones, 'Bus Diagram Model Zone', {
    searchableFields: [busDiagramModelZones.name],
  });

  /**
   * Finds a zone for a specific bus diagram model by ID
   * @param busDiagramModelId - The ID of the bus diagram model
   * @param id - The ID of the zone
   * @returns Promise<BusDiagramModelZone | null> The zone if found, otherwise null
   */
  const findOneForDiagramModel = async (
    busDiagramModelId: number,
    id: number,
  ): Promise<BusDiagramModelZone | null> => {
    const results = await baseRepository.findAll({
      filters: {
        id,
        busDiagramModelId,
      },
    });

    return results.length > 0 ? results[0] : null;
  };

  return {
    ...baseRepository,
    findOneForDiagramModel,
  };
};

// Export the bus diagram model zone repository instance
export const busDiagramModelZoneRepository =
  createBusDiagramModelZoneRepository();
