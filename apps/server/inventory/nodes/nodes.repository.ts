import { inArray } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { PaginationMeta } from '../../shared/types';
import { db } from '../db-service';
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
    CreateNodePayload,
    UpdateNodePayload,
    typeof nodes
  >(db, nodes, 'Node', {
    searchableFields: [nodes.code, nodes.name],
    softDeleteEnabled: true,
  });

  /**
   * Finds a single node with its relations (city, population, installation)
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

    return node;
  }

  /**
   * Appends relations (city, population, installation) to nodes
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

    return {
      data: nodesWithRelations,
      pagination,
    };
  }

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
  };
}

// Export the node repository instance
export const nodeRepository = createNodeRepository();
