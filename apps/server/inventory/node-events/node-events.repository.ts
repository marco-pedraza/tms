import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '../db-service';
import { nodeEvents } from '../event-types/event-types.schema';
import type {
  CreateNodeEventPayload,
  NodeEvent,
  NodeEventFlat,
  NodeEventWithEventType,
  UpdateNodeEventPayload,
} from './node-events.types';

/**
 * Creates a repository for managing node events
 * @returns {Object} An object containing node event-specific operations and base CRUD operations
 */
export function createNodeEventRepository() {
  const baseRepository = createBaseRepository<
    NodeEvent,
    CreateNodeEventPayload,
    UpdateNodeEventPayload,
    typeof nodeEvents
  >(db, nodeEvents, 'NodeEvent', {
    softDeleteEnabled: false,
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
   * Finds all node events for a specific node
   * @param nodeId - The ID of the node
   * @param tx - Optional transaction instance
   * @returns Array of node events
   */
  async function findByNodeId(
    nodeId: number,
    tx?: TransactionalDB,
  ): Promise<NodeEvent[]> {
    const repo = getRepository(tx);
    return await repo.findAllBy(nodeEvents.nodeId, nodeId);
  }

  /**
   * Helper function to flatten node event data with event type information
   * @param event - Node event with eventType relation
   * @returns Flattened node event object
   */
  function flattenNodeEvent(event: NodeEventWithEventType): NodeEventFlat {
    return {
      // Node events fields
      id: event.id,
      nodeId: event.nodeId,
      eventTypeId: event.eventTypeId,
      customTime: event.customTime,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,

      // Event types fields (flattened)
      name: event.eventType.name,
      code: event.eventType.code,
      description: event.eventType.description,
      baseTime: event.eventType.baseTime,
      needsCost: event.eventType.needsCost,
      needsQuantity: event.eventType.needsQuantity,
      integration: event.eventType.integration,
      active: event.eventType.active,
    };
  }

  /**
   * Finds all node events with flattened event type information for a specific node
   * @param nodeId - The ID of the node
   * @returns Array of node events with flattened event type information
   */
  async function findByNodeIdFlat(nodeId: number) {
    const events = await db.query.nodeEvents.findMany({
      where: (nodeEvents, { eq }) => eq(nodeEvents.nodeId, nodeId),
      with: {
        eventType: true,
      },
    });

    return events.map(flattenNodeEvent);
  }

  /**
   * Finds all node events with flattened event type information for multiple nodes
   * @param nodeIds - Array of node IDs
   * @returns Map of nodeId to array of node events with flattened event type information
   */
  async function findByNodeIdsFlat(nodeIds: number[]) {
    if (nodeIds.length === 0) {
      return new Map();
    }

    const events = await db.query.nodeEvents.findMany({
      where: (nodeEvents, { inArray }) => inArray(nodeEvents.nodeId, nodeIds),
      with: {
        eventType: true,
      },
    });

    const flatEvents = events.map(flattenNodeEvent);

    // Group events by nodeId
    const eventsMap = new Map();
    for (const event of flatEvents) {
      if (!eventsMap.has(event.nodeId)) {
        eventsMap.set(event.nodeId, []);
      }
      eventsMap.get(event.nodeId).push(event);
    }

    // Ensure all nodeIds have an entry (even if empty array)
    for (const nodeId of nodeIds) {
      if (!eventsMap.has(nodeId)) {
        eventsMap.set(nodeId, []);
      }
    }

    return eventsMap;
  }

  /**
   * Deletes all node events for a specific node
   * @param nodeId - The ID of the node
   * @param tx - Optional transaction instance
   * @returns Array of deleted node events
   */
  async function deleteByNodeId(
    nodeId: number,
    tx?: TransactionalDB,
  ): Promise<NodeEvent[]> {
    const repo = getRepository(tx);

    const existingEvents = await findByNodeId(nodeId, tx);

    if (existingEvents.length === 0) {
      return [];
    }

    const deletedEvents = await repo.deleteMany(
      existingEvents.map((event) => event.id),
    );

    return deletedEvents;
  }

  /**
   * Creates multiple node events atomically
   * @param events - Array of node event payloads
   * @param tx - Optional transaction instance
   * @returns Array of created node events
   */
  async function createMany(
    events: CreateNodeEventPayload[],
    tx?: TransactionalDB,
  ): Promise<NodeEvent[]> {
    if (events.length === 0) {
      return [];
    }

    const repo = getRepository(tx);

    // If we have a transaction, use it directly for atomic operations
    if (tx) {
      const results: NodeEvent[] = [];
      for (const event of events) {
        const created = await repo.create(event);
        results.push(created);
      }
      return results;
    }

    // If no transaction provided, create one to ensure atomicity
    return await baseRepository.transaction(async (txRepo) => {
      const results: NodeEvent[] = [];
      for (const event of events) {
        const created = await txRepo.create(event);
        results.push(created);
      }
      return results;
    });
  }

  return {
    ...baseRepository,
    findByNodeId,
    findByNodeIdFlat,
    findByNodeIdsFlat,
    deleteByNodeId,
    createMany,
  };
}

// Export the repository instance
export const nodeEventRepository = createNodeEventRepository();
