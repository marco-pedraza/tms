import { FieldErrorCollector } from '@repo/base-repo';

/**
 * Repository interface for node operations used in routing validation
 */
interface NodeRepository {
  findOne: (id: number) => Promise<{ id: number; cityId: number }>;
}

/**
 * Utility functions for common node validation rules in routing domain
 * Used across routing entities (routes, pathways, etc.)
 */

/**
 * Validates that origin and destination nodes are different
 * @param data - Data containing origin and destination node IDs
 * @param collector - Error collector to accumulate validation errors
 * @param errorFactory - Function to create specific error for the entity type
 * @returns True if validation passes, false if there are errors
 */
export function validateOriginDestinationRule(
  data: {
    originNodeId?: number;
    destinationNodeId?: number;
  },
  collector: FieldErrorCollector,
  errorFactory: (
    collector: FieldErrorCollector,
    destinationNodeId: number,
  ) => void,
): boolean {
  if (
    data.originNodeId &&
    data.destinationNodeId &&
    data.originNodeId === data.destinationNodeId
  ) {
    errorFactory(collector, data.destinationNodeId);
    return false;
  }

  return true;
}

/**
 * Validates that nodes exist and returns their city IDs
 * @param originNodeId - The origin node ID
 * @param destinationNodeId - The destination node ID
 * @param nodeRepository - Repository to fetch nodes
 * @param collector - Error collector to accumulate validation errors
 * @param errorFactories - Object with functions to create specific errors for each node
 * @returns Object with origin and destination city IDs, or null if validation fails
 */
export async function validateNodesAndGetCities(
  originNodeId: number,
  destinationNodeId: number,
  nodeRepository: NodeRepository,
  collector: FieldErrorCollector,
  errorFactories: {
    originNodeNotFound: (
      collector: FieldErrorCollector,
      nodeId: number,
    ) => void;
    destinationNodeNotFound: (
      collector: FieldErrorCollector,
      nodeId: number,
    ) => void;
  },
): Promise<{ originCityId: number; destinationCityId: number } | null> {
  let originNode: { id: number; cityId: number } | null = null;
  let destinationNode: { id: number; cityId: number } | null = null;

  // Try to find origin node
  try {
    originNode = await nodeRepository.findOne(originNodeId);
  } catch {
    errorFactories.originNodeNotFound(collector, originNodeId);
  }

  // Try to find destination node
  try {
    destinationNode = await nodeRepository.findOne(destinationNodeId);
  } catch {
    errorFactories.destinationNodeNotFound(collector, destinationNodeId);
  }

  // Return null if there were errors
  if (collector.hasErrors()) {
    return null;
  }

  // At this point, both nodes must exist
  if (!originNode || !destinationNode) {
    throw new Error('Internal error: nodes should exist after validation');
  }

  return {
    originCityId: originNode.cityId,
    destinationCityId: destinationNode.cityId,
  };
}
