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

// Generate error helpers automatically
const basePathwayErrors =
  createDomainErrorHelpersWithFields(PATHWAY_ERROR_CONFIG);

/**
 * Helper functions to add pathway-specific errors to collector
 */
export const pathwayErrors = {
  // Use generated helpers for most cases
  ...basePathwayErrors,

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
