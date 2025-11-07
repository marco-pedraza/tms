import { SQL, inArray, sql } from 'drizzle-orm';
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
   * Finds all tolls for multiple pathway options in a single query, ordered by sequence
   * Efficiently avoids N+1 query problem when loading tolls for multiple options
   * @param optionIds - Array of pathway option IDs to find tolls for
   * @param tx - Optional transaction instance
   * @returns Array of pathway option tolls ordered by sequence
   */
  async function findByOptionIds(
    optionIds: number[],
    tx?: TransactionalDB,
  ): Promise<PathwayOptionToll[]> {
    if (optionIds.length === 0) {
      return [];
    }

    const dbInstance = tx ?? db;

    const results = await dbInstance
      .select()
      .from(pathwayOptionTolls)
      .where(inArray(pathwayOptionTolls.pathwayOptionId, optionIds))
      .orderBy(pathwayOptionTolls.sequence);

    // Cast to PathwayOptionToll[] - distance should never be null in practice
    return results as PathwayOptionToll[];
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

    // Cast to PathwayOptionToll[] - distance should never be null in practice
    return createdTolls as PathwayOptionToll[];
  }

  /**
   * Updates passTimeMin for multiple tolls in a single batch operation
   * Pure update method - receives pre-calculated values, no business logic
   * Uses CASE expression for efficient batch update in a single query
   * @param updates - Array of toll updates with id and passTimeMin
   * @param tx - Optional transaction instance
   */
  async function updateMany(
    updates: { id: number; passTimeMin: number }[],
    tx?: TransactionalDB,
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    const dbInstance = tx ?? db;

    const ids = updates.map((item) => item.id);
    const sqlChunks: SQL[] = [sql`(case`];

    for (const item of updates) {
      sqlChunks.push(
        sql`when ${pathwayOptionTolls.id} = ${item.id} then ${item.passTimeMin}`,
      );
    }

    sqlChunks.push(sql`end)`);

    const passTimeSql = sql.join(sqlChunks, sql.raw(' '));

    await dbInstance
      .update(pathwayOptionTolls)
      .set({ passTimeMin: passTimeSql })
      .where(inArray(pathwayOptionTolls.id, ids));
  }

  /**
   * Creates a transaction-scoped version of this repository
   * Overrides baseRepository.withTransaction to preserve custom methods
   * @param tx - Transaction instance
   * @returns Transaction-scoped repository with all custom methods
   */
  function withTransaction(tx: TransactionalDB) {
    const txBaseRepository = baseRepository.withTransaction(tx);
    return {
      ...txBaseRepository,
      findByOptionId: (optionId: number) => findByOptionId(optionId, tx),
      findByOptionIds: (optionIds: number[]) => findByOptionIds(optionIds, tx),
      deleteByOptionId: (optionId: number) => deleteByOptionId(optionId, tx),
      createMany: (tollsPayload: CreatePathwayOptionTollPayload[]) =>
        createMany(tollsPayload, tx),
      updateMany: (updates: { id: number; passTimeMin: number }[]) =>
        updateMany(updates, tx),
      withTransaction: (newTx: TransactionalDB) => withTransaction(newTx),
    };
  }

  return {
    ...baseRepository,
    findByOptionId,
    findByOptionIds,
    deleteByOptionId,
    createMany,
    updateMany,
    withTransaction,
  };
}

export const pathwayOptionTollRepository = createPathwayOptionTollRepository();
