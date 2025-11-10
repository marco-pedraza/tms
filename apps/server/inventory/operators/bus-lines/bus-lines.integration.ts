import { NotFoundError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import type { ServiceType } from '@/inventory/operators/service-types/service-types.types';

/**
 * Public integration type for bus lines
 * Exposes only the fields needed for cross-service integration
 */
export interface BusLineIntegration {
  id: number;
  name: string;
  code: string;
  serviceTypeId: number;
  pricePerKilometer: number;
  description: string | null;
  fleetSize: number | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  serviceType: Pick<
    ServiceType,
    'id' | 'name' | 'code' | 'description' | 'active'
  >;
}

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
   * Retrieves a single bus line by ID with service type included
   * @param id - The ID of the bus line
   * @returns The bus line data with service type
   * @throws {NotFoundError} If the bus line is not found
   */
  async getBusLineWithServiceType(id: number): Promise<BusLineIntegration> {
    const busLine = await db.query.busLines.findFirst({
      where: (busLines, { eq, and, isNull }) =>
        and(eq(busLines.id, id), isNull(busLines.deletedAt)),
      with: {
        serviceType: true,
      },
    });

    if (!busLine) {
      throw new NotFoundError(`Bus Line with id ${id} not found`);
    }

    return {
      id: busLine.id,
      name: busLine.name,
      code: busLine.code,
      serviceTypeId: busLine.serviceTypeId,
      pricePerKilometer: busLine.pricePerKilometer,
      description: busLine.description,
      fleetSize: busLine.fleetSize,
      website: busLine.website,
      email: busLine.email,
      phone: busLine.phone,
      active: busLine.active,
      serviceType: {
        id: busLine.serviceType.id,
        name: busLine.serviceType.name,
        code: busLine.serviceType.code,
        description: busLine.serviceType.description,
        active: busLine.serviceType.active,
      },
    };
  },

  /**
   * Retrieves multiple bus lines by their IDs with service types included
   * This is a batch operation optimized for fetching multiple entities at once
   *
   * @param ids - Array of bus line IDs to retrieve
   * @returns Array of bus lines with service types in the same order as requested IDs
   */
  async getBusLinesByIds(ids: number[]): Promise<BusLineIntegration[]> {
    if (ids.length === 0) return [];

    const busLinesResult = await db.query.busLines.findMany({
      where: (busLines, { and, inArray, isNull }) =>
        and(inArray(busLines.id, ids), isNull(busLines.deletedAt)),
      with: {
        serviceType: true,
      },
    });

    return busLinesResult.map((bl) => ({
      id: bl.id,
      name: bl.name,
      code: bl.code,
      serviceTypeId: bl.serviceTypeId,
      pricePerKilometer: bl.pricePerKilometer,
      description: bl.description,
      fleetSize: bl.fleetSize,
      website: bl.website,
      email: bl.email,
      phone: bl.phone,
      active: bl.active,
      serviceType: {
        id: bl.serviceType.id,
        name: bl.serviceType.name,
        code: bl.serviceType.code,
        description: bl.serviceType.description,
        active: bl.serviceType.active,
      },
    }));
  },
};
