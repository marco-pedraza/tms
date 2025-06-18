import { api } from 'encore.dev/api';
import { busSeatRepository } from '../bus-seats/bus-seats.repository';
import {
  UpdateSeatConfigurationPayload,
  UpdatedSeatConfiguration,
} from '../bus-seats/bus-seats.types';
import { BusSeats } from '../bus-seats/bus-seats.types';
import { busSeatUseCases } from '../bus-seats/bus-seats.use-cases';
import { SeatDiagram, UpdateSeatDiagramPayload } from './seat-diagrams.types';
import { seatDiagramRepository } from './seat-diagrams.repository';

/**
 * Retrieves a seat diagram by its ID.
 * @param params - Object containing the seat diagram ID
 * @param params.id - The ID of the seat diagram to retrieve
 * @returns {Promise<SeatDiagram>} The requested seat diagram
 * @throws {APIError} If retrieval fails or the seat diagram doesn't exist
 */
export const getSeatDiagram = api(
  { expose: true, method: 'GET', path: '/seat-diagrams/:id' },
  async ({ id }: { id: number }): Promise<SeatDiagram> => {
    return await seatDiagramRepository.findOne(id);
  },
);

/**
 * Updates an existing seat diagram.
 * @param params - Object containing the seat diagram ID and update data
 * @param params.id - The ID of the seat diagram to update
 * @param params.data - The seat diagram data to update
 * @returns {Promise<SeatDiagram>} The updated seat diagram
 * @throws {APIError} If update fails, validation fails, or the seat diagram doesn't exist
 */
export const updateSeatDiagram = api(
  { expose: true, method: 'PATCH', path: '/seat-diagrams/:id' },
  async ({
    id,
    ...data
  }: UpdateSeatDiagramPayload & {
    id: number;
  }): Promise<SeatDiagram> => {
    // Mark diagram as modified when any changes are made
    const updateData = {
      ...data,
      isModified: true,
    };

    return await seatDiagramRepository.update(id, updateData);
  },
);

/**
 * Deletes a seat diagram by its ID.
 * @param params - Object containing the seat diagram ID
 * @param params.id - The ID of the seat diagram to delete
 * @returns {Promise<SeatDiagram>} The deleted seat diagram
 * @throws {APIError} If deletion fails or the seat diagram doesn't exist
 */
export const deleteSeatDiagram = api(
  { expose: true, method: 'DELETE', path: '/seat-diagrams/:id' },
  async ({ id }: { id: number }): Promise<SeatDiagram> => {
    return await seatDiagramRepository.delete(id);
  },
);

/**
 * Updates the seat configuration of an operational seat layout in a single batch operation.
 * @param params - Object containing the seat diagram ID and seat configurations
 * @param params.id - The ID of the seat diagram to update
 * @param params.seats - Array of seat configurations to update/create/deactivate
 * @returns {Promise<UpdatedSeatConfiguration>} Statistics about the update operation and updated bus seats
 * @throws {APIError} If the update fails, validation fails, or the seat diagram doesn't exist
 */
export const updateSeatDiagramConfiguration = api(
  { expose: true, method: 'PUT', path: '/seat-diagrams/:id/update-seats' },
  async ({
    id,
    seats,
  }: {
    id: number;
  } & UpdateSeatConfigurationPayload): Promise<UpdatedSeatConfiguration> => {
    return await busSeatUseCases.batchUpdateSeatConfiguration(id, seats);
  },
);

/**
 * Retrieves all seats for a specific seat diagram.
 * @param params - Object containing the seat diagram ID
 * @param params.id - The ID of the seat diagram to get seats for
 * @returns {Promise<BusSeats>} Object containing array of bus seats
 * @throws {APIError} If retrieval fails or the seat diagram doesn't exist
 */
export const getSeatDiagramSeats = api(
  { expose: true, method: 'GET', path: '/seat-diagrams/:id/seats' },
  async ({ id }: { id: number }): Promise<BusSeats> => {
    // Verify the seat diagram exists first
    await seatDiagramRepository.findOne(id);

    // Get all active bus seats for this seat diagram
    const busSeats = await busSeatRepository.findActiveBySeatDiagramId(id);

    return {
      busSeats,
    };
  },
);
