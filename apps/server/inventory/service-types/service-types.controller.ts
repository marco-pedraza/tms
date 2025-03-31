import { api } from 'encore.dev/api';
import { serviceTypeRepository } from './service-types.repository';
import type {
  ServiceType,
  ServiceTypes,
  PaginatedServiceTypes,
  CreateServiceTypePayload,
  UpdateServiceTypePayload,
} from './service-types.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const handleServiceTypeError = createControllerErrorHandler(
  'ServiceTypeController',
);

/**
 * Creates a new service type
 * @param payload - Service type data to create
 * @returns The newly created service type
 */
export const createServiceType = api(
  {
    method: 'POST',
    path: '/service-types',
  },
  async (payload: CreateServiceTypePayload): Promise<ServiceType> => {
    return handleServiceTypeError('createServiceType', async () => {
      return serviceTypeRepository.create(payload);
    });
  },
);

/**
 * Gets a service type by ID
 * @param params - Object containing the service type ID
 * @returns The requested service type
 */
export const getServiceType = api(
  {
    method: 'GET',
    path: '/service-types/:id',
  },
  async ({ id }: { id: number }): Promise<ServiceType> => {
    return handleServiceTypeError('getServiceType', async () => {
      return serviceTypeRepository.findOne(id);
    });
  },
);

/**
 * List service types
 * @returns List of service types
 */
export const listServiceTypes = api(
  {
    method: 'GET',
    path: '/service-types',
  },
  async (): Promise<ServiceTypes> => {
    return handleServiceTypeError('listServiceTypes', async () => {
      const serviceTypes = await serviceTypeRepository.findAllActive();
      return { serviceTypes };
    });
  },
);

/**
 * List service types with pagination
 * @param params - Pagination parameters
 * @returns Paginated list of service types
 */
export const listServiceTypesPaginated = api(
  {
    method: 'GET',
    path: '/service-types/paginated',
  },
  async (params: PaginationParams): Promise<PaginatedServiceTypes> => {
    return handleServiceTypeError('listServiceTypesPaginated', async () => {
      return serviceTypeRepository.findAllPaginated(params);
    });
  },
);

/**
 * Updates an existing service type
 * @param params - Object containing ID and update data
 * @returns The updated service type
 */
export const updateServiceType = api(
  {
    method: 'PUT',
    path: '/service-types/:id',
  },
  async ({
    id,
    ...payload
  }: { id: number } & UpdateServiceTypePayload): Promise<ServiceType> => {
    return handleServiceTypeError('updateServiceType', async () => {
      return serviceTypeRepository.update(id, payload);
    });
  },
);

/**
 * Deletes a service type
 * @param params - Object containing the service type ID to delete
 * @returns The deleted service type
 */
export const deleteServiceType = api(
  {
    method: 'DELETE',
    path: '/service-types/:id',
  },
  async ({ id }: { id: number }): Promise<ServiceType> => {
    return handleServiceTypeError('deleteServiceType', async () => {
      return serviceTypeRepository.delete(id);
    });
  },
);
