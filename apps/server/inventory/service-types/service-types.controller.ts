import { api } from 'encore.dev/api';
import { PaginationParams } from '../../shared/types';
import type {
  CreateServiceTypePayload,
  PaginatedServiceTypes,
  ServiceType,
  ServiceTypes,
  UpdateServiceTypePayload,
} from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';

/**
 * Creates a new service type
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
 * Gets a service type by ID
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
 * List service types
 * @returns List of service types
 */
export const listServiceTypes = api(
  {
    expose: true,
    method: 'GET',
    path: '/service-types',
  },
  async (): Promise<ServiceTypes> => {
    const serviceTypes = await serviceTypeRepository.findAllActive();
    return { serviceTypes };
  },
);

/**
 * List service types with pagination
 * @param params - Pagination parameters
 * @returns Paginated list of service types
 */
export const listServiceTypesPaginated = api(
  {
    expose: true,
    method: 'GET',
    path: '/service-types/paginated',
  },
  async (params: PaginationParams): Promise<PaginatedServiceTypes> => {
    return await serviceTypeRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing service type
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
 * Deletes a service type
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
