import type { BusLine } from './bus-lines.types';
import { busLineRepository } from './bus-lines.repository';

/**
 * Public integration type for bus lines
 * Exposes only the fields needed for cross-service integration
 */
export type BusLineIntegration = Pick<
  BusLine,
  | 'id'
  | 'name'
  | 'code'
  | 'pricePerKilometer'
  | 'description'
  | 'fleetSize'
  | 'website'
  | 'email'
  | 'phone'
  | 'active'
>;

/**
 * Bus Lines Integration Service
 *
 * Provides controlled access to bus lines for other bounded contexts.
 * This is the ONLY way other services should access bus line data.
 *
 * @internal This API is for cross-service integration only
 */
export const busLinesIntegration = {
  /**
   * Retrieves a single bus line by ID
   * @param id - The ID of the bus line
   * @returns The bus line data
   * @throws {NotFoundError} If the bus line is not found
   */
  async getBusLine(id: number): Promise<BusLineIntegration> {
    const busLine = await busLineRepository.findOne(id);
    return {
      id: busLine.id,
      name: busLine.name,
      code: busLine.code,
      pricePerKilometer: busLine.pricePerKilometer,
      description: busLine.description,
      fleetSize: busLine.fleetSize,
      website: busLine.website,
      email: busLine.email,
      phone: busLine.phone,
      active: busLine.active,
    };
  },

  /**
   * Retrieves multiple bus lines by their IDs
   * This is a batch operation optimized for fetching multiple entities at once
   *
   * @param ids - Array of bus line IDs to retrieve
   * @returns Array of bus lines in the same order as requested IDs
   */
  async getBusLinesByIds(ids: number[]): Promise<BusLineIntegration[]> {
    if (ids.length === 0) return [];

    const busLines = await busLineRepository.findByIds(ids);
    return busLines.map((bl) => ({
      id: bl.id,
      name: bl.name,
      code: bl.code,
      pricePerKilometer: bl.pricePerKilometer,
      description: bl.description,
      fleetSize: bl.fleetSize,
      website: bl.website,
      email: bl.email,
      phone: bl.phone,
      active: bl.active,
    }));
  },
};
