import { api } from 'encore.dev/api';
import { PaginationParams } from '../../shared/types';
import {
  CreatePathwayPayload,
  PaginatedPathways,
  Pathway,
  Pathways,
  UpdatePathwayPayload,
} from './pathways.types';
import { pathwayRepository } from './pathways.repository';

/**
 * Creates a new pathway
 * @param params - The pathway data to create
 * @returns {Promise<Pathway>} The created pathway
 * @throws {APIError} If the pathway creation fails
 */
export const createPathway = api(
  { method: 'POST', path: '/pathways', expose: true },
  async (params: CreatePathwayPayload): Promise<Pathway> => {
    return await pathwayRepository.create(params);
  },
);

/**
 * Retrieves all pathways
 * @returns {Promise<Pathways>} All pathways
 * @throws {APIError} If the operation fails
 */
export const listPathways = api(
  { method: 'GET', path: '/pathways', expose: true },
  async (): Promise<Pathways> => {
    const pathways = await pathwayRepository.findAll();
    return { pathways };
  },
);

/**
 * Retrieves all pathways with pagination
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedPathways>} Paginated pathways
 * @throws {APIError} If the operation fails
 */
export const listPathwaysPaginated = api(
  { method: 'GET', path: '/pathways/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedPathways> => {
    return await pathwayRepository.findAllPaginated(params);
  },
);

/**
 * Retrieves a pathway by its ID
 * @param params - Object containing the pathway ID
 * @param params.id - The ID of the pathway to retrieve
 * @returns {Promise<Pathway>} The found pathway
 * @throws {APIError} If the pathway is not found
 */
export const getPathway = api(
  { method: 'GET', path: '/pathways/:id', expose: true },
  async ({ id }: { id: number }): Promise<Pathway> => {
    return await pathwayRepository.findOne(id);
  },
);

/**
 * Updates an existing pathway
 * @param params - Object containing the pathway ID and update data
 * @param params.id - The ID of the pathway to update
 * @returns {Promise<Pathway>} The updated pathway
 * @throws {APIError} If the pathway is not found or update fails
 */
export const updatePathway = api(
  { method: 'PUT', path: '/pathways/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdatePathwayPayload & { id: number }): Promise<Pathway> => {
    return await pathwayRepository.update(id, data);
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
  { method: 'DELETE', path: '/pathways/:id', expose: true },
  async ({ id }: { id: number }): Promise<Pathway> => {
    return await pathwayRepository.delete(id);
  },
);
