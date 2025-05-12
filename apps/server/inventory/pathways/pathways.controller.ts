import { api } from 'encore.dev/api';
import { PaginationParams } from '../../shared/types';
import {
  CreatePathwayServiceAssignmentPayload,
  DeletePathwayServiceAssignmentPayload,
} from '../pathway-service-assignments/pathway-service-assignments.types';
import {
  CreatePathwayPayload,
  PaginatedPathways,
  Pathway,
  PathwayWithServiceAssignments,
  Pathways,
  UpdatePathwayPayload,
} from './pathways.types';
import { pathwayRepository } from './pathways.repository';
import { pathwayUseCases } from './pathways.use-cases';

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
 * Retrieves a pathway by its ID.
 * @param params - Object containing the pathway ID
 * @param params.id - The ID of the pathway to retrieve
 * @returns {Promise<Pathway>} The found pathway
 * @throws {APIError} If the pathway is not found or retrieval fails
 */
export const getPathway = api(
  { method: 'GET', path: '/pathways/:id', expose: true },
  async ({ id }: { id: number }): Promise<Pathway> => {
    return await pathwayRepository.findOne(id);
  },
);

/**
 * Retrieves all pathways without pagination (useful for dropdowns).
 * @returns {Promise<Pathways>} An object containing an array of pathways
 * @throws {APIError} If retrieval fails
 */
export const listPathways = api(
  { method: 'GET', path: '/pathways', expose: true },
  async (): Promise<Pathways> => {
    const result = await pathwayRepository.findAll();
    return { pathways: result };
  },
);

/**
 * Retrieves pathways with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedPathways>} Paginated list of pathways
 * @throws {APIError} If retrieval fails
 */
export const listPathwaysPaginated = api(
  { method: 'GET', path: '/pathways/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedPathways> => {
    return await pathwayRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing pathway.
 * @param params - Object containing the pathway ID and update data
 * @param params.id - The ID of the pathway to update
 * @param params - Object containing the pathway ID and the fields to update
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

/**
 * Retrieves a pathway by its ID including all its services with assignment details.
 * @param params - Object containing the pathway ID
 * @param params.id - The ID of the pathway to retrieve
 * @returns {Promise<PathwayWithServiceAssignments>} The found pathway with its services
 * @throws {APIError} If the pathway is not found or retrieval fails
 */
export const getPathwayWithServiceAssignments = api(
  { method: 'GET', path: '/pathways/:id/services', expose: true },
  async ({ id }: { id: number }): Promise<PathwayWithServiceAssignments> => {
    return await pathwayRepository.findOneWithServiceAssignments(id);
  },
);

/**
 * Assigns a service to a pathway with automatically calculated sequence.
 * @param params - Assignment data including pathway ID and service ID
 * @returns {Promise<PathwayWithServiceAssignments>} The updated pathway with all its service assignments
 * @throws {APIError} If the assignment fails due to validation or other errors
 */
export const assignServicesToPathway = api(
  {
    method: 'POST',
    path: '/pathways/:pathwayId/service-assignments',
    expose: true,
  },
  async (
    params: CreatePathwayServiceAssignmentPayload,
  ): Promise<PathwayWithServiceAssignments> => {
    return await pathwayUseCases.assignServicesToPathway(params);
  },
);

/**
 * Unassigns a service from a pathway
 * @param params - Object containing the pathway ID and assignment ID
 * @returns {Promise<PathwayWithServiceAssignments>} The updated pathway with all its service assignments
 * @throws {APIError} If the pathway is not found, assignment is not found, or unassignment fails
 */
export const unassignServiceFromPathway = api(
  {
    method: 'DELETE',
    path: '/pathways/:pathwayId/service-assignments/:assignmentId',
    expose: true,
  },
  async (
    params: DeletePathwayServiceAssignmentPayload,
  ): Promise<PathwayWithServiceAssignments> => {
    return await pathwayUseCases.unassignServiceFromPathway(params);
  },
);
