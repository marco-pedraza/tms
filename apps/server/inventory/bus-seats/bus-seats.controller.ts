import { api } from 'encore.dev/api';
import { busSeatRepository } from './bus-seats.repository';
import {
  CreateBusSeatPayload,
  CreateBusSeatBatchPayload,
  UpdateBusSeatPayload,
  BusSeat,
  BusSeats,
} from './bus-seats.types';

/**
 * Creates a new bus seat.
 * @param params - The bus seat data to create
 * @returns {Promise<BusSeat>} The created bus seat
 * @throws {APIError} If the bus seat creation fails
 */
export const createBusSeat = api(
  { expose: true, method: 'POST', path: '/bus-seats' },
  async (params: CreateBusSeatPayload): Promise<BusSeat> => {
    return await busSeatRepository.create(params);
  },
);

/**
 * Creates multiple bus seats in a batch.
 * @param params - Object containing array of bus seats to create
 * @returns {Promise<BusSeats>} The created bus seats
 * @throws {APIError} If any seat creation fails
 */
export const createBusSeatsBatch = api(
  { expose: true, method: 'POST', path: '/bus-seats/batch' },
  async (params: CreateBusSeatBatchPayload): Promise<BusSeats> => {
    return await busSeatRepository.createBatch(params.seats);
  },
);

/**
 * Retrieves a bus seat by its ID.
 * @param params - Object containing the bus seat ID
 * @param params.id - The ID of the bus seat to retrieve
 * @returns {Promise<BusSeat>} The found bus seat
 * @throws {APIError} If the bus seat is not found or retrieval fails
 */
export const getBusSeat = api(
  { expose: true, method: 'GET', path: '/bus-seats/:id' },
  async ({ id }: { id: number }): Promise<BusSeat> => {
    return await busSeatRepository.findOne(id);
  },
);

/**
 * Retrieves bus seats by seat diagram ID.
 * @param params - Object containing the seat diagram ID
 * @param params.seatDiagramId - The ID of the seat diagram to retrieve seats for
 * @returns {Promise<BusSeats>} Object containing array of bus seats
 * @throws {APIError} If retrieval fails
 */
export const listBusSeatsBySeatDiagram = api(
  {
    expose: true,
    method: 'GET',
    path: '/bus-seats/by-seat-diagram/:seatDiagramId',
  },
  async ({ seatDiagramId }: { seatDiagramId: number }): Promise<BusSeats> => {
    return await busSeatRepository.findAllBySeatDiagram(seatDiagramId);
  },
);

/**
 * Updates an existing bus seat.
 * @param params - Object containing the bus seat ID and update data
 * @param params.id - The ID of the bus seat to update
 * @param params.data - The bus seat data to update
 * @returns {Promise<BusSeat>} The updated bus seat
 * @throws {APIError} If the bus seat is not found or update fails
 */
export const updateBusSeat = api(
  { expose: true, method: 'PUT', path: '/bus-seats/:id' },
  async ({
    id,
    ...data
  }: UpdateBusSeatPayload & { id: number }): Promise<BusSeat> => {
    return await busSeatRepository.update(id, data);
  },
);

/**
 * Deletes a bus seat by its ID.
 * @param params - Object containing the bus seat ID
 * @param params.id - The ID of the bus seat to delete
 * @returns {Promise<BusSeat>} The deleted bus seat
 * @throws {APIError} If the bus seat is not found or deletion fails
 */
export const deleteBusSeat = api(
  { expose: true, method: 'DELETE', path: '/bus-seats/:id' },
  async ({ id }: { id: number }): Promise<BusSeat> => {
    return await busSeatRepository.delete(id);
  },
);
