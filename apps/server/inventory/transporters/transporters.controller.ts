import { api } from 'encore.dev/api';
import type {
  CreateTransporterPayload,
  PaginatedTransportersWithCity,
  PaginationParamsTransporters,
  Transporter,
  TransporterWithCity,
  Transporters,
  TransportersQueryOptions,
  UpdateTransporterPayload,
} from './transporters.types';
import { transporterRepository } from './transporters.repository';

/**
 * Creates a new transporter.
 * @param params - The transporter data to create
 * @returns {Promise<Transporter>} The created transporter
 * @throws {APIError} If the transporter creation fails
 */
export const createTransporter = api(
  { expose: true, method: 'POST', path: '/transporters' },
  async (params: CreateTransporterPayload): Promise<Transporter> => {
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
  { expose: true, method: 'GET', path: '/transporters/:id' },
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
  { expose: true, method: 'POST', path: '/get-transporters' },
  async (params: TransportersQueryOptions): Promise<Transporters> => {
    const transporters = await transporterRepository.findAllWithCity(params);
    return {
      transporters,
    };
  },
);

/**
 * Retrieves transporters with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedTransportersWithCity>} Paginated list of transporters with city info
 * @throws {APIError} If retrieval fails
 */
export const listTransportersPaginated = api(
  { expose: true, method: 'POST', path: '/get-transporters/paginated' },
  async (
    params: PaginationParamsTransporters,
  ): Promise<PaginatedTransportersWithCity> => {
    return await transporterRepository.findAllPaginated(params);
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
  { expose: true, method: 'PUT', path: '/transporters/:id' },
  async ({
    id,
    ...data
  }: UpdateTransporterPayload & { id: number }): Promise<Transporter> => {
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
  { expose: true, method: 'DELETE', path: '/transporters/:id' },
  async ({ id }: { id: number }): Promise<Transporter> => {
    return await transporterRepository.delete(id);
  },
);

/**
 * Searches for transporters by matching a search term against name and code.
 * @param params - Search parameters
 * @param params.term - The search term to match against transporter name and code
 * @returns {Promise<Transporters>} List of matching transporters with city info
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchTransporters = api(
  { expose: true, method: 'GET', path: '/transporters/search' },
  async ({ term }: { term: string }): Promise<Transporters> => {
    const transporters = await transporterRepository.search(term);
    return {
      transporters,
    };
  },
);

/**
 * Searches for transporters with pagination by matching a search term against name and code.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against transporter name and code
 * @param params.page - Page number for pagination (optional, default: 1)
 * @param params.pageSize - Number of items per page (optional, default: 10)
 * @param params.orderBy - Sorting criteria (optional)
 * @param params.filters - Additional filters to apply (optional)
 * @returns {Promise<PaginatedTransportersWithCity>} Paginated list of matching transporters with city info
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchTransportersPaginated = api(
  { expose: true, method: 'POST', path: '/transporters/search/paginated' },
  async ({
    term,
    ...params
  }: PaginationParamsTransporters & {
    term: string;
  }): Promise<PaginatedTransportersWithCity> => {
    return await transporterRepository.searchPaginated(term, params);
  },
);
