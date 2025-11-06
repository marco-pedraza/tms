import type { Node } from './nodes.types';
import { nodeRepository } from './nodes.repository';

/**
 * Public integration type for nodes
 * Exposes only the fields needed for cross-service integration
 */
export type NodeIntegration = Pick<
  Node,
  | 'id'
  | 'code'
  | 'name'
  | 'latitude'
  | 'longitude'
  | 'allowsBoarding'
  | 'allowsAlighting'
  | 'active'
>;

/**
 * Nodes Integration Service
 *
 * Provides controlled access to nodes for other bounded contexts.
 * This is the ONLY way other services should access node data.
 *
 * @internal This API is for cross-service integration only
 */
export const nodesIntegration = {
  /**
   * Retrieves a single node by ID
   * @param id - The ID of the node
   * @returns The node data
   * @throws {NotFoundError} If the node is not found
   */
  async getNode(id: number): Promise<NodeIntegration> {
    const node = await nodeRepository.findOne(id);
    return {
      id: node.id,
      code: node.code,
      name: node.name,
      latitude: node.latitude,
      longitude: node.longitude,
      allowsBoarding: node.allowsBoarding,
      allowsAlighting: node.allowsAlighting,
      active: node.active,
    };
  },

  /**
   * Retrieves multiple nodes by their IDs
   * This is a batch operation optimized for fetching multiple entities at once
   *
   * @param ids - Array of node IDs to retrieve
   * @returns Array of nodes in the same order as requested IDs
   */
  async getNodesByIds(ids: number[]): Promise<NodeIntegration[]> {
    if (ids.length === 0) return [];

    const nodes = await nodeRepository.findByIds(ids);
    return nodes.map((node) => ({
      id: node.id,
      code: node.code,
      name: node.name,
      latitude: node.latitude,
      longitude: node.longitude,
      allowsBoarding: node.allowsBoarding,
      allowsAlighting: node.allowsAlighting,
      active: node.active,
    }));
  },
};
