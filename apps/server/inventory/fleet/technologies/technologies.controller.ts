import { api } from 'encore.dev/api';
import type {
  CreateTechnologyPayload,
  ListTechnologiesQueryParams,
  ListTechnologiesResult,
  PaginatedListTechnologiesQueryParams,
  PaginatedListTechnologiesResult,
  Technology,
  UpdateTechnologyPayload,
} from './technologies.types';
import { technologiesRepository } from './technologies.repository';
import { technologyDomain } from './technologies.domain';

/**
 * Creates a new technology.
 * @param params - The technology data to create
 * @returns {Promise<Technology>} The created technology
 * @throws {APIError} If the technology creation fails
 */
export const createTechnology = api(
  {
    expose: true,
    method: 'POST',
    path: '/technologies/create',
    auth: true,
  },
  async (params: CreateTechnologyPayload): Promise<Technology> => {
    await technologyDomain.validateTechnology(params);
    return await technologiesRepository.create(params);
  },
);

/**
 * Retrieves a technology by its ID.
 * @param params - Object containing the technology ID
 * @param params.id - The ID of the technology to retrieve
 * @returns {Promise<Technology>} The found technology
 * @throws {APIError} If the technology is not found or retrieval fails
 */
export const getTechnology = api(
  {
    expose: true,
    method: 'GET',
    path: '/technologies/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Technology> => {
    return await technologiesRepository.findOne(id);
  },
);

/**
 * Retrieves all technologies without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListTechnologiesResult>} Unified response with data property containing array of technologies
 * @throws {APIError} If retrieval fails
 */
export const listTechnologies = api(
  {
    expose: true,
    method: 'POST',
    path: '/technologies/list/all',
    auth: true,
  },
  async (
    params: ListTechnologiesQueryParams,
  ): Promise<ListTechnologiesResult> => {
    const technologies = await technologiesRepository.findAll(params);
    return {
      data: technologies,
    };
  },
);

/**
 * Retrieves technologies with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListTechnologiesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listTechnologiesPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/technologies/list',
    auth: true,
  },
  async (
    params: PaginatedListTechnologiesQueryParams,
  ): Promise<PaginatedListTechnologiesResult> => {
    return await technologiesRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing technology.
 * @param params - Object containing the technology ID and update data
 * @param params.id - The ID of the technology to update
 * @returns {Promise<Technology>} The updated technology
 * @throws {APIError} If the technology is not found or update fails
 */
export const updateTechnology = api(
  {
    expose: true,
    method: 'PUT',
    path: '/technologies/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateTechnologyPayload & { id: number }): Promise<Technology> => {
    await technologyDomain.validateTechnology(data, id);
    return await technologiesRepository.update(id, data);
  },
);

/**
 * Deletes a technology by its ID.
 * @param params - Object containing the technology ID
 * @param params.id - The ID of the technology to delete
 * @returns {Promise<Technology>} The deleted technology
 * @throws {APIError} If the technology is not found or deletion fails
 */
export const deleteTechnology = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/technologies/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Technology> => {
    return await technologiesRepository.delete(id);
  },
);
