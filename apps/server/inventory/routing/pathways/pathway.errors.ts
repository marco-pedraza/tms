import { FieldErrorCollector } from '@repo/base-repo';
import { createDomainErrorHelpersWithFields } from '@/shared/domain/domain-errors';

// Pathway-specific error configuration
const PATHWAY_ERROR_CONFIG = {
  sameOriginDestination: {
    message: 'Origin and destination nodes cannot be the same',
    field: 'destinationNodeId',
    code: 'INVALID_VALUE',
  },
  emptyTripSellable: {
    message: 'Empty trip pathways cannot be sellable',
    field: 'isSellable',
  },
  activationWithoutOptions: {
    message: 'Pathway cannot be activated without at least one option',
    field: 'active',
  },
  originNodeNotFound: {
    message: 'Origin node not found',
    field: 'originNodeId',
    code: 'NOT_FOUND',
  },
  destinationNodeNotFound: {
    message: 'Destination node not found',
    field: 'destinationNodeId',
    code: 'NOT_FOUND',
  },
  updateNotPersisted: {
    message:
      'Cannot update a pathway that has not been persisted yet. Call save() first.',
    field: 'id',
    code: 'INVALID_STATE',
  },
  cannotAddOptionsToNonPersisted: {
    message:
      'Cannot add options to a pathway that has not been persisted yet. Call save() first.',
    field: 'id',
    code: 'INVALID_STATE',
  },
  optionNotFound: {
    message: 'Pathway option not found',
    field: 'optionId',
    code: 'NOT_FOUND',
  },
  cannotRemoveLastOption: {
    message: 'Cannot remove the last option from an active pathway',
    field: 'active',
  },
  cannotRemoveDefaultOption: {
    message:
      'Cannot remove the default option. Set another option as default first.',
    field: 'optionId',
  },
} as const;

// Bulk sync-specific error configuration
const BULK_SYNC_ERROR_CONFIG = {
  emptyOptions: {
    message: 'Pathway must have at least one option',
    field: 'options',
    code: 'REQUIRED',
  },
  cannotRemoveAllOptionsFromActivePathway: {
    message: 'Cannot remove all options from an active pathway',
    field: 'options',
    code: 'INVALID_OPERATION',
  },
  multipleDefaults: {
    message: 'Only one option can be marked as default',
    field: 'options',
    code: 'MULTIPLE_DEFAULTS',
  },
  duplicateOptionNames: {
    message: 'Duplicate option names found',
    field: 'options',
    code: 'DUPLICATE_NAMES',
  },
  optionsNotFound: {
    message: 'Some options were not found',
    field: 'options',
    code: 'OPTIONS_NOT_FOUND',
  },
  optionsFromDifferentPathway: {
    message: 'Some options belong to a different pathway',
    field: 'options',
    code: 'WRONG_PATHWAY',
  },
  tollNodesNotFound: {
    message: 'Some toll nodes were not found',
    field: 'tolls',
    code: 'NODES_NOT_FOUND',
  },
  duplicateTollNodesInOption: {
    message: 'Duplicate toll nodes found within an option',
    field: 'tolls',
    code: 'DUPLICATE_NODES',
  },
  consecutiveDuplicateTolls: {
    message: 'Consecutive duplicate toll nodes are not allowed',
    field: 'tolls',
    code: 'CONSECUTIVE_DUPLICATES',
  },
} as const;

// Generate error helpers automatically
const basePathwayErrors =
  createDomainErrorHelpersWithFields(PATHWAY_ERROR_CONFIG);
const bulkSyncErrorHelpers = createDomainErrorHelpersWithFields(
  BULK_SYNC_ERROR_CONFIG,
);

/**
 * Helper functions to add pathway-specific errors to collector
 */
export const pathwayErrors = {
  // Use generated helpers for base pathway errors
  ...basePathwayErrors,

  // Use generated helpers for bulk sync errors
  ...bulkSyncErrorHelpers,

  /**
   * Adds error when option belongs to different pathway
   * Custom implementation needed for complex object value
   */
  optionBelongsToDifferentPathway: (
    collector: FieldErrorCollector,
    optionId: number,
    expectedPathwayId: number,
    actualPathwayId: number,
  ) => {
    collector.addError(
      'optionId',
      'INVALID_REFERENCE',
      'Option belongs to a different pathway',
      { optionId, expectedPathwayId, actualPathwayId },
    );
  },
};
