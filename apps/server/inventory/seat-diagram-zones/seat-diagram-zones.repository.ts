import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { seatDiagramZones } from './seat-diagram-zones.schema';
import {
  CreateSeatDiagramZonePayload,
  SeatDiagramZone,
  UpdateSeatDiagramZonePayload,
} from './seat-diagram-zones.types';

/**
 * Creates a repository for managing seat diagram zone entities
 * @returns {Object} An object containing seat diagram zone operations and base CRUD operations
 */
export const createSeatDiagramZoneRepository = () => {
  const baseRepository = createBaseRepository<
    SeatDiagramZone,
    CreateSeatDiagramZonePayload,
    UpdateSeatDiagramZonePayload,
    typeof seatDiagramZones
  >(db, seatDiagramZones, 'Seat Diagram Zone', {
    searchableFields: [seatDiagramZones.name],
  });

  /**
   * Finds a zone for a specific seat diagram by ID
   * @param seatDiagramId - The ID of the seat diagram
   * @param id - The ID of the zone
   * @returns Promise<SeatDiagramZone | null> The zone if found, otherwise null
   */
  const findOneForDiagram = async (
    seatDiagramId: number,
    id: number,
  ): Promise<SeatDiagramZone | null> => {
    const results = await baseRepository.findAll({
      filters: {
        id,
        seatDiagramId,
      },
    });

    return results.length > 0 ? results[0] : null;
  };

  return {
    ...baseRepository,
    findOneForDiagram,
  };
};

// Export the seat diagram zone repository instance
export const seatDiagramZoneRepository = createSeatDiagramZoneRepository();
