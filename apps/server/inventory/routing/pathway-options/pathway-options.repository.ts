import { and, eq, inArray } from 'drizzle-orm';
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
   * Helper function to get the appropriate repository instance based on transaction context
   * @param tx - Optional transaction instance
   * @returns Repository instance (transactional or base)
   */
  function getRepository(tx?: TransactionalDB) {
    return tx ? baseRepository.withTransaction(tx) : baseRepository;
  }

  /**
   * Finds all pathway options for a specific pathway
   * @param pathwayId - The pathway ID to find options for
   * @param tx - Optional transaction instance
   * @returns Array of pathway options
   */
  async function findByPathwayId(
    pathwayId: number,
    tx?: TransactionalDB,
  ): Promise<PathwayOption[]> {
    const repo = getRepository(tx);
    return await repo.findAllBy(pathwayOptions.pathwayId, pathwayId);
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
    setDefaultOption,
  };
}

export const pathwayOptionRepository = createPathwayOptionRepository();
