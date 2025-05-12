import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { seatDiagrams } from './seat-diagrams.schema';
import {
  CreateSeatDiagramPayload,
  SeatDiagram,
  UpdateSeatDiagramPayload,
} from './seat-diagrams.types';

/**
 * Creates a repository for managing seat diagram entities
 * @returns {Object} The base repository for seat diagram CRUD operations
 */
export const createSeatDiagramRepository = () => {
  const baseRepository = createBaseRepository<
    SeatDiagram,
    CreateSeatDiagramPayload,
    UpdateSeatDiagramPayload,
    typeof seatDiagrams
  >(db, seatDiagrams, 'Seat Diagram');

  return baseRepository;
};

// Export the seat diagram repository instance
export const seatDiagramRepository = createSeatDiagramRepository();
