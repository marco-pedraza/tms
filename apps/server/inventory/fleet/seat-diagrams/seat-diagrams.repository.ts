import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { seatDiagrams } from './seat-diagrams.schema';
import {
  CreateSeatDiagramPayload,
  SeatDiagram,
  UpdateSeatDiagramPayload,
} from './seat-diagrams.types';

/**
 * Creates a repository for managing seat diagram entities
 * @returns {Object} An object containing seat diagram-specific operations and base CRUD operations
 */
export function createSeatDiagramRepository() {
  const baseRepository = createBaseRepository<
    SeatDiagram,
    CreateSeatDiagramPayload,
    UpdateSeatDiagramPayload,
    typeof seatDiagrams
  >(db, seatDiagrams, 'Seat Diagram', {
    searchableFields: [seatDiagrams.name],
  });

  return {
    ...baseRepository,
  };
}

// Export the seat diagram repository instance
export const seatDiagramRepository = createSeatDiagramRepository();
