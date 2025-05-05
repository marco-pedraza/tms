import { api } from 'encore.dev/api';
import {
  SeatDiagram,
  CreateSeatDiagramPayload,
  UpdateSeatDiagramPayload,
  SeatDiagrams,
  PaginatedSeatDiagrams,
  SeatConfiguration,
} from './seat-diagrams.types';
import { seatDiagramRepository } from './seat-diagrams.repository';
import { PaginationParams } from '../../shared/types';
import { seatDiagramUseCases } from './seat-diagrams.use-cases';

/**
 * Creates a new seat diagram.
 * @param payload - Data for the new seat diagram
 * @returns {Promise<SeatDiagram>} The created seat diagram
 * @throws {APIError} If creation fails or validation fails
 */
export const createSeatDiagram = api(
  { method: 'POST', path: '/seat-diagrams', expose: true },
  async (payload: CreateSeatDiagramPayload): Promise<SeatDiagram> => {
    return await seatDiagramRepository.create(payload);
  },
);

/**
 * Retrieves a seat diagram by its ID.
 * @param id - The ID of the seat diagram to retrieve
 * @returns {Promise<SeatDiagram>} The requested seat diagram
 * @throws {APIError} If retrieval fails or the seat diagram doesn't exist
 */
export const getSeatDiagram = api(
  { method: 'GET', path: '/seat-diagrams/:id', expose: true },
  async ({ id }: { id: number }): Promise<SeatDiagram> => {
    return await seatDiagramRepository.findOne(id);
  },
);

/**
 * Retrieves all seat diagrams.
 * @returns {Promise<SeatDiagrams>} List of all seat diagrams
 * @throws {APIError} If retrieval fails
 */
export const listSeatDiagrams = api(
  { method: 'GET', path: '/seat-diagrams', expose: true },
  async (): Promise<SeatDiagrams> => {
    return await seatDiagramRepository.findAll();
  },
);

/**
 * Retrieves seat diagrams with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedSeatDiagrams>} Paginated list of seat diagrams
 * @throws {APIError} If retrieval fails
 */
export const listSeatDiagramsPaginated = api(
  { method: 'GET', path: '/seat-diagrams/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedSeatDiagrams> => {
    return await seatDiagramRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing seat diagram.
 * @param id - The ID of the seat diagram to update
 * @param payload - Data to update the seat diagram with
 * @returns {Promise<SeatDiagram>} The updated seat diagram
 * @throws {APIError} If update fails, validation fails, or the seat diagram doesn't exist
 */
export const updateSeatDiagram = api(
  { method: 'PATCH', path: '/seat-diagrams/:id', expose: true },
  async ({
    id,
    ...payload
  }: UpdateSeatDiagramPayload & { id: number }): Promise<SeatDiagram> => {
    return await seatDiagramRepository.update(id, payload);
  },
);

/**
 * Deletes an existing seat diagram.
 * @param id - The ID of the seat diagram to delete
 * @returns {Promise<SeatDiagram>} The deleted seat diagram
 * @throws {APIError} If deletion fails or the seat diagram doesn't exist
 */
export const deleteSeatDiagram = api(
  { method: 'DELETE', path: '/seat-diagrams/:id', expose: true },
  async ({ id }: { id: number }): Promise<SeatDiagram> => {
    return await seatDiagramRepository.delete(id);
  },
);

/**
 * Gets the seat configuration for a seat diagram.
 * @param params - Object containing the seat diagram ID
 * @param params.id - The ID of the seat diagram to get configuration for
 * @returns {Promise<SeatConfiguration>} The seat configuration
 * @throws {APIError} If the seat diagram is not found or retrieval fails
 */
export const getSeatDiagramConfiguration = api(
  {
    method: 'GET',
    path: '/seat-diagrams/:id/seat-configuration',
    expose: true,
  },
  async ({ id }: { id: number }): Promise<SeatConfiguration> => {
    return await seatDiagramUseCases.buildSeatConfiguration(id);
  },
);

/**
 * Creates physical bus seat records from the theoretical seat configuration of a seat diagram.
 * @param params - Object containing the seat diagram ID
 * @param params.id - The ID of the seat diagram to create seats for
 * @returns {Promise<{seatsCreated: number}>} The number of seats created
 * @throws {APIError} If the seat diagram is not found or seat creation fails
 */
export const createSeatsFromDiagramConfiguration = api(
  { method: 'POST', path: '/seat-diagrams/:id/create-seats', expose: true },
  async ({ id }: { id: number }): Promise<{ seatsCreated: number }> => {
    const seatsCreated =
      await seatDiagramUseCases.createSeatsFromTheoreticalConfiguration(id);
    return { seatsCreated };
  },
);
