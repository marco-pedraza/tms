import { api } from 'encore.dev/api';
import type {
  Chromatic,
  CreateChromaticPayload,
  ListChromaticsQueryParams,
  ListChromaticsResult,
  PaginatedListChromaticsQueryParams,
  PaginatedListChromaticsResult,
  UpdateChromaticPayload,
} from './chromatics.types';
import { chromaticsRepository } from './chromatics.repository';
import { chromaticDomain } from './chromatics.domain';

/**
 * Creates a new chromatic.
 * @param params - The chromatic data to create
 * @returns {Promise<Chromatic>} The created chromatic
 * @throws {APIError} If the chromatic creation fails
 */
export const createChromatic = api(
  {
    expose: true,
    method: 'POST',
    path: '/chromatics/create',
    auth: true,
  },
  async (params: CreateChromaticPayload): Promise<Chromatic> => {
    await chromaticDomain.validateChromatic(params);
    return await chromaticsRepository.create(params);
  },
);

/**
 * Retrieves a chromatic by its ID.
 * @param params - Object containing the chromatic ID
 * @param params.id - The ID of the chromatic to retrieve
 * @returns {Promise<Chromatic>} The found chromatic
 * @throws {APIError} If the chromatic is not found or retrieval fails
 */
export const getChromatic = api(
  {
    expose: true,
    method: 'GET',
    path: '/chromatics/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Chromatic> => {
    return await chromaticsRepository.findOne(id);
  },
);

/**
 * Retrieves all chromatics without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListChromaticsResult>} Unified response with data property containing array of chromatics
 * @throws {APIError} If retrieval fails
 */
export const listChromatics = api(
  {
    expose: true,
    method: 'POST',
    path: '/chromatics/list/all',
    auth: true,
  },
  async (params: ListChromaticsQueryParams): Promise<ListChromaticsResult> => {
    const chromatics = await chromaticsRepository.findAll(params);
    return {
      data: chromatics,
    };
  },
);

/**
 * Retrieves chromatics with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListChromaticsResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listChromaticsPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/chromatics/list',
    auth: true,
  },
  async (
    params: PaginatedListChromaticsQueryParams,
  ): Promise<PaginatedListChromaticsResult> => {
    return await chromaticsRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing chromatic.
 * @param params - Object containing the chromatic ID and update data
 * @param params.id - The ID of the chromatic to update
 * @returns {Promise<Chromatic>} The updated chromatic
 * @throws {APIError} If the chromatic is not found or update fails
 */
export const updateChromatic = api(
  {
    expose: true,
    method: 'PUT',
    path: '/chromatics/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateChromaticPayload & { id: number }): Promise<Chromatic> => {
    await chromaticDomain.validateChromatic(data, id);
    return await chromaticsRepository.update(id, data);
  },
);

/**
 * Deletes a chromatic by its ID.
 * @param params - Object containing the chromatic ID
 * @param params.id - The ID of the chromatic to delete
 * @returns {Promise<Chromatic>} The deleted chromatic
 * @throws {APIError} If the chromatic is not found or deletion fails
 */
export const deleteChromatic = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/chromatics/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Chromatic> => {
    return await chromaticsRepository.delete(id);
  },
);
