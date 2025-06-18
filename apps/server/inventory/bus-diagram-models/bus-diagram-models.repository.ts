import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { busDiagramModels } from './bus-diagram-models.schema';
import {
  BusDiagramModel,
  BusDiagramModels,
  CreateBusDiagramModelPayload,
  UpdateBusDiagramModelPayload,
} from './bus-diagram-models.types';

/**
 * Creates a repository for managing bus diagram model entities
 * @returns {Object} An object containing bus diagram model-specific operations and base CRUD operations
 */
export const createBusDiagramModelRepository = () => {
  const baseRepository = createBaseRepository<
    BusDiagramModel,
    CreateBusDiagramModelPayload,
    UpdateBusDiagramModelPayload,
    typeof busDiagramModels
  >(db, busDiagramModels, 'Bus Diagram Model', {
    searchableFields: [busDiagramModels.name],
  });

  async function findAll(): Promise<BusDiagramModels> {
    const busDiagramModelsList = await baseRepository.findAll({
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
    return {
      busDiagramModels: busDiagramModelsList,
    };
  }

  return {
    ...baseRepository,
    findAll,
  };
};

// Export the bus diagram model repository instance
export const busDiagramModelRepository = createBusDiagramModelRepository();
