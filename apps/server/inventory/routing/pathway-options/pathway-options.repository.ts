import { createBaseRepository } from '@repo/base-repo';
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

  return {
    ...baseRepository,
    findByPathwayId,
  };
}

export const pathwayOptionRepository = createPathwayOptionRepository();
