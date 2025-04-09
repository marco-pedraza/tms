import { api } from 'encore.dev/api';
import { transporterRepository } from './transporters.repository';
import type {
  CreateTransporterPayload,
  UpdateTransporterPayload,
  Transporter,
  PaginatedTransporters,
} from './transporters.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('TransporterController');

/**
 * Creates a new transporter.
 * @param params - The transporter data to create
 * @returns {Promise<Transporter>} The created transporter
 * @throws {APIError} If the transporter creation fails
 */
export const createTransporter = api(
  { method: 'POST', path: '/transporters' },
  async (params: CreateTransporterPayload): Promise<Transporter> => {
    return await withErrorHandling('createTransporter', async () => {
      return await transporterRepository.create(params);
    });
  },
);

/**
 * Retrieves a transporter by its ID.
 * @param params - Object containing the transporter ID
 * @param params.id - The ID of the transporter to retrieve
 * @returns {Promise<Transporter>} The found transporter
 * @throws {APIError} If the transporter is not found or retrieval fails
 */
export const getTransporter = api(
  { method: 'GET', path: '/transporters/:id', expose: true },
  async ({ id }: { id: number }): Promise<Transporter> => {
    return await withErrorHandling('getTransporter', async () => {
      return await transporterRepository.findOne(id);
    });
  },
);

/**
 * Retrieves transporters with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedTransporters>} Paginated list of transporters
 * @throws {APIError} If retrieval fails
 */
export const listTransporters = api(
  { method: 'GET', path: '/transporters', expose: true },
  async (params: PaginationParams): Promise<PaginatedTransporters> => {
    return await withErrorHandling('listTransporters', async () => {
      return await transporterRepository.findAllPaginated(params);
    });
  },
);

/**
 * Updates an existing transporter.
 * @param params - Object containing the transporter ID and update data
 * @param params.id - The ID of the transporter to update
 * @returns {Promise<Transporter>} The updated transporter
 * @throws {APIError} If the transporter is not found or update fails
 */
export const updateTransporter = api(
  { method: 'PUT', path: '/transporters/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateTransporterPayload & { id: number }): Promise<Transporter> => {
    return await withErrorHandling('updateTransporter', async () => {
      return await transporterRepository.update(id, data);
    });
  },
);

/**
 * Deletes a transporter by its ID.
 * @param params - Object containing the transporter ID
 * @param params.id - The ID of the transporter to delete
 * @returns {Promise<Transporter>} The deleted transporter
 * @throws {APIError} If the transporter is not found or deletion fails
 */
export const deleteTransporter = api(
  { method: 'DELETE', path: '/transporters/:id', expose: true },
  async ({ id }: { id: number }): Promise<Transporter> => {
    return await withErrorHandling('deleteTransporter', async () => {
      return await transporterRepository.delete(id);
    });
  },
);
