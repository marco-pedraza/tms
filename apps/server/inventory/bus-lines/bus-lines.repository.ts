import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { busLines } from './bus-lines.schema';
import type {
  BusLine,
  CreateBusLinePayload,
  UpdateBusLinePayload,
} from './bus-lines.types';

/**
 * Creates a repository for managing bus line entities
 * @returns {Object} An object containing bus line-specific operations and base CRUD operations
 */
export const createBusLineRepository = () => {
  const baseRepository = createBaseRepository<
    BusLine,
    CreateBusLinePayload,
    UpdateBusLinePayload,
    typeof busLines
  >(db, busLines, 'Bus Line', {
    searchableFields: [busLines.name, busLines.code],
  });

  return baseRepository;
};

// Export the bus line repository instance
export const busLineRepository = createBusLineRepository();
