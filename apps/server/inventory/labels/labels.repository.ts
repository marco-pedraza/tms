import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { labelNodes, labels } from './labels.schema';
import type {
  CreateLabelPayload,
  Label,
  LabelWithNodeCount,
  LabelsMetrics,
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
        active: labels.active,
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
        labels.active,
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

  /**
   * Finds all labels assigned to a specific node
   * @param nodeId - The ID of the node
   * @returns Array of labels assigned to the node
   */
  async function findByNodeId(nodeId: number): Promise<Label[]> {
    const nodeLabels = await db.query.labelNodes.findMany({
      where: eq(labelNodes.nodeId, nodeId),
      with: {
        label: true,
      },
    });

    return nodeLabels.map((nl) => nl.label);
  }

  /**
   * Finds all labels assigned to multiple nodes
   * @param nodeIds - Array of node IDs
   * @returns Map of nodeId to array of labels
   */
  async function findByNodeIds(
    nodeIds: number[],
  ): Promise<Map<number, Label[]>> {
    if (nodeIds.length === 0) {
      return new Map();
    }

    const nodeLabelResults = await db.query.labelNodes.findMany({
      where: inArray(labelNodes.nodeId, nodeIds),
      with: {
        label: true,
      },
    });

    // Create a map of nodeId -> labels[]
    const nodeLabelsMap = new Map<number, Label[]>();
    for (const result of nodeLabelResults) {
      if (!nodeLabelsMap.has(result.nodeId)) {
        nodeLabelsMap.set(result.nodeId, []);
      }
      nodeLabelsMap.get(result.nodeId)?.push(result.label);
    }

    return nodeLabelsMap;
  }

  /**
   * Finds existing label IDs from a given array of IDs
   * @param labelIds - Array of label IDs to check
   * @returns Array of label IDs that exist in the database
   */
  async function findExistingIds(labelIds: number[]): Promise<number[]> {
    if (labelIds.length === 0) {
      return [];
    }

    const results = await db
      .select({ id: labels.id })
      .from(labels)
      .where(and(inArray(labels.id, labelIds), isNull(labels.deletedAt)));

    return results.map((result: { id: number }) => result.id);
  }

  /**
   * Gets metrics data
   * @returns Metrics including total labels, labels in use, and most used labels info
   */
  async function getMetrics(): Promise<LabelsMetrics> {
    // Single optimized query to get all label statistics
    // Ordered by node count descending, then alphabetically for consistent tie-breaking
    const labelsWithNodeCount = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        nodeCount: sql<number>`coalesce(count(${labelNodes.nodeId}), 0)`,
      })
      .from(labels)
      .leftJoin(labelNodes, eq(labels.id, labelNodes.labelId))
      .where(isNull(labels.deletedAt))
      .groupBy(labels.id, labels.name, labels.color)
      .orderBy(sql`count(${labelNodes.nodeId}) desc`, labels.name);

    // Calculate metrics from the single query result
    const totalLabels = labelsWithNodeCount.length;
    const labelsInUse = labelsWithNodeCount.filter(
      (label) => label.nodeCount > 0,
    ).length;

    // Find the maximum node count among labels in use
    const labelsWithPositiveCount = labelsWithNodeCount.filter(
      (label) => label.nodeCount > 0,
    );

    let mostUsedLabels: { nodeCount: number; name: string; color: string }[] =
      [];

    if (labelsWithPositiveCount.length > 0) {
      const maxNodeCount = labelsWithPositiveCount[0].nodeCount;

      // Get ALL labels with the maximum node count
      mostUsedLabels = labelsWithPositiveCount
        .filter((label) => label.nodeCount === maxNodeCount)
        .map((label) => ({
          nodeCount: Number(label.nodeCount),
          name: label.name,
          color: label.color,
        }));
    }

    return {
      totalLabels,
      labelsInUse,
      mostUsedLabels,
    };
  }

  return {
    ...baseRepository,
    findOneWithNodeCount,
    findAllWithNodeCount,
    findAllPaginatedWithNodeCount,
    findByNodeId,
    findByNodeIds,
    findExistingIds,
    getMetrics,
  };
}

// Export the instance to use throughout the application
export const labelRepository = createLabelRepository();
