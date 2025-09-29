import { api } from 'encore.dev/api';
import type {
  CreatePathwayOptionPayload,
  UpdatePathwayOptionPayload,
} from '../pathway-options/pathway-options.types';
import type {
  CreatePathwayPayload,
  ListPathwaysQueryParams,
  ListPathwaysResult,
  PaginatedListPathwaysQueryParams,
  PaginatedListPathwaysResult,
  Pathway,
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
  { expose: true, method: 'POST', path: '/pathways/create' },
  async (params: CreatePathwayPayload): Promise<Pathway> => {
    return await pathwayApplicationService.createPathway(params);
  },
);

/**
 * Retrieves a pathway by its ID.
 * @param params - Object containing the pathway ID
 * @param params.id - The ID of the pathway to retrieve
 * @returns {Promise<Pathway>} The found pathway
 * @throws {APIError} If the pathway is not found or retrieval fails
 */
export const getPathway = api(
  { expose: true, method: 'GET', path: '/pathways/:id' },
  async ({ id }: { id: number }): Promise<Pathway> => {
    return await pathwayApplicationService.findPathway(id);
  },
);

/**
 * Retrieves all pathways without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListPathwaysResult>} Unified response with data property containing array of pathways
 * @throws {APIError} If retrieval fails
 */
export const listPathways = api(
  { expose: true, method: 'POST', path: '/pathways/list/all' },
  async (params: ListPathwaysQueryParams): Promise<ListPathwaysResult> => {
    const pathways = await pathwayRepository.findAll(params);
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
  { expose: true, method: 'POST', path: '/pathways/list' },
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
  { expose: true, method: 'PUT', path: '/pathways/:id/update' },
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
  { expose: true, method: 'DELETE', path: '/pathways/:id/delete' },
  async ({ id }: { id: number }): Promise<Pathway> => {
    return await pathwayRepository.delete(id);
  },
);

// =============================================================================
// PATHWAY OPTION ENDPOINTS
// =============================================================================

/**
 * Adds an option to a pathway.
 * @param params - Object containing pathway ID and option data
 * @returns {Promise<Pathway>} The updated pathway with the new option
 * @throws {APIError} If the pathway is not found or operation fails
 */
export const addOptionToPathway = api(
  { expose: true, method: 'POST', path: '/pathways/:pathwayId/options/add' },
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
  },
  async (params: { pathwayId: number; optionId: number }): Promise<Pathway> => {
    return await pathwayApplicationService.setDefaultOption(
      params.pathwayId,
      params.optionId,
    );
  },
);
