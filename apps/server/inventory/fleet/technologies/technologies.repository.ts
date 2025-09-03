import { and, eq, inArray, isNull } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import {
  busTechnologies,
  technologies,
} from '@/inventory/fleet/technologies/technologies.schema';
import type {
  CreateTechnologyPayload,
  Technology,
  UpdateTechnologyPayload,
} from './technologies.types';

/**
 * Creates a repository for managing technology entities
 */
export function createTechnologyRepository() {
  const baseRepository = createBaseRepository<
    Technology,
    CreateTechnologyPayload,
    UpdateTechnologyPayload,
    typeof technologies
  >(db, technologies, 'Technology', {
    searchableFields: [technologies.name],
    softDeleteEnabled: true,
  });

  /**
   * Finds existing technology IDs from a given array of IDs
   * @param technologyIds - Array of technology IDs to check
   * @returns Array of technology IDs that exist in the database
   */
  async function findExistingIds(technologyIds: number[]): Promise<number[]> {
    if (technologyIds.length === 0) {
      return [];
    }

    const results = await db
      .select({ id: technologies.id })
      .from(technologies)
      .where(
        and(
          inArray(technologies.id, technologyIds),
          isNull(technologies.deletedAt),
        ),
      );

    return results.map((result: { id: number }) => result.id);
  }

  /**
   * Finds all technologies assigned to a specific bus
   * @param busId - The ID of the bus
   * @returns Array of technologies assigned to the bus
   */
  async function findByBusId(busId: number): Promise<Technology[]> {
    const results = await db.query.busTechnologies.findMany({
      where: eq(busTechnologies.busId, busId),
      with: {
        technology: true,
      },
    });

    return results.map((result) => result.technology);
  }

  return {
    ...baseRepository,
    findExistingIds,
    findByBusId,
  };
}

export const technologiesRepository = createTechnologyRepository();
