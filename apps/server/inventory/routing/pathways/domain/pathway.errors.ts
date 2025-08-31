import { FieldErrorCollector } from '@repo/base-repo';

// Pathway-specific error messages
export const PATHWAY_ERRORS = {
  SAME_ORIGIN_DESTINATION: 'Origin and destination nodes cannot be the same',
  EMPTY_TRIP_SELLABLE: 'Empty trip pathways cannot be sellable',
  ACTIVATION_WITHOUT_OPTIONS:
    'Pathway cannot be activated without at least one option',
  CREATION_ACTIVE:
    'New pathways cannot be created as active. Add options first, then activate.',
  UPDATE_NOT_PERSISTED:
    'Cannot update a pathway that has not been persisted yet. Call save() first.',
  ORIGIN_NODE_NOT_FOUND: 'Origin node not found',
  DESTINATION_NODE_NOT_FOUND: 'Destination node not found',
  CANNOT_ADD_OPTIONS_TO_NON_PERSISTED:
    'Cannot add options to a pathway that has not been persisted yet. Call save() first.',
  OPTION_NOT_FOUND: 'Pathway option not found',
  OPTION_BELONGS_TO_DIFFERENT_PATHWAY: 'Option belongs to a different pathway',
  CANNOT_REMOVE_LAST_OPTION:
    'Cannot remove the last option from an active pathway',
  CANNOT_REMOVE_DEFAULT_OPTION:
    'Cannot remove the default option. Set another option as default first.',
} as const;

/**
 * Helper functions to add pathway-specific errors to collector
 */
export const pathwayErrors = {
  /**
   * Adds error when origin and destination are the same
   */
  sameOriginDestination: (
    collector: FieldErrorCollector,
    destinationNodeId: number,
  ) => {
    collector.addError(
      'destinationNodeId',
      'INVALID_VALUE',
      PATHWAY_ERRORS.SAME_ORIGIN_DESTINATION,
      destinationNodeId,
    );
  },

  /**
   * Adds error when empty trip pathway is marked as sellable
   */
  emptyTripSellable: (collector: FieldErrorCollector, isSellable: boolean) => {
    collector.addError(
      'isSellable',
      'BUSINESS_RULE_VIOLATION',
      PATHWAY_ERRORS.EMPTY_TRIP_SELLABLE,
      isSellable,
    );
  },

  /**
   * Adds error when trying to activate pathway without options
   */
  activationWithoutOptions: (collector: FieldErrorCollector) => {
    collector.addError(
      'active',
      'BUSINESS_RULE_VIOLATION',
      PATHWAY_ERRORS.ACTIVATION_WITHOUT_OPTIONS,
      true,
    );
  },

  /**
   * Adds error when trying to update non-persisted pathway
   */
  updateNotPersisted: (collector: FieldErrorCollector, pathwayId?: number) => {
    collector.addError(
      'id',
      'INVALID_STATE',
      PATHWAY_ERRORS.UPDATE_NOT_PERSISTED,
      pathwayId,
    );
  },

  /**
   * Adds error when origin node is not found
   */
  originNodeNotFound: (collector: FieldErrorCollector, nodeId: number) => {
    collector.addError(
      'originNodeId',
      'NOT_FOUND',
      PATHWAY_ERRORS.ORIGIN_NODE_NOT_FOUND,
      nodeId,
    );
  },

  /**
   * Adds error when destination node is not found
   */
  destinationNodeNotFound: (collector: FieldErrorCollector, nodeId: number) => {
    collector.addError(
      'destinationNodeId',
      'NOT_FOUND',
      PATHWAY_ERRORS.DESTINATION_NODE_NOT_FOUND,
      nodeId,
    );
  },

  /**
   * Adds error when trying to add options to non-persisted pathway
   */
  cannotAddOptionsToNonPersisted: (collector: FieldErrorCollector) => {
    collector.addError(
      'id',
      'INVALID_STATE',
      PATHWAY_ERRORS.CANNOT_ADD_OPTIONS_TO_NON_PERSISTED,
      undefined,
    );
  },

  /**
   * Adds error when option is not found
   */
  optionNotFound: (collector: FieldErrorCollector, optionId: number) => {
    collector.addError(
      'optionId',
      'NOT_FOUND',
      PATHWAY_ERRORS.OPTION_NOT_FOUND,
      optionId,
    );
  },

  /**
   * Adds error when option belongs to different pathway
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
      PATHWAY_ERRORS.OPTION_BELONGS_TO_DIFFERENT_PATHWAY,
      { optionId, expectedPathwayId, actualPathwayId },
    );
  },

  /**
   * Adds error when trying to remove last option from active pathway
   */
  cannotRemoveLastOption: (collector: FieldErrorCollector) => {
    collector.addError(
      'active',
      'BUSINESS_RULE_VIOLATION',
      PATHWAY_ERRORS.CANNOT_REMOVE_LAST_OPTION,
      true,
    );
  },

  /**
   * Adds error when trying to remove the default option
   */
  cannotRemoveDefaultOption: (
    collector: FieldErrorCollector,
    optionId: number,
  ) => {
    collector.addError(
      'optionId',
      'BUSINESS_RULE_VIOLATION',
      PATHWAY_ERRORS.CANNOT_REMOVE_DEFAULT_OPTION,
      optionId,
    );
  },
};
