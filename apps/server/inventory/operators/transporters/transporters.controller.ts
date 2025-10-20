import { api } from 'encore.dev/api';
import type {
  CreateTransporterPayload,
  ListTransportersQueryParams,
  ListTransportersResult,
  PaginatedListTransportersQueryParams,
  PaginatedListTransportersResult,
  Transporter,
  TransporterWithCity,
  UpdateTransporterPayload,
} from './transporters.types';
import { transporterRepository } from './transporters.repository';
import { validateTransporter } from './transporters.domain';

/**
 * Creates a new transporter.
 * @param params - The transporter data to create
 * @returns {Promise<Transporter>} The created transporter
 * @throws {APIError} If the transporter creation fails
 */
export const createTransporter = api(
  {
    expose: true,
    method: 'POST',
    path: '/transporters/create',
    auth: true,
  },
  async (params: CreateTransporterPayload): Promise<Transporter> => {
    await validateTransporter(params);
    return await transporterRepository.create(params);
  },
);

/**
 * Retrieves a transporter by its ID.
 * @param params - Object containing the transporter ID
 * @param params.id - The ID of the transporter to retrieve
 * @returns {Promise<TransporterWithCity>} The found transporter with city info
 * @throws {APIError} If the transporter is not found or retrieval fails
 */
export const getTransporter = api(
  {
    expose: true,
    method: 'GET',
    path: '/transporters/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<TransporterWithCity> => {
    return await transporterRepository.findOneWithCity(id);
  },
);

/**
 * Retrieves all transporters without pagination (useful for dropdowns).
 * @returns {Promise<Transporters>} An object containing an array of transporters with city info
 * @throws {APIError} If retrieval fails
 */
export const listTransporters = api(
  {
    expose: true,
    method: 'POST',
    path: '/transporters/list/all',
    auth: true,
  },
  async (
    params: ListTransportersQueryParams,
  ): Promise<ListTransportersResult> => {
    const transporters = await transporterRepository.findAllWithCity(params);
    return { data: transporters };
  },
);

/**
 * Retrieves transporters with pagination and includes headquarter city information.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedListTransportersResult>} Paginated list of transporters with city info
 * @throws {APIError} If retrieval fails
 */
export const listTransportersPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/transporters/list',
    auth: true,
  },
  async (
    params: PaginatedListTransportersQueryParams,
  ): Promise<PaginatedListTransportersResult> => {
    const transportersResult =
      await transporterRepository.findAllPaginated(params);

    return await transporterRepository.appendRelations(
      transportersResult.data,
      transportersResult.pagination,
      params,
    );
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
  {
    expose: true,
    method: 'PUT',
    path: '/transporters/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateTransporterPayload & { id: number }): Promise<Transporter> => {
    await validateTransporter(data, id);
    return await transporterRepository.update(id, data);
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
  {
    expose: true,
    method: 'DELETE',
    path: '/transporters/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Transporter> => {
    return await transporterRepository.delete(id);
  },
);
