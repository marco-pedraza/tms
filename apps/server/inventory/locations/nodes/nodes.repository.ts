import { and, count, eq, exists, inArray } from 'drizzle-orm';
import {
  NotFoundError,
  TransactionalDB,
  createBaseRepository,
} from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { PaginationMeta } from '@/shared/types';
import { OperatingHours } from '@/inventory/locations/installations/installations.types';
import { installationUseCases } from '@/inventory/locations/installations/installations.use-cases';
import { labelRepository } from '@/inventory/locations/labels/labels.repository';
import { labelNodes } from '@/inventory/locations/labels/labels.schema';
import { nodeEventRepository } from '@/inventory/locations/node-events/node-events.repository';
import { nodes } from './nodes.schema';
import type {
  CreateNodePayload,
  ListNodesQueryParams,
  Node,
  NodeWithRelations,
  PaginatedListNodesQueryParams,
  PaginatedListNodesResult,
  UpdateNodePayload,
} from './nodes.types';

/**
 * Creates a repository for managing node entities
 * @returns {Object} An object containing node-specific operations and base CRUD operations
 */
export function createNodeRepository() {
  const baseRepository = createBaseRepository<
    Node,
    CreateNodePayload & { slug: string },
    UpdateNodePayload & { slug?: string },
    typeof nodes
  >(db, nodes, 'Node', {
    searchableFields: [nodes.code, nodes.name, nodes.slug],
    softDeleteEnabled: true,
  });

  /**
   * Enhanced findAll method that supports labelIds filtering using EXISTS
   * @param params - Query parameters including optional labelIds in filters
   * @returns Array of nodes matching the criteria
   */
  async function findAll(params: ListNodesQueryParams = {}): Promise<Node[]> {
    // Extract labelIds from filters and create params without it
    const {
      filters: { labelIds, ...filtersWithoutLabelIds } = {},
      ...otherParams
    } = params;
    const baseParams = {
      ...otherParams,
      filters: filtersWithoutLabelIds,
    };

    // If no labelIds or empty array, use base findAll method
    if (!labelIds || labelIds.length === 0) {
      return await baseRepository.findAll(baseParams);
    }

    // Build optimized query with labelIds filter using EXISTS
    const { baseWhere, baseOrderBy } =
      baseRepository.buildQueryExpressions(baseParams);

    // Create EXISTS condition for labelNodes with multiple labelIds
    const labelExistsCondition = exists(
      db
        .select()
        .from(labelNodes)
        .where(
          and(
            eq(labelNodes.nodeId, nodes.id),
            inArray(labelNodes.labelId, labelIds),
          ),
        ),
    );

    // Combine filters
    const combinedWhere = baseWhere
      ? and(baseWhere, labelExistsCondition)
      : labelExistsCondition;

    // Execute single optimized query
    let query = db.select().from(nodes).where(combinedWhere);

    if (baseOrderBy) {
      query = query.orderBy(...baseOrderBy) as typeof query;
    }

    return await query;
  }

  /**
   * Enhanced findAllPaginated method that supports labelIds filtering using EXISTS
   * @param params - Paginated query parameters including optional labelIds in filters
   * @returns Paginated result of nodes matching the criteria
   */
  async function findAllPaginated(params: PaginatedListNodesQueryParams = {}) {
    const { page = 1, pageSize = 10 } = params;

    const { filters = {}, ...otherParams } = params;
    const { labelIds, ...filtersWithoutLabelIds } = filters;
    const baseParams = {
      ...otherParams,
      filters: filtersWithoutLabelIds,
    };

    // If no labelIds or empty array, use base findAllPaginated method
    if (!labelIds || labelIds.length === 0) {
      return await baseRepository.findAllPaginated(baseParams);
    }

    // Build optimized queries with labelIds filter using EXISTS
    const { baseWhere, baseOrderBy } =
      baseRepository.buildQueryExpressions(baseParams);

    // Create EXISTS condition for labelNodes with multiple labelIds
    const labelExistsCondition = exists(
      db
        .select()
        .from(labelNodes)
        .where(
          and(
            eq(labelNodes.nodeId, nodes.id),
            inArray(labelNodes.labelId, labelIds),
          ),
        ),
    );

    // Combine filters
    const combinedWhere = baseWhere
      ? and(baseWhere, labelExistsCondition)
      : labelExistsCondition;

    // Single count query
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(nodes)
      .where(combinedWhere);

    // Single data query with pagination
    const offset = (page - 1) * pageSize;
    let dataQuery = db.select().from(nodes).where(combinedWhere);

    if (baseOrderBy) {
      dataQuery = dataQuery.orderBy(...baseOrderBy) as typeof dataQuery;
    }

    const data = await dataQuery.limit(pageSize).offset(offset);

    // Create pagination metadata
    const totalPages = Math.ceil(Number(totalCount) / pageSize);

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount: Number(totalCount),
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Finds a single node with its relations (city, population, installation with details, nodeEvents, labels)
   * @param id - The ID of the node to find
   * @returns The node with related information
   * @throws {NotFoundError} If the node is not found
   */
  async function findOneWithRelations(id: number): Promise<NodeWithRelations> {
    const node = await db.query.nodes.findFirst({
      where: (nodes, { eq, and, isNull }) =>
        and(eq(nodes.id, id), isNull(nodes.deletedAt)),
      with: {
        city: true,
        population: true,
        installation: true,
      },
    });

    if (!node) {
      throw new NotFoundError(`Node with id ${id} not found`);
    }

    // Get installation with details if the node has an installation
    const installationWithDetails = node.installationId
      ? await installationUseCases.findOneWithLocation(node.installationId)
      : null;

    // Get node events with flattened event type information
    const nodeEvents = await nodeEventRepository.findByNodeIdFlat(id);

    // Get node labels using labelRepository
    const labels = await labelRepository.findByNodeId(id);

    return {
      ...node,
      installation: installationWithDetails,
      nodeEvents,
      labels,
    };
  }

  /**
   * Appends relations (city, population, installation, labels) to nodes
   *
   * This function takes a list of nodes and enriches them with related information.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param nodesResult - Array of nodes to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @returns Nodes with relations and pagination metadata
   */
  async function appendRelations(
    nodesResult: Node[],
    pagination: PaginationMeta,
    params: PaginatedListNodesQueryParams,
  ): Promise<PaginatedListNodesResult> {
    // Return early if no nodes to process
    if (nodesResult.length === 0) {
      return {
        data: [],
        pagination,
      };
    }

    // Extract labelIds from filters before calling buildQueryExpressions
    // since labelIds is not a valid field in the nodes table
    const { filters = {}, ...otherParams } = params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { labelIds, ...filtersWithoutLabelIds } = filters;
    const baseParams = {
      ...otherParams,
      filters: filtersWithoutLabelIds,
    };

    const { baseOrderBy } = baseRepository.buildQueryExpressions(baseParams);
    const ids = nodesResult.map((node) => node.id);

    const nodesWithRelations = await db.query.nodes.findMany({
      where: inArray(nodes.id, ids),
      orderBy: baseOrderBy,
      with: {
        city: true,
        population: true,
        installation: true,
      },
    });

    // Get node events for all nodes in a single query
    const nodeEventsMap = await nodeEventRepository.findByNodeIdsFlat(ids);

    // Get labels for all nodes using labelRepository
    const nodeLabelsMap = await labelRepository.findByNodeIds(ids);

    // Add node events, labels, and basic installation info to each node
    // Note: For performance, we don't include installation details (amenities, properties) in list operations
    const nodesWithEvents = nodesWithRelations.map((node) => ({
      ...node,
      installation: node.installation
        ? {
            ...node.installation,
            operatingHours: node.installation
              .operatingHours as OperatingHours | null,
            location: null, // Location info not needed for list operations
            properties: [], // Properties not needed for list operations
            amenities: [], // Amenities not needed for list operations
          }
        : null,
      nodeEvents: nodeEventsMap.get(node.id) || [],
      labels: nodeLabelsMap.get(node.id) || [],
    }));

    return {
      data: nodesWithEvents,
      pagination,
    };
  }

  /**
   * Assigns an installation to a node
   * This method is used internally by the system to link installations to nodes
   * @param nodeId - The ID of the node to assign the installation to
   * @param installationId - The ID of the installation to assign
   * @param transaction - Optional database transaction
   * @returns The updated node
   * @throws {NotFoundError} If the node is not found
   */
  async function assignInstallation(
    nodeId: number,
    installationId: number,
    transaction?: unknown,
  ): Promise<Node> {
    const dbInstance = (transaction as typeof db) || db;

    const [updatedNode] = await dbInstance
      .update(nodes)
      .set({ installationId })
      .where(eq(nodes.id, nodeId))
      .returning();

    if (!updatedNode) {
      throw new NotFoundError(`Node with id ${nodeId} not found`);
    }

    return updatedNode;
  }

  /**
   * Gets the installation type ID for a node
   * @param nodeId - The ID of the node
   * @param tx - Optional transaction instance
   * @returns The installation type ID or null if no installation is assigned
   * @throws {NotFoundError} If the node is not found
   */
  async function getInstallationTypeIdByNodeId(
    nodeId: number,
    tx?: unknown,
  ): Promise<number | null> {
    const dbInstance = (tx as typeof db) || db;

    const nodeWithInstallation = await dbInstance.query.nodes.findFirst({
      where: (nodes, { eq, and, isNull }) =>
        and(eq(nodes.id, nodeId), isNull(nodes.deletedAt)),
      with: {
        installation: {
          columns: {
            installationTypeId: true,
          },
        },
      },
    });

    if (!nodeWithInstallation) {
      throw new NotFoundError(`Node with id ${nodeId} not found`);
    }

    return nodeWithInstallation.installation?.installationTypeId || null;
  }

  /**
   * Finds multiple nodes by their IDs in a single query
   * Respects soft delete and other base repository filters
   * @param ids - Array of node IDs to find
   * @param tx - Optional transaction instance
   * @returns Array of found nodes (only existing, non-deleted nodes)
   */
  async function findByIds(
    ids: number[],
    tx?: TransactionalDB,
  ): Promise<Node[]> {
    if (ids.length === 0) {
      return [];
    }

    const dbInstance = tx || db;

    // Use buildQueryExpressions to respect soft delete filter
    const { baseWhere } = baseRepository.buildQueryExpressions();

    // Combine inArray condition with soft delete filter
    const whereCondition = baseWhere
      ? and(inArray(nodes.id, ids), baseWhere)
      : inArray(nodes.id, ids);

    const foundNodes = await dbInstance
      .select()
      .from(nodes)
      .where(whereCondition);

    return foundNodes as Node[];
  }

  return {
    ...baseRepository,
    // Override base repository methods with custom implementations
    findAll,
    findAllPaginated,
    // Custom methods
    findOneWithRelations,
    appendRelations,
    assignInstallation,
    getInstallationTypeIdByNodeId,
    findByIds,
  };
}

// Export the node repository instance
export const nodeRepository = createNodeRepository();
