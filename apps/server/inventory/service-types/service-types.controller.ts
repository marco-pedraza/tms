import { api } from 'encore.dev/api';
import type {
  CreateServiceTypePayload,
  PaginatedServiceTypes,
  PaginationParamsServiceTypes,
  ServiceType,
  ServiceTypes,
  ServiceTypesQueryOptions,
  UpdateServiceTypePayload,
} from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';

/**
 * Creates a new service type.
 * @param payload - Service type data to create
 * @returns The newly created service type
 */
export const createServiceType = api(
  {
    expose: true,
    method: 'POST',
    path: '/service-types',
  },
  async (payload: CreateServiceTypePayload): Promise<ServiceType> => {
    return await serviceTypeRepository.create(payload);
  },
);

/**
 * Retrieves a service type by its ID.
 * @param params - Object containing the service type ID
 * @returns The requested service type
 */
export const getServiceType = api(
  {
    expose: true,
    method: 'GET',
    path: '/service-types/:id',
  },
  async ({ id }: { id: number }): Promise<ServiceType> => {
    return await serviceTypeRepository.findOne(id);
  },
);

/**
 * Retrieves all service types without pagination (useful for dropdowns).
 * @param params - Query options for filtering and sorting
 * @returns List of service types
 */
export const listServiceTypes = api(
  {
    expose: true,
    method: 'POST',
    path: '/get-service-types',
  },
  async (params: ServiceTypesQueryOptions): Promise<ServiceTypes> => {
    const serviceTypes = await serviceTypeRepository.findAll(params);
    return { serviceTypes };
  },
);

/**
 * Retrieves service types with pagination (useful for tables).
 * @param params - Pagination and query parameters
 * @returns Paginated list of service types
 */
export const listServiceTypesPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/get-service-types/paginated',
  },
  async (
    params: PaginationParamsServiceTypes,
  ): Promise<PaginatedServiceTypes> => {
    if (params.searchTerm) {
      return await serviceTypeRepository.searchPaginated(
        params.searchTerm,
        params,
      );
    }
    return await serviceTypeRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing service type.
 * @param params - Object containing ID and update data
 * @returns The updated service type
 */
export const updateServiceType = api(
  {
    expose: true,
    method: 'PUT',
    path: '/service-types/:id',
  },
  async ({
    id,
    ...payload
  }: { id: number } & UpdateServiceTypePayload): Promise<ServiceType> => {
    return await serviceTypeRepository.update(id, payload);
  },
);

/**
 * Deletes a service type by its ID.
 * @param params - Object containing the service type ID to delete
 * @returns The deleted service type
 */
export const deleteServiceType = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/service-types/:id',
  },
  async ({ id }: { id: number }): Promise<ServiceType> => {
    return await serviceTypeRepository.delete(id);
  },
);

/**
 * Searches for service types by matching a search term against name.
 * @param params - Search parameters
 * @returns List of matching service types
 */
export const searchServiceTypes = api(
  {
    expose: true,
    method: 'GET',
    path: '/service-types/search',
  },
  async ({ term }: { term: string }): Promise<ServiceTypes> => {
    const serviceTypes = await serviceTypeRepository.search(term);
    return { serviceTypes };
  },
);
