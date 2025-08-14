import { api } from 'encore.dev/api';
import type {
  CreateServiceTypePayload,
  ListServiceTypesQueryParams,
  ListServiceTypesResult,
  PaginatedListServiceTypesQueryParams,
  PaginatedListServiceTypesResult,
  ServiceType,
  UpdateServiceTypePayload,
} from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';
import { validateServiceType } from './service-types.domain';

/**
 * Creates a new service type.
 * @param payload - Service type data to create
 * @returns The newly created service type
 */
export const createServiceType = api(
  { expose: true, method: 'POST', path: '/service-types/create' },
  async (payload: CreateServiceTypePayload): Promise<ServiceType> => {
    await validateServiceType(payload);
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
  { expose: true, method: 'POST', path: '/service-types/list/all' },
  async (
    params: ListServiceTypesQueryParams,
  ): Promise<ListServiceTypesResult> => {
    const serviceTypes = await serviceTypeRepository.findAll(params);
    return { data: serviceTypes };
  },
);

/**
 * Retrieves service types with pagination (useful for tables).
 * @param params - Pagination and query parameters
 * @returns Paginated list of service types
 */
export const listServiceTypesPaginated = api(
  { expose: true, method: 'POST', path: '/service-types/list' },
  async (
    params: PaginatedListServiceTypesQueryParams,
  ): Promise<PaginatedListServiceTypesResult> => {
    return await serviceTypeRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing service type.
 * @param params - Object containing ID and update data
 * @returns The updated service type
 */
export const updateServiceType = api(
  { expose: true, method: 'PUT', path: '/service-types/:id/update' },
  async ({
    id,
    ...data
  }: { id: number } & UpdateServiceTypePayload): Promise<ServiceType> => {
    await validateServiceType(data, id);
    return await serviceTypeRepository.update(id, data);
  },
);

/**
 * Deletes a service type by its ID.
 * @param params - Object containing the service type ID to delete
 * @returns The deleted service type
 */
export const deleteServiceType = api(
  { expose: true, method: 'DELETE', path: '/service-types/:id/delete' },
  async ({ id }: { id: number }): Promise<ServiceType> => {
    return await serviceTypeRepository.delete(id);
  },
);
