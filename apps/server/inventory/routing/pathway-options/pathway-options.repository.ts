import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { pathwayOptions } from './pathway-options.schema';
import type {
  CreatePathwayOptionPayload,
  PathwayOption,
  UpdatePathwayOptionPayload,
} from './pathway-options.types';

/**
 * Creates a repository for managing pathway option entities
 */
export function createPathwayOptionRepository() {
  const baseRepository = createBaseRepository<
    PathwayOption,
    CreatePathwayOptionPayload,
    UpdatePathwayOptionPayload,
    typeof pathwayOptions
  >(db, pathwayOptions, 'PathwayOption', {
    searchableFields: [pathwayOptions.name],
    softDeleteEnabled: true,
  });

  /**
   * Finds all pathway options for a specific pathway (excluding soft-deleted)
   * @param pathwayId - The pathway ID to find options for
   * @param tx - Optional transaction instance
   * @returns Array of pathway options (only non-deleted)
   */
  async function findByPathwayId(
    pathwayId: number,
    tx?: TransactionalDB,
  ): Promise<PathwayOption[]> {
    const dbInstance = tx || db;

    // Query with explicit deletedAt filter to exclude soft-deleted options
    return await dbInstance
      .select()
      .from(pathwayOptions)
      .where(
        and(
          eq(pathwayOptions.pathwayId, pathwayId),
          isNull(pathwayOptions.deletedAt),
        ),
      );
  }

  /**
   * Finds multiple pathway options by their IDs
   * @param ids - Array of option IDs to find
   * @param tx - Optional transaction instance
   * @returns Array of found pathway options (may be less than requested if some don't exist)
   */
  async function findByIds(
    ids: number[],
    tx?: TransactionalDB,
  ): Promise<PathwayOption[]> {
    if (ids.length === 0) {
      return [];
    }

    const dbInstance = tx || db;

    const results = await dbInstance
      .select()
      .from(pathwayOptions)
      .where(
        and(inArray(pathwayOptions.id, ids), isNull(pathwayOptions.deletedAt)),
      );

    return results;
  }

  /**
   * Sets a specific option as default for a pathway
   * Atomically unsets all other defaults and sets the new one
   * @param pathwayId - The pathway ID
   * @param optionId - The option ID to set as default
   * @param tx - Optional transaction instance
   * @throws {NotFoundError} If option is not found or doesn't belong to pathway
   */
  async function setDefaultOption(
    pathwayId: number,
    optionId: number,
    tx?: TransactionalDB,
  ): Promise<void> {
    const run = async (dbTx: TransactionalDB) => {
      const repo = baseRepository.withTransaction(dbTx);
      const options = await repo.findAllBy(pathwayOptions.pathwayId, pathwayId);
      const target = options.find((o) => o.id === optionId);
      if (!target) {
        throw new NotFoundError(
          `Option ${optionId} not found for pathway ${pathwayId}`,
        );
      }

      const currentDefaultIds = options
        .filter((o) => o.isDefault && o.id !== optionId)
        .map((o) => o.id);

      if (currentDefaultIds.length > 0) {
        await dbTx
          .update(pathwayOptions)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(inArray(pathwayOptions.id, currentDefaultIds));
      }

      await dbTx
        .update(pathwayOptions)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(pathwayOptions.id, optionId),
            eq(pathwayOptions.pathwayId, pathwayId),
          ),
        );
    };

    if (tx) {
      await run(tx);
    } else {
      await db.transaction(run);
    }
  }

  return {
    ...baseRepository,
    findByPathwayId,
    findByIds,
    setDefaultOption,
  };
}

export const pathwayOptionRepository = createPathwayOptionRepository();
