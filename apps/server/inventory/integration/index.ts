/**
 * Public integration API for inventory service
 *
 * Other services should ONLY import from this file to access inventory data.
 * Direct imports from feature directories are NOT allowed.
 *
 * This module aggregates all feature-specific integration services and types,
 * providing a single, stable entry point for cross-service communication.
 *
 * Integration services are defined in separate `.integration.ts` files within each feature,
 * promoting locality of behavior while maintaining clear separation between internal
 * repository access and cross-service integration.
 *
 * @example
 * ```typescript
 * import {
 *   busLinesIntegration,
 *   nodesIntegration
 * } from '@/inventory/integration';
 *
 * const busLine = await busLinesIntegration.getBusLine(1);
 * const node = await nodesIntegration.getNode(10);
 * ```
 */

// Export integration services from feature-specific integration files
// These services are exported here to provide a single entry point for other services
export { busLinesIntegration } from '../operators/bus-lines/bus-lines.integration';
export { nodesIntegration } from '../locations/nodes/nodes.integration';
export { busModelsIntegration } from '../fleet/bus-models/bus-models.integration';
export { serviceTypesIntegration } from '../operators/service-types/service-types.integration';

// Export integration types from feature-specific integration files
// These types are exported here to provide a single entry point for other services
export type { BusLineIntegration } from '../operators/bus-lines/bus-lines.integration';
export type { NodeIntegration } from '../locations/nodes/nodes.integration';
export type { BusModelIntegration } from '../fleet/bus-models/bus-models.integration';
export type { ServiceTypeIntegration } from '../operators/service-types/service-types.integration';
