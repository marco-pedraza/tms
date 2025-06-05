import { busSeatModelUseCases } from '../bus-seat-models/bus-seat-models.use-cases';
import type {
  BusDiagramModel,
  CreateBusDiagramModelPayload,
} from './bus-diagram-models.types';
import { busDiagramModelRepository } from './bus-diagram-models.repository';

/**
 * Creates use cases for bus diagram models
 * @returns Object with bus diagram model-specific use case functions
 */
export function createBusDiagramModelUseCases() {
  /**
   * Creates a new bus diagram model and automatically generates seat models in a single transaction.
   * This ensures atomicity between diagram model creation and seat model generation.
   * @param params - Data for the new bus diagram model
   * @returns {Promise<BusDiagramModel>} The created bus diagram model
   * @throws {ValidationError} If creation fails or validation fails
   */
  async function createBusDiagramModelWithSeats(
    params: CreateBusDiagramModelPayload,
  ): Promise<BusDiagramModel> {
    // Use transaction to ensure atomicity between diagram model and seat models creation
    return await busDiagramModelRepository
      .transaction(async (txRepo, tx) => {
        // Create the bus diagram model within transaction
        const createdModel = await txRepo.create(params);

        // Create seat models using the existing use case
        // If this fails, the whole transaction will be rolled back
        await busSeatModelUseCases.createSeatModelsFromDiagramModel(
          createdModel.id,
          tx,
        );

        // Return the diagram model ID for post-transaction retrieval
        return createdModel.id;
      })
      .then(async (diagramModelId: number) => {
        // After transaction completes successfully, retrieve the complete diagram model
        return await busDiagramModelRepository.findOne(diagramModelId);
      });
  }

  return {
    createBusDiagramModelWithSeats,
  };
}

// Export the use case instance
export const busDiagramModelUseCases = createBusDiagramModelUseCases();
