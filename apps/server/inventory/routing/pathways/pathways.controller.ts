import { api } from 'encore.dev/api';
import type {
  PathwayOptionToll,
  SyncTollsInput,
} from '../pathway-options-tolls/pathway-options-tolls.types';
import type {
  CreatePathwayOptionPayload,
  ListPathwayOptionsResult,
  UpdatePathwayOptionPayload,
} from '../pathway-options/pathway-options.types';
import type {
  BulkSyncOptionInput,
  CreatePathwayPayload,
  ListPathwaysQueryParams,
  ListPathwaysResult,
  PaginatedListPathwaysQueryParams,
  PaginatedListPathwaysResult,
  Pathway,
  PathwayWithRelations,
  UpdatePathwayPayload,
} from './pathways.types';
import { pathwayRepository } from './pathways.repository';
import { pathwayApplicationService } from './pathways.application-service';

/**
 * Creates a new pathway.
 * @param params - The pathway data to create
 * @returns {Promise<Pathway>} The created pathway
 * @throws {APIError} If the pathway creation fails
 */
export const createPathway = api(
  {
    expose: true,
    method: 'POST',
    path: '/pathways/create',
    auth: true,
  },
  async (params: CreatePathwayPayload): Promise<Pathway> => {
    return await pathwayApplicationService.createPathway(params);
  },
);

/**
 * Retrieves a pathway by its ID with its relations (origin, destination, and options).
 * @param params - Object containing the pathway ID
 * @param params.id - The ID of the pathway to retrieve
 * @returns {Promise<PathwayWithRelations>} The found pathway with relations
 * @throws {APIError} If the pathway is not found or retrieval fails
 */
export const getPathway = api(
  {
    expose: true,
    method: 'GET',
    path: '/pathways/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<PathwayWithRelations> => {
    return await pathwayRepository.findOneWithRelations(id);
  },
);

/**
 * Retrieves all pathways without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListPathwaysResult>} Unified response with data property containing array of pathways
 * @throws {APIError} If retrieval fails
 */
export const listPathways = api(
  {
    expose: true,
    method: 'POST',
    path: '/pathways/list/all',
    auth: true,
  },
  async (params: ListPathwaysQueryParams): Promise<ListPathwaysResult> => {
    const pathways = await pathwayRepository.findAllWithRelations(params);
    return {
      data: pathways,
    };
  },
);

/**
 * Retrieves pathways with pagination.
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListPathwaysResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listPathwaysPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/pathways/list',
    auth: true,
  },
  async (
    params: PaginatedListPathwaysQueryParams,
  ): Promise<PaginatedListPathwaysResult> => {
    return await pathwayRepository.findAllPaginatedWithRelations(params);
  },
);

/**
 * Updates an existing pathway.
 * @param params - Object containing the pathway ID and update data
 * @param params.id - The ID of the pathway to update
 * @returns {Promise<Pathway>} The updated pathway
 * @throws {APIError} If the pathway is not found or update fails
 */
export const updatePathway = api(
  {
    expose: true,
    method: 'PUT',
    path: '/pathways/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdatePathwayPayload & { id: number }): Promise<Pathway> => {
    return await pathwayApplicationService.updatePathway(id, data);
  },
);

/**
 * Deletes a pathway by its ID.
 * @param params - Object containing the pathway ID
 * @param params.id - The ID of the pathway to delete
 * @returns {Promise<Pathway>} The deleted pathway
 * @throws {APIError} If the pathway is not found or deletion fails
 */
export const deletePathway = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/pathways/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Pathway> => {
    return await pathwayRepository.delete(id);
  },
);

// =============================================================================
// PATHWAY OPTION ENDPOINTS
// =============================================================================

/**
 * Retrieves all options for a pathway.
 * @param params - Object containing the pathway ID
 * @param params.pathwayId - The ID of the pathway to retrieve options for
 * @returns {Promise<ListPathwayOptionsResult>} The found pathway options
 * @throws {APIError} If the pathway or options are not found or retrieval fails
 */
export const getPathwayOptions = api(
  {
    expose: true,
    method: 'GET',
    path: '/pathways/:pathwayId/options/list',
    auth: true,
  },
  async ({
    pathwayId,
  }: {
    pathwayId: number;
  }): Promise<ListPathwayOptionsResult> => {
    const options = await pathwayApplicationService.findAllOptions(pathwayId);
    return { data: options };
  },
);

/**
 * Adds an option to a pathway.
 * @param params - Object containing pathway ID and option data
 * @returns {Promise<Pathway>} The updated pathway with the new option
 * @throws {APIError} If the pathway is not found or operation fails
 */
export const addOptionToPathway = api(
  {
    expose: true,
    method: 'POST',
    path: '/pathways/:pathwayId/options/add',
    auth: true,
  },
  async (
    params: { pathwayId: number } & {
      optionData: Omit<CreatePathwayOptionPayload, 'pathwayId' | 'isDefault'>;
    },
  ): Promise<Pathway> => {
    return await pathwayApplicationService.addOptionToPathway(
      params.pathwayId,
      params.optionData,
    );
  },
);

/**
 * Removes an option from a pathway.
 * @param params - Object containing pathway ID and option ID
 * @returns {Promise<Pathway>} The updated pathway without the removed option
 * @throws {APIError} If the pathway or option is not found, or operation fails
 */
export const removeOptionFromPathway = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/pathways/:pathwayId/options/:optionId/remove',
    auth: true,
  },
  async (params: { pathwayId: number; optionId: number }): Promise<Pathway> => {
    return await pathwayApplicationService.removeOptionFromPathway(
      params.pathwayId,
      params.optionId,
    );
  },
);

/**
 * Updates an option within a pathway.
 * @param params - Object containing pathway ID, option ID, and update data
 * @returns {Promise<Pathway>} The updated pathway with the modified option
 * @throws {APIError} If the pathway or option is not found, or operation fails
 */
export const updatePathwayOption = api(
  {
    expose: true,
    method: 'PUT',
    path: '/pathways/:pathwayId/options/:optionId/update',
    auth: true,
  },
  async (
    params: { pathwayId: number; optionId: number } & {
      optionData: Omit<UpdatePathwayOptionPayload, 'pathwayId' | 'isDefault'>;
    },
  ): Promise<Pathway> => {
    return await pathwayApplicationService.updatePathwayOption(
      params.pathwayId,
      params.optionId,
      params.optionData,
    );
  },
);

/**
 * Sets a specific option as the default option for a pathway.
 * @param params - Object containing pathway ID and option ID
 * @returns {Promise<Pathway>} The updated pathway with the new default option
 * @throws {APIError} If the pathway or option is not found, or operation fails
 */
export const setDefaultPathwayOption = api(
  {
    expose: true,
    method: 'PUT',
    path: '/pathways/:pathwayId/options/:optionId/set-default',
    auth: true,
  },
  async (params: { pathwayId: number; optionId: number }): Promise<Pathway> => {
    return await pathwayApplicationService.setDefaultOption(
      params.pathwayId,
      params.optionId,
    );
  },
);

/**
 * Synchronizes tolls for a pathway option (destructive operation)
 * @param params - Request parameters with pathwayId and optionId
 * @param params.pathwayId - The ID of the pathway
 * @param params.optionId - The ID of the option to sync tolls for
 * @param params.tolls - Array of toll inputs (sequence assigned automatically 1..N)
 * @returns {Promise<Pathway>} The updated pathway
 * @throws {APIError} If the pathway or option is not found, or validation fails
 */
export const syncPathwayOptionTolls = api(
  {
    expose: true,
    method: 'POST',
    path: '/pathways/:pathwayId/options/:optionId/tolls/sync',
    auth: true,
  },
  async (params: {
    pathwayId: number;
    optionId: number;
    tolls: SyncTollsInput[];
  }): Promise<Pathway> => {
    return await pathwayApplicationService.syncOptionTolls(
      params.pathwayId,
      params.optionId,
      params.tolls,
    );
  },
);

/**
 * Lists all tolls for a pathway option ordered by sequence
 * @param params - Request parameters with pathwayId and optionId
 * @param params.pathwayId - The ID of the pathway
 * @param params.optionId - The ID of the option to get tolls from
 * @returns {Promise<{data: PathwayOptionToll[]}>} Array of pathway option tolls
 * @throws {APIError} If the pathway or option is not found
 */
export const listPathwayOptionTolls = api(
  {
    expose: true,
    method: 'POST',
    path: '/pathways/:pathwayId/options/:optionId/tolls/list',
    auth: true,
  },
  async (params: {
    pathwayId: number;
    optionId: number;
  }): Promise<{ data: PathwayOptionToll[] }> => {
    const tolls = await pathwayApplicationService.getOptionTolls(
      params.pathwayId,
      params.optionId,
    );
    return { data: tolls };
  },
);

/**
 * Synchronizes pathway options with their tolls (destructive operation)
 *
 * This endpoint allows creating, updating, and deleting multiple pathway options
 * in a single atomic transaction. Options are identified by their ID:
 * - Options with ID will be updated
 * - Options without ID will be created
 * - Options not included in the array will be deleted
 *
 * Business rules:
 * - At least one option must remain
 * - Only one option can be default per pathway
 * - If no default is specified, the current default is preserved (if in payload)
 *   or the first option becomes default
 * - Tolls can be synchronized for each option (if tolls array is provided)
 *
 * @param params - Request with pathwayId and options array
 * @returns {Promise<Pathway>} The updated pathway with all synchronized options
 * @throws {APIError} NotFound if pathway doesn't exist
 * @throws {APIError} InvalidArgument if validation fails
 */
export const syncPathwayOptions = api(
  {
    expose: true,
    method: 'POST',
    path: '/pathways/:pathwayId/options/sync',
    auth: true,
  },
  async (params: {
    pathwayId: number;
    options: BulkSyncOptionInput[];
  }): Promise<Pathway> => {
    return await pathwayApplicationService.syncPathwayOptions(
      params.pathwayId,
      {
        options: params.options,
      },
    );
  },
);
