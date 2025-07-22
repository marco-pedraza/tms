import { count, eq, inArray, sql } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { labelNodes, labels } from './labels.schema';
import type {
  CreateLabelPayload,
  Label,
  LabelWithNodeCount,
  ListLabelsQueryParams,
  PaginatedListLabelsQueryParams,
  PaginatedListLabelsResult,
  UpdateLabelPayload,
} from './labels.types';

/**
 * Creates a repository for managing label entities
 * @returns {Object} An object containing label-specific operations and base CRUD operations
 */
export function createLabelRepository() {
  const baseRepository = createBaseRepository<
    Label,
    CreateLabelPayload,
    UpdateLabelPayload,
    typeof labels
  >(db, labels, 'Label', {
    searchableFields: [labels.name, labels.description],
    softDeleteEnabled: true,
  });

  /**
   * Finds a single label with node count by ID
   * @param id - The ID of the label to find
   * @returns The label with node count
   * @throws {NotFoundError} If the label is not found
   */
  async function findOneWithNodeCount(id: number): Promise<LabelWithNodeCount> {
    // First get the label using base repository (handles soft delete)
    const label = await baseRepository.findOne(id);

    // Then enrich with node count
    const enrichedLabels = await enrichLabelsWithNodeCount([label]);

    return enrichedLabels[0];
  }

  /**
   * Finds all labels with node count (non-paginated)
   * @param params - Query parameters for filtering, searching, and ordering
   * @returns Array of labels with node count
   */
  async function findAllWithNodeCount(
    params: ListLabelsQueryParams,
  ): Promise<LabelWithNodeCount[]> {
    const { baseWhere, baseOrderBy } =
      baseRepository.buildQueryExpressions(params);

    const results = await db
      .select({
        id: labels.id,
        name: labels.name,
        description: labels.description,
        color: labels.color,
        createdAt: labels.createdAt,
        updatedAt: labels.updatedAt,
        nodeCount: sql<number>`coalesce(${count(labelNodes.nodeId)}, 0)`,
      })
      .from(labels)
      .leftJoin(labelNodes, eq(labels.id, labelNodes.labelId))
      .where(baseWhere)
      .groupBy(
        labels.id,
        labels.name,
        labels.description,
        labels.color,
        labels.createdAt,
        labels.updatedAt,
      )
      .orderBy(...(baseOrderBy || []));

    // Convert nodeCount to number to ensure correct type
    return results.map((result) => ({
      ...result,
      nodeCount: Number(result.nodeCount),
    }));
  }

  /**
   * Enriches labels with node count information
   * @param labels - Array of labels to enrich
   * @returns Array of labels with node count
   */
  async function enrichLabelsWithNodeCount(
    labels: Label[],
  ): Promise<LabelWithNodeCount[]> {
    if (labels.length === 0) {
      return [];
    }

    const labelIds = labels.map((label) => label.id);

    const counts = await db
      .select({
        labelId: labelNodes.labelId,
        count: count(labelNodes.nodeId),
      })
      .from(labelNodes)
      .where(inArray(labelNodes.labelId, labelIds))
      .groupBy(labelNodes.labelId);

    const countsMap = new Map(counts.map((c) => [c.labelId, Number(c.count)]));

    return labels.map((label) => ({
      ...label,
      nodeCount: countsMap.get(label.id) || 0,
    }));
  }

  /**
   * Finds all labels with node count (paginated)
   * @param params - Pagination and query parameters
   * @returns Paginated list of labels with node count
   */
  async function findAllPaginatedWithNodeCount(
    params: PaginatedListLabelsQueryParams,
  ): Promise<PaginatedListLabelsResult> {
    // Get paginated results using base repository
    const result = await baseRepository.findAllPaginated(params);

    // Enrich with node count
    const enrichedData = await enrichLabelsWithNodeCount(result.data);

    return {
      data: enrichedData,
      pagination: result.pagination,
    };
  }

  return {
    ...baseRepository,
    findOneWithNodeCount,
    findAllWithNodeCount,
    findAllPaginatedWithNodeCount,
  };
}

// Export the instance to use throughout the application
export const labelRepository = createLabelRepository();
