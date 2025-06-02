import { api } from 'encore.dev/api';
import { PaginationParams } from '../../shared/types';
import {
  PaginatedSeatDiagrams,
  SeatConfiguration,
  SeatDiagram,
  SeatDiagrams,
  UpdateSeatDiagramPayload,
} from './seat-diagrams.types';
import { seatDiagramRepository } from './seat-diagrams.repository';
import { seatDiagramUseCases } from './seat-diagrams.use-cases';

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
    const diagrams = await seatDiagramRepository.findAll();
    return { seatDiagrams: diagrams };
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
