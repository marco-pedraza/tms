import { FieldErrorCollector } from '@repo/base-repo';
import { nodeRepository } from '../nodes/nodes.repository';
import type { CreateNodeInstallationPayload } from './installations.types';

/**
 * Validates that a node exists and doesn't already have an installation
 * @param nodeId The node ID to validate
 * @param validator Optional existing field error collector
 * @returns Field error collector with any validation errors
 */
export async function validateNodeForInstallation(
  nodeId: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Check if node exists
  try {
    const node = await nodeRepository.findOne(nodeId);

    // Check if node already has an installation assigned
    if (node.installationId) {
      collector.addError(
        'nodeId',
        'DUPLICATE',
        `Node with id ${nodeId} already has an installation with id ${node.installationId}`,
        nodeId,
      );
    }
  } catch {
    // Node doesn't exist
    collector.addError(
      'nodeId',
      'NOT_FOUND',
      `Node with id ${nodeId} not found`,
      nodeId,
    );
  }

  return collector;
}

/**
 * Main validation function for creating installations associated with nodes
 * @param payload The installation data to validate
 * @throws {FieldValidationError} If validation fails
 */
export async function validateNodeInstallation(
  payload: CreateNodeInstallationPayload,
): Promise<void> {
  const validator = new FieldErrorCollector();

  // Validate node exists and doesn't have installation
  await validateNodeForInstallation(payload.nodeId, validator);

  // Throw if any validation errors
  validator.throwIfErrors();
}
