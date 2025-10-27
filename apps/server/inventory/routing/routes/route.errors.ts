import { FieldErrorCollector } from '@repo/base-repo';
import { createDomainErrorHelpersWithFields } from '@/shared/domain/domain-errors';

// Route-specific error configuration
const ROUTE_ERROR_CONFIG = {
  sameOriginDestination: {
    message: 'Origin and destination nodes cannot be the same',
    field: 'destinationNodeId',
    code: 'INVALID_VALUE',
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
      'Cannot update a route that has not been persisted yet. Call save() first.',
    field: 'id',
    code: 'INVALID_STATE',
  },
  buslineNotFound: {
    message: 'Bus line not found',
    field: 'buslineId',
    code: 'NOT_FOUND',
  },
  serviceTypeNotFound: {
    message: 'Service type not found',
    field: 'serviceTypeId',
    code: 'NOT_FOUND',
  },
} as const;

// Generate error helpers automatically
const baseRouteErrors = createDomainErrorHelpersWithFields(ROUTE_ERROR_CONFIG);

/**
 * Helper functions to add route-specific errors to collector
 */
export const routeErrors = {
  // Use generated helpers for base route errors
  ...baseRouteErrors,

  /**
   * Adds error when pathway option doesn't belong to the specified pathway
   */
  pathwayOptionMismatch: (
    collector: FieldErrorCollector,
    legIndex: number,
    pathwayOptionId: number,
    pathwayId: number,
  ) => {
    collector.addError(
      `legs[${legIndex}].pathwayOptionId`,
      'INVALID_REFERENCE',
      `Pathway option ${pathwayOptionId} does not belong to pathway ${pathwayId}`,
      { pathwayOptionId, pathwayId },
    );
  },

  /**
   * Adds error when pathway is not found in a leg
   */
  pathwayNotFoundInLeg: (
    collector: FieldErrorCollector,
    legIndex: number,
    pathwayId: number,
  ) => {
    collector.addError(
      `legs[${legIndex}].pathwayId`,
      'NOT_FOUND',
      `Pathway with ID ${pathwayId} not found`,
      pathwayId,
    );
  },

  /**
   * Adds error when pathway option is not found in a leg
   */
  pathwayOptionNotFoundInLeg: (
    collector: FieldErrorCollector,
    legIndex: number,
    pathwayOptionId: number,
  ) => {
    collector.addError(
      `legs[${legIndex}].pathwayOptionId`,
      'NOT_FOUND',
      `Pathway option with ID ${pathwayOptionId} not found`,
      pathwayOptionId,
    );
  },

  /**
   * Adds error when first leg pathway origin doesn't match route origin
   */
  legSequenceOriginMismatchError: (
    collector: FieldErrorCollector,
    legIndex: number,
    expectedNodeId: number,
    actualNodeId: number,
  ) => {
    collector.addError(
      `legs[${legIndex}].pathwayId`,
      'INVALID_SEQUENCE',
      `First leg pathway origin (${actualNodeId}) does not match route origin (${expectedNodeId})`,
      { expectedNodeId, actualNodeId },
    );
  },

  /**
   * Adds error when last leg pathway destination doesn't match route destination
   */
  legSequenceDestinationMismatchError: (
    collector: FieldErrorCollector,
    legIndex: number,
    expectedNodeId: number,
    actualNodeId: number,
  ) => {
    collector.addError(
      `legs[${legIndex}].pathwayId`,
      'INVALID_SEQUENCE',
      `Last leg pathway destination (${actualNodeId}) does not match route destination (${expectedNodeId})`,
      { expectedNodeId, actualNodeId },
    );
  },

  /**
   * Adds error when consecutive legs have broken chain
   */
  legSequenceChainBrokenError: (
    collector: FieldErrorCollector,
    fromLegIndex: number,
    toLegIndex: number,
    expectedNodeId: number,
    actualNodeId: number,
  ) => {
    collector.addError(
      `legs[${fromLegIndex}].pathwayId`,
      'INVALID_SEQUENCE',
      `Leg ${fromLegIndex} destination node (${actualNodeId}) must match leg ${toLegIndex} origin node (${expectedNodeId})`,
      { fromLegIndex, toLegIndex, expectedNodeId, actualNodeId },
    );
  },
};
