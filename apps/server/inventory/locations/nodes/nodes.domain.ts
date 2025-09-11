import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { createSlug } from '@/shared/utils';
import { labelRepository } from '@/inventory/locations/labels/labels.repository';
import { nodes } from './nodes.schema';
import type {
  AssignLabelsToNodePayload,
  CreateNodePayload,
  Node,
  UpdateNodePayload,
} from './nodes.types';
import { nodeRepository } from './nodes.repository';

// Constants
const SLUG_PREFIX = 'n';

/**
 * Generates a slug for a node using 'n' prefix and node code
 */
function generateNodeSlug(name: string, code?: string): string {
  // Use code as suffix if provided, otherwise use name as source
  if (code) {
    return createSlug(name, SLUG_PREFIX, code);
  }
  return createSlug(name, SLUG_PREFIX);
}

/**
 * Prepares node data for creation by adding the generated slug
 */
function prepareNodeForCreation(
  payload: CreateNodePayload,
): CreateNodePayload & { slug: string } {
  const slug = generateNodeSlug(payload.name, payload.code);
  return { ...payload, slug };
}

/**
 * Prepares node data for update by conditionally regenerating the slug
 */
async function prepareNodeForUpdate(
  payload: UpdateNodePayload,
  currentId: number,
): Promise<UpdateNodePayload & { slug?: string }> {
  const updateData: UpdateNodePayload & { slug?: string } = { ...payload };

  // If name or code is being updated, regenerate slug
  if (payload.name || payload.code) {
    // Get current node to determine name and code
    const currentNode = await nodeRepository.findOne(currentId);
    const name = payload.name ?? currentNode.name;
    const code = payload.code ?? currentNode.code;

    updateData.slug = generateNodeSlug(name, code);
  }

  return updateData;
}

/**
 * Validate uniqueness constraints for node data with prepared slug
 */
async function validateNodeUniqueness(
  payload: CreateNodePayload | UpdateNodePayload,
  currentId?: number,
  preparedSlug?: string,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: nodes.code,
      value: payload.code,
    });
  }

  // Add slug to uniqueness check if provided
  if (preparedSlug) {
    fieldsToCheck.push({
      field: nodes.slug,
      value: preparedSlug,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await nodeRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Node',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates node data according to business rules
 * @throws {FieldValidationError} If there are validation violations
 */
async function validateNode(
  payload: CreateNodePayload | UpdateNodePayload,
  currentId?: number,
  preparedSlug?: string,
): Promise<void> {
  const validator = await validateNodeUniqueness(
    payload,
    currentId,
    preparedSlug,
  );

  // Validate populationId constraint when it's a number
  if (
    typeof payload.populationId === 'number' &&
    (!Number.isFinite(payload.populationId) ||
      !Number.isInteger(payload.populationId) ||
      payload.populationId <= 0)
  ) {
    validator.addError(
      'populationId',
      'MIN_VALUE',
      'Population ID must be a positive integer',
      payload.populationId,
    );
  }

  // TODO: Add foreign key validation for cityId, populationId, and installationId
  validator.throwIfErrors();
}

/**
 * Validates label assignment payload
 * @param nodeId - The ID of the node to validate
 * @param payload - The label assignment payload to validate
 * @throws {FieldValidationError} If validation fails
 */
async function validateLabelAssignment(
  nodeId: number,
  payload: AssignLabelsToNodePayload,
): Promise<void> {
  const collector = new FieldErrorCollector();

  // Validate that labelIds array has no duplicates
  const uniqueLabelIds = new Set(payload.labelIds);
  collector.addIf(
    uniqueLabelIds.size !== payload.labelIds.length,
    'labelIds',
    'DUPLICATE_INPUT',
    'Duplicate label IDs are not allowed in the assignment',
    payload.labelIds,
  );
  collector.throwIfErrors(); // Stop immediately if duplicates found

  // Validate node exists
  const nodeExists = await nodeRepository.existsBy(nodes.id, nodeId);
  collector.addIf(
    !nodeExists,
    'nodeId',
    'NOT_FOUND',
    `Node with id ${nodeId} not found`,
    nodeId,
  );
  collector.throwIfErrors(); // Stop immediately if node not found

  // If labelIds is empty, no need to validate labels
  if (payload.labelIds.length === 0) {
    return;
  }

  // Validate all labels exist using batch operation
  const uniqueLabelIdsArray = Array.from(uniqueLabelIds);
  const existingLabelIds =
    await labelRepository.findExistingIds(uniqueLabelIdsArray);

  // Find missing label IDs by comparing requested vs existing
  const missingLabelIds = uniqueLabelIdsArray.filter(
    (labelId) => !existingLabelIds.includes(labelId),
  );

  // Add single error for missing labels if any
  if (missingLabelIds.length > 0) {
    collector.addError(
      'labelIds',
      'NOT_FOUND',
      `Labels with ids [${missingLabelIds.join(', ')}] not found`,
      missingLabelIds,
    );
  }
  collector.throwIfErrors(); // Stop immediately if any labels not found
}

/**
 * Creates domain functions for managing node business logic
 */
export function createNodeDomain() {
  /**
   * Creates a new node with validation and slug generation
   * @throws {FieldValidationError} If validation fails
   */
  async function createNode(payload: CreateNodePayload): Promise<Node> {
    // Prepare data with generated slug
    const nodeData = prepareNodeForCreation(payload);

    // Validate the node data including slug uniqueness
    await validateNode(payload, undefined, nodeData.slug);

    // Create the node using the base repository
    return await nodeRepository.create(nodeData);
  }

  /**
   * Updates an existing node with validation and conditional slug regeneration
   * @throws {FieldValidationError} If validation fails
   */
  async function updateNode(
    id: number,
    payload: UpdateNodePayload,
  ): Promise<Node> {
    // Prepare data with conditionally updated slug
    const nodeData = await prepareNodeForUpdate(payload, id);

    // Validate the node data including slug uniqueness if slug was regenerated
    await validateNode(payload, id, nodeData.slug);

    // Update the node using the base repository
    return await nodeRepository.update(id, nodeData);
  }

  return {
    createNode,
    updateNode,
    validateNode,
    validateNodeUniqueness,
    validateLabelAssignment,
  };
}

// Export the domain instance
export const nodeDomain = createNodeDomain();
