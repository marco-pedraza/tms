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
export const createBusSeatRepository = () => {
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
  const findAllBySeatDiagram = async (
    seatDiagramId: number,
  ): Promise<BusSeats> => {
    const results = await baseRepository.findAllBy(
      busSeats.seatDiagramId,
      seatDiagramId,
      {
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      },
    );

    return {
      busSeats: results,
    };
  };

  /**
   * Creates multiple bus seats in a batch
   * @param data - Array of bus seat data to create
   * @returns {Promise<BusSeats>} Object containing array of created bus seats
   */
  const createBatch = async (
    data: CreateBusSeatPayload[],
  ): Promise<BusSeats> => {
    return await db.transaction(async (tx) => {
      // Create a local baseRepository that uses the transaction
      const txBaseRepository = createBaseRepository<
        BusSeat,
        CreateBusSeatPayload,
        UpdateBusSeatPayload,
        typeof busSeats
      >(tx, busSeats, 'Bus Seat');

      const createdSeats = await Promise.all(
        data.map(async (seatData) => await txBaseRepository.create(seatData)),
      );

      return {
        busSeats: createdSeats,
      };
    });
  };

  return {
    ...baseRepository,
    findAllBySeatDiagram,
    createBatch,
  };
};

// Export the bus seat repository instance
export const busSeatRepository = createBusSeatRepository();
