import { and, eq, isNull } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { routeLegs } from './route-legs.schema';
import type {
  CreateRouteLegPayload,
  RouteLeg,
  UpdateRouteLegPayload,
} from './route-legs.types';

/**
 * Payload for creating route legs with enriched data
 */
export interface CreateRouteLegWithNodesPayload {
  position: number;
  routeId: number;
  originNodeId: number;
  destinationNodeId: number;
  pathwayId: number;
  pathwayOptionId: number;
  isDerived?: boolean;
  active?: boolean;
}

/**
 * Creates a repository for managing route leg entities
 * @returns {Object} An object containing route leg operations and base CRUD operations
 */
export function createRouteLegsRepository() {
  const baseRepository = createBaseRepository<
    RouteLeg,
    CreateRouteLegPayload,
    UpdateRouteLegPayload,
    typeof routeLegs
  >(db, routeLegs, 'RouteLeg', {
    searchableFields: [],
    softDeleteEnabled: true,
    checkDependenciesOnSoftDelete: false,
  });

  /**
   * Creates multiple route legs with enriched node data
   * @param legs - Array of route legs to create with enriched data
   * @param tx - Optional transaction instance
   * @returns Array of created route legs
   */
  async function createLegs(
    legs: CreateRouteLegWithNodesPayload[],
    tx?: TransactionalDB,
  ): Promise<RouteLeg[]> {
    if (legs.length === 0) {
      return [];
    }

    const legsToCreate = legs.map((leg) => ({
      position: leg.position,
      routeId: leg.routeId,
      originNodeId: leg.originNodeId,
      destinationNodeId: leg.destinationNodeId,
      pathwayId: leg.pathwayId,
      pathwayOptionId: leg.pathwayOptionId,
      isDerived: leg.isDerived ?? false,
      active: leg.active ?? true,
    }));

    const result = await (tx || db)
      .insert(routeLegs)
      .values(legsToCreate)
      .returning();

    return result;
  }

  /**
   * Deletes all route legs for a specific route
   * @param routeId - The route ID to delete legs for
   * @param tx - Optional transaction instance
   */
  async function deleteByRouteId(
    routeId: number,
    tx?: TransactionalDB,
  ): Promise<void> {
    await (tx || db).delete(routeLegs).where(eq(routeLegs.routeId, routeId));
  }

  /**
   * Finds active route legs using a specific pathway option
   * @param pathwayId - The pathway ID
   * @param optionId - The pathway option ID
   * @returns Array of active route legs using this pathway option
   */
  async function findActiveLegsByPathwayOption(
    pathwayId: number,
    optionId: number,
    tx?: TransactionalDB,
  ): Promise<RouteLeg[]> {
    return await (tx || db)
      .select()
      .from(routeLegs)
      .where(
        and(
          eq(routeLegs.pathwayId, pathwayId),
          eq(routeLegs.pathwayOptionId, optionId),
          eq(routeLegs.active, true),
          isNull(routeLegs.deletedAt),
        ),
      );
  }

  return {
    ...baseRepository,
    createLegs,
    deleteByRouteId,
    findActiveLegsByPathwayOption,
  };
}

export const routeLegsRepository = createRouteLegsRepository();
