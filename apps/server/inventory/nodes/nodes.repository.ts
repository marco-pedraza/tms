import { eq, inArray } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { PaginationMeta } from '../../shared/types';
import { db } from '../db-service';
import { labelRepository } from '../labels/labels.repository';
import { nodeEventRepository } from '../node-events/node-events.repository';
import { nodes } from './nodes.schema';
import type {
  CreateNodePayload,
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
   * Finds a single node with its relations (city, population, installation, nodeEvents, labels)
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

    // Get node events with flattened event type information
    const nodeEvents = await nodeEventRepository.findByNodeIdFlat(id);

    // Get node labels using labelRepository
    const labels = await labelRepository.findByNodeId(id);

    return {
      ...node,
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

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
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

    // Add node events and labels to each node
    const nodesWithEvents = nodesWithRelations.map((node) => ({
      ...node,
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
   * @returns The installation type ID or null if no installation is assigned
   * @throws {NotFoundError} If the node is not found
   */
  async function getInstallationTypeIdByNodeId(
    nodeId: number,
  ): Promise<number | null> {
    const nodeWithInstallation = await db.query.nodes.findFirst({
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

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
    assignInstallation,
    getInstallationTypeIdByNodeId,
  };
}

// Export the node repository instance
export const nodeRepository = createNodeRepository();
