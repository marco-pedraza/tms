import { eq } from 'drizzle-orm';
import { ValidationError } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { eventTypeInstallationTypeRepository } from '@/inventory/locations/event-type-installation-types/event-type-installation-types.repository';
import { eventTypeRepository } from '@/inventory/locations/event-types/event-types.repository';
import { labelNodes } from '@/inventory/locations/labels/labels.schema';
import { nodeEventRepository } from '@/inventory/locations/node-events/node-events.repository';
import type { CreateNodeEventPayload } from '@/inventory/locations/node-events/node-events.types';
import type {
  AssignEventsToNodePayload,
  AssignLabelsToNodePayload,
  NodeWithRelations,
} from './nodes.types';
import { nodeRepository } from './nodes.repository';

// Node use case specific error messages
const NODE_ERRORS = {
  NODE_NOT_FOUND: (nodeId: number) => `Node with id ${nodeId} not found`,
  NO_INSTALLATION_ASSIGNED: (nodeId: number) =>
    `Node with id ${nodeId} has no installation assigned`,
  INVALID_EVENT_TYPE_IDS: (ids: number[]) =>
    `Event type IDs do not exist: ${ids.join(', ')}`,
  EVENT_TYPES_NOT_ALLOWED: (ids: number[], installationTypeId: number) =>
    `Event types ${ids.join(', ')} are not allowed for installation type ${installationTypeId}`,
};

/**
 * Creates use cases for nodes that involve complex business logic
 * @returns Object with node use case functions
 */
export function createNodeUseCases() {
  // Initialize repositories
  const nodeRepo = nodeRepository;
  const eventTypeRepo = eventTypeRepository;
  const eventTypeInstallationTypeRepo = eventTypeInstallationTypeRepository;
  const nodeEventRepo = nodeEventRepository;

  /**
   * Assigns events to a node with validation and atomicity
   * This is a destructive operation that replaces existing events
   * @param nodeId - The ID of the node to assign events to
   * @param payload - The assignment payload with events array
   * @returns The updated node with its relations and assigned events
   * @throws {ValidationError} If validation fails
   */
  async function assignEventsToNode(
    nodeId: number,
    payload: AssignEventsToNodePayload,
  ): Promise<NodeWithRelations> {
    return await nodeEventRepo
      .transaction(async (txRepo, tx) => {
        // Validate node exists and get installation type
        const installationTypeId =
          await nodeRepo.getInstallationTypeIdByNodeId(nodeId);

        if (installationTypeId === null) {
          throw new ValidationError(
            NODE_ERRORS.NO_INSTALLATION_ASSIGNED(nodeId),
          );
        }

        // Validate events if any are provided
        if (payload.events.length > 0) {
          await validateEventAssignment(payload.events, installationTypeId, tx);
        }

        // Delete existing events (destructive operation)
        await nodeEventRepo.deleteByNodeId(nodeId, tx);

        // Early return if no events to create
        if (payload.events.length === 0) {
          return nodeId;
        }

        // Create new events
        const createPayloads: CreateNodeEventPayload[] = payload.events.map(
          (event) => ({
            nodeId,
            eventTypeId: event.eventTypeId,
            customTime: event.customTime ?? null,
          }),
        );

        await nodeEventRepo.createMany(createPayloads, tx);
        return nodeId;
      })
      .then((nodeId) => nodeRepo.findOneWithRelations(nodeId));
  }

  /**
   * Validates that event types exist and are allowed for the installation type
   */
  async function validateEventAssignment(
    events: AssignEventsToNodePayload['events'],
    installationTypeId: number,
    tx?: TransactionalDB,
  ): Promise<void> {
    const eventTypeIds = [...new Set(events.map((event) => event.eventTypeId))];

    // Validate event types exist
    const missingEventTypeIds = await eventTypeRepo.validateEventTypeIds(
      eventTypeIds,
      tx,
    );
    if (missingEventTypeIds.length > 0) {
      throw new ValidationError(
        NODE_ERRORS.INVALID_EVENT_TYPE_IDS(missingEventTypeIds),
      );
    }

    // Validate event types are allowed for installation type
    try {
      const notAllowedEventTypeIds =
        await eventTypeInstallationTypeRepo.validateEventTypesForInstallationType(
          installationTypeId,
          eventTypeIds,
          tx,
        );
      if (notAllowedEventTypeIds.length > 0) {
        throw new ValidationError(
          NODE_ERRORS.EVENT_TYPES_NOT_ALLOWED(
            notAllowedEventTypeIds,
            installationTypeId,
          ),
        );
      }
    } catch (error) {
      // If it's already a ValidationError, rethrow it
      if (error instanceof ValidationError) {
        throw error;
      }
      // Handle any unexpected errors by wrapping them with context
      if (error instanceof Error) {
        throw new ValidationError(
          `Failed to validate event types for installation type ${installationTypeId}: ${error.message}`,
        );
      }
      // Handle non-Error objects
      throw new ValidationError(
        `Failed to validate event types for installation type ${installationTypeId}`,
      );
    }
  }

  /**
   * Assigns labels to a node with validation and atomicity
   * This is a destructive operation that replaces existing labels
   * @param nodeId - The ID of the node to assign labels to
   * @param payload - The assignment payload with label IDs
   * @returns The updated node with its relations and assigned labels
   * @throws {ValidationError} If validation fails
   */
  async function assignLabelsToNode(
    nodeId: number,
    payload: AssignLabelsToNodePayload,
  ): Promise<NodeWithRelations> {
    return await nodeRepo
      .transaction(async (txRepo, tx) => {
        // Remove duplicates from labelIds
        const uniqueLabelIds = [...new Set(payload.labelIds)];

        // Delete existing label assignments
        await tx.delete(labelNodes).where(eq(labelNodes.nodeId, nodeId));

        // Insert new label assignments if any
        if (uniqueLabelIds.length > 0) {
          const labelAssignments = uniqueLabelIds.map((labelId) => ({
            nodeId,
            labelId,
          }));

          await tx.insert(labelNodes).values(labelAssignments);
        }

        return nodeId;
      })
      .then((nodeId) => nodeRepo.findOneWithRelations(nodeId));
  }

  return {
    assignEventsToNode,
    assignLabelsToNode,
  };
}

// Export the use cases instance
export const nodeUseCases = createNodeUseCases();
