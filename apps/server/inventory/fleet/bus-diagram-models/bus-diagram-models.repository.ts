import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { busDiagramModels } from './bus-diagram-models.schema';
import {
  BusDiagramModel,
  CreateBusDiagramModelPayload,
  UpdateBusDiagramModelPayload,
} from './bus-diagram-models.types';

/**
 * Creates a repository for managing bus diagram model entities
 * @returns {Object} An object containing bus diagram model-specific operations and base CRUD operations
 */
const createBusDiagramModelRepository = () => {
  const baseRepository = createBaseRepository<
    BusDiagramModel,
    CreateBusDiagramModelPayload,
    UpdateBusDiagramModelPayload,
    typeof busDiagramModels
  >(db, busDiagramModels, 'Bus Diagram Model', {
    searchableFields: [busDiagramModels.name],
    softDeleteEnabled: true,
    checkDependenciesOnSoftDelete: false,
  });

  return baseRepository;
};

// Export the bus diagram model repository instance
export const busDiagramModelRepository = createBusDiagramModelRepository();
