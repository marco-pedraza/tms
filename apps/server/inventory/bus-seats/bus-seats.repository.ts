import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { busSeats } from './bus-seats.schema';
import type {
  BusSeat,
  BusSeats,
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
   * Finds seats by seat diagram ID
   * @param seatDiagramId - The seat diagram ID to filter by
   * @returns {Promise<BusSeats>} Object containing array of seats for the specified seat diagram
   */
  function findAllBySeatDiagram(seatDiagramId: number): Promise<BusSeats> {
    return baseRepository
      .findAllBy(busSeats.seatDiagramId, seatDiagramId, {
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      })
      .then((results) => ({ busSeats: results }));
  }

  /**
   * Creates multiple bus seats in a batch
   * @param data - Array of bus seat data to create
   * @returns {Promise<BusSeats>} Object containing array of created bus seats
   */
  function createBatch(data: CreateBusSeatPayload[]): Promise<BusSeats> {
    return baseRepository.transaction(async (txRepo) => {
      const createdSeats = await Promise.all(
        data.map((seatData) => txRepo.create(seatData)),
      );

      return { busSeats: createdSeats };
    });
  }

  return {
    ...baseRepository,
    findAllBySeatDiagram,
    createBatch,
  };
}

// Export the bus seat repository instance
export const busSeatRepository = createBusSeatRepository();
