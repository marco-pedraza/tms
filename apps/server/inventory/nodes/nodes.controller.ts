import { api } from 'encore.dev/api';
import type {
  CreateNodePayload,
  ListNodesQueryParams,
  ListNodesResult,
  Node,
  NodeWithRelations,
  PaginatedListNodesQueryParams,
  PaginatedListNodesResult,
  UpdateNodePayload,
} from './nodes.types';
import { nodeRepository } from './nodes.repository';
import { nodeDomain } from './nodes.domain';

/**
 * Creates a new node.
 * @param params - The node data to create
 * @returns {Promise<Node>} The created node
 * @throws {APIError} If the node creation fails
 */
export const createNode = api(
  { expose: true, method: 'POST', path: '/nodes/create' },
  async (params: CreateNodePayload): Promise<Node> => {
    return await nodeDomain.createNode(params);
  },
);

/**
 * Retrieves a node by its ID with related information.
 * @param params - Object containing the node ID
 * @param params.id - The ID of the node to retrieve
 * @returns {Promise<NodeWithRelations>} The found node with related information
 * @throws {APIError} If the node is not found or retrieval fails
 */
export const getNode = api(
  { expose: true, method: 'GET', path: '/nodes/:id' },
  async ({ id }: { id: number }): Promise<NodeWithRelations> => {
    return await nodeRepository.findOneWithRelations(id);
  },
);

/**
 * Retrieves all nodes without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListNodesResult>} Unified response with data property containing array of nodes
 * @throws {APIError} If retrieval fails
 */
export const listNodes = api(
  { expose: true, method: 'POST', path: '/nodes/list/all' },
  async (params: ListNodesQueryParams): Promise<ListNodesResult> => {
    const nodes = await nodeRepository.findAll(params);
    return {
      data: nodes,
    };
  },
);

/**
 * Retrieves nodes with pagination and includes related information.
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListNodesResult>} Unified paginated response with data and pagination properties including related information
 * @throws {APIError} If retrieval fails
 */
export const listNodesPaginated = api(
  { expose: true, method: 'POST', path: '/nodes/list' },
  async (
    params: PaginatedListNodesQueryParams,
  ): Promise<PaginatedListNodesResult> => {
    const nodesResult = await nodeRepository.findAllPaginated(params);

    return await nodeRepository.appendRelations(
      nodesResult.data,
      nodesResult.pagination,
      params,
    );
  },
);

/**
 * Updates an existing node.
 * @param params - Object containing the node ID and update data
 * @param params.id - The ID of the node to update
 * @returns {Promise<Node>} The updated node
 * @throws {APIError} If the node is not found or update fails
 */
export const updateNode = api(
  { expose: true, method: 'PUT', path: '/nodes/:id/update' },
  async ({
    id,
    ...data
  }: UpdateNodePayload & { id: number }): Promise<Node> => {
    return await nodeDomain.updateNode(id, data);
  },
);

/**
 * Deletes a node by its ID.
 * @param params - Object containing the node ID
 * @param params.id - The ID of the node to delete
 * @returns {Promise<Node>} The deleted node
 * @throws {APIError} If the node is not found or deletion fails
 */
export const deleteNode = api(
  { expose: true, method: 'DELETE', path: '/nodes/:id/delete' },
  async ({ id }: { id: number }): Promise<Node> => {
    return await nodeRepository.delete(id);
  },
);
