import type { BusModel } from './bus-models.types';
import { busModelRepository } from './bus-models.repository';

/**
 * Public integration type for bus models
 * Exposes only the fields needed for cross-service integration
 */
export type BusModelIntegration = Pick<
  BusModel,
  | 'id'
  | 'manufacturer'
  | 'model'
  | 'year'
  | 'seatingCapacity'
  | 'trunkCapacity'
  | 'fuelEfficiency'
  | 'maxCapacity'
  | 'numFloors'
  | 'engineType'
  | 'active'
>;

/**
 * Bus Models Integration Service
 *
 * Provides controlled access to bus models for other bounded contexts.
 * This is the ONLY way other services should access bus model data.
 *
 * @internal This API is for cross-service integration only
 */
export const busModelsIntegration = {
  /**
   * Retrieves a single bus model by ID
   * @param id - The ID of the bus model
   * @returns The bus model data
   * @throws {NotFoundError} If the bus model is not found
   */
  async getBusModel(id: number): Promise<BusModelIntegration> {
    const busModel = await busModelRepository.findOne(id);
    return {
      id: busModel.id,
      manufacturer: busModel.manufacturer,
      model: busModel.model,
      year: busModel.year,
      seatingCapacity: busModel.seatingCapacity,
      trunkCapacity: busModel.trunkCapacity,
      fuelEfficiency: busModel.fuelEfficiency,
      maxCapacity: busModel.maxCapacity,
      numFloors: busModel.numFloors,
      engineType: busModel.engineType,
      active: busModel.active,
    };
  },

  /**
   * Retrieves multiple bus models by their IDs
   * This is a batch operation optimized for fetching multiple entities at once
   *
   * @param ids - Array of bus model IDs to retrieve
   * @returns Array of bus models in the same order as requested IDs
   */
  async getBusModelsByIds(ids: number[]): Promise<BusModelIntegration[]> {
    if (ids.length === 0) return [];

    const busModels = await busModelRepository.findByIds(ids);
    return busModels.map((bm) => ({
      id: bm.id,
      manufacturer: bm.manufacturer,
      model: bm.model,
      year: bm.year,
      seatingCapacity: bm.seatingCapacity,
      trunkCapacity: bm.trunkCapacity,
      fuelEfficiency: bm.fuelEfficiency,
      maxCapacity: bm.maxCapacity,
      numFloors: bm.numFloors,
      engineType: bm.engineType,
      active: bm.active,
    }));
  },
};
