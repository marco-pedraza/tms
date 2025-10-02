import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { pathwayOptionTolls } from './pathway-options-tolls.schema';
import type {
  CreatePathwayOptionTollPayload,
  PathwayOptionToll,
  UpdatePathwayOptionTollPayload,
} from './pathway-options-tolls.types';

/**
 * Creates a repository for managing pathway option toll entities
 */
export function createPathwayOptionTollRepository() {
  const baseRepository = createBaseRepository<
    PathwayOptionToll,
    CreatePathwayOptionTollPayload,
    UpdatePathwayOptionTollPayload,
    typeof pathwayOptionTolls
  >(db, pathwayOptionTolls, 'PathwayOptionToll', {
    softDeleteEnabled: false,
  });

  type RepositoryType = typeof baseRepository;

  /**
   * Helper function to get the appropriate repository instance based on transaction context
   * @param tx - Optional transaction instance
   * @returns Repository instance (transactional or base)
   */
  function getRepository(tx?: TransactionalDB): RepositoryType {
    return tx ? baseRepository.withTransaction(tx) : baseRepository;
  }

  /**
   * Finds all tolls for a specific pathway option, ordered by sequence
   * @param optionId - The pathway option ID to find tolls for
   * @param tx - Optional transaction instance
   * @returns Array of pathway option tolls ordered by sequence
   */
  async function findByOptionId(
    optionId: number,
    tx?: TransactionalDB,
  ): Promise<PathwayOptionToll[]> {
    const repo = getRepository(tx);
    return await repo.findAllBy(pathwayOptionTolls.pathwayOptionId, optionId, {
      orderBy: [{ field: 'sequence', direction: 'asc' }],
    });
  }

  /**
   * Deletes all tolls for a specific pathway option
   * Used during toll synchronization to completely remove old toll records
   * @param optionId - The pathway option ID
   * @param tx - Optional transaction instance
   */
  async function deleteByOptionId(
    optionId: number,
    tx?: TransactionalDB,
  ): Promise<void> {
    const repo = getRepository(tx);
    const tolls = await repo.findAllBy(
      pathwayOptionTolls.pathwayOptionId,
      optionId,
    );

    if (tolls.length === 0) {
      return;
    }

    const tollIds = tolls.map((toll) => toll.id);

    await repo.deleteMany(tollIds);
  }

  /**
   * Creates multiple tolls in a single bulk insert operation
   * @param tollsPayload - Array of toll creation payloads
   * @param tx - Optional transaction instance
   * @returns Array of created pathway option tolls
   */
  async function createMany(
    tollsPayload: CreatePathwayOptionTollPayload[],
    tx?: TransactionalDB,
  ): Promise<PathwayOptionToll[]> {
    if (tollsPayload.length === 0) {
      return [];
    }

    const dbInstance = tx ?? db;

    const createdTolls = await dbInstance
      .insert(pathwayOptionTolls)
      .values(tollsPayload)
      .returning();

    return createdTolls;
  }

  return {
    ...baseRepository,
    findByOptionId,
    deleteByOptionId,
    createMany,
  };
}

export const pathwayOptionTollRepository = createPathwayOptionTollRepository();
