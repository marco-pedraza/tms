import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { busModels } from './bus-models.schema';
import type {
  BusModel,
  CreateBusModelPayload,
  UpdateBusModelPayload,
} from './bus-models.types';

/**
 * Creates a repository for managing bus model entities
 * @returns {Object} An object containing bus model-specific operations and base CRUD operations
 */
export const createBusModelRepository = () => {
  const baseRepository = createBaseRepository<
    BusModel,
    CreateBusModelPayload,
    UpdateBusModelPayload,
    typeof busModels
  >(db, busModels, 'Bus Model', {
    searchableFields: [busModels.manufacturer, busModels.model],
    softDeleteEnabled: true,
  });

  return {
    ...baseRepository,
  };
};

// Export the bus model repository instance
export const busModelRepository = createBusModelRepository();
