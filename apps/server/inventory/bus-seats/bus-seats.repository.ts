import { busSeats } from './bus-seats.schema';
import type {
  BusSeat,
  CreateBusSeatPayload,
  UpdateBusSeatPayload,
  BusSeats,
  PaginatedBusSeats,
} from './bus-seats.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

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
   * Creates a new bus seat
   * @param data - The bus seat data to create
   * @returns {Promise<BusSeat>} The created bus seat
   */
  const create = async (data: CreateBusSeatPayload): Promise<BusSeat> => {
    return await baseRepository.create(data);
  };

  /**
   * Updates a bus seat
   * @param id - The ID of the bus seat to update
   * @param data - The bus seat data to update
   * @returns {Promise<BusSeat>} The updated bus seat
   */
  const update = async (
    id: number,
    data: UpdateBusSeatPayload,
  ): Promise<BusSeat> => {
    return await baseRepository.update(id, data);
  };

  /**
   * Retrieves all bus seats with pagination
   * @param params - Pagination parameters
   * @returns {Promise<PaginatedBusSeats>} Paginated list of bus seats
   */
  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedBusSeats> => {
    return await baseRepository.findAllPaginated(params);
  };

  /**
   * Retrieves all bus seats
   * @returns {Promise<BusSeats>} Object containing array of bus seats
   */
  const findAll = async (): Promise<BusSeats> => {
    const busSeatsList = await baseRepository.findAll();
    return {
      busSeats: busSeatsList,
    };
  };

  /**
   * Finds seats by model ID
   * @param modelId - The model ID to filter by
   * @returns {Promise<BusSeats>} Object containing array of seats for the specified model
   */
  const findAllByModel = async (modelId: number): Promise<BusSeats> => {
    const results = await baseRepository.findAllBy(busSeats.modelId, modelId, {
      orderBy: [{ field: busSeats.seatNumber, direction: 'asc' }],
    });

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
    create,
    update,
    findAll,
    findAllPaginated,
    findAllByModel,
    createBatch,
  };
};

// Export the bus seat repository instance
export const busSeatRepository = createBusSeatRepository();
