import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { busSeats } from './bus-seats.schema';
import type {
  BusSeat,
  CreateBusSeatPayload,
  UpdateBusSeatPayload,
} from './bus-seats.types';

/**
 * Creates a repository for managing bus seat entities
 * @returns {Object} An object containing bus seat-specific operations and base CRUD operations
 */
export function createBusSeatRepository() {
  const baseRepository = createBaseRepository<
    BusSeat,
    CreateBusSeatPayload,
    UpdateBusSeatPayload,
    typeof busSeats
  >(db, busSeats, 'Bus Seat');

  /**
   * Finds all active bus seats for a specific seat diagram
   * @param seatDiagramId - The ID of the seat diagram
   * @returns {Promise<BusSeat[]>} Array of active bus seats ordered by seat number
   */
  async function findActiveBySeatDiagramId(
    seatDiagramId: number,
  ): Promise<BusSeat[]> {
    return await baseRepository.findAll({
      filters: {
        seatDiagramId,
        active: true,
      },
      orderBy: [{ field: 'seatNumber', direction: 'asc' }],
    });
  }

  return {
    ...baseRepository,
    findActiveBySeatDiagramId,
  };
}

// Export the bus seat repository instance
export const busSeatRepository = createBusSeatRepository();
