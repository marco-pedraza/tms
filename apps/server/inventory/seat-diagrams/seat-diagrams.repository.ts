import { db } from '../db-service';
import { seatDiagrams } from './seat-diagrams.schema';
import {
  SeatDiagram,
  CreateSeatDiagramPayload,
  UpdateSeatDiagramPayload,
  SeatDiagrams,
  PaginatedSeatDiagrams,
} from './seat-diagrams.types';
import { PaginationParams } from '../../shared/types';
import { createBaseRepository } from '@repo/base-repo';

/**
 * Creates a repository for managing seat diagram entities
 * @returns {Object} An object containing seat diagram-specific operations and base CRUD operations
 */
export const createSeatDiagramRepository = () => {
  const baseRepository = createBaseRepository<
    SeatDiagram,
    CreateSeatDiagramPayload,
    UpdateSeatDiagramPayload,
    typeof seatDiagrams
  >(db, seatDiagrams, 'Seat Diagram');

  /**
   * Create a new seat diagram
   * @param data - Data for the new seat diagram
   * @returns The created seat diagram
   */
  const create = async (
    data: CreateSeatDiagramPayload,
  ): Promise<SeatDiagram> => {
    return await baseRepository.create(data);
  };

  /**
   * Update an existing seat diagram
   * @param id - The ID of the seat diagram to update
   * @param data - Data to update the seat diagram with
   * @returns The updated seat diagram
   * @throws {NotFoundError} If no seat diagram with the given ID exists
   */
  const update = async (
    id: number,
    data: UpdateSeatDiagramPayload,
  ): Promise<SeatDiagram> => {
    return await baseRepository.update(id, data);
  };

  /**
   * Get a paginated list of seat diagrams
   * @param params - Pagination parameters
   * @returns Paginated list of seat diagrams
   */
  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedSeatDiagrams> => {
    return await baseRepository.findAllPaginated(params);
  };

  /**
   * Find all seat diagrams
   * @returns List of all seat diagrams
   */
  const findAll = async (): Promise<SeatDiagrams> => {
    const diagrams = await baseRepository.findAll({
      orderBy: [{ field: 'diagramNumber', direction: 'asc' }],
    });

    return {
      seatDiagrams: diagrams,
    };
  };

  return {
    ...baseRepository,
    create,
    update,
    findAllPaginated,
    findAll,
  };
};

// Export the seat diagram repository instance
export const seatDiagramRepository = createSeatDiagramRepository();
