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
    return await handleServiceTypeError('createServiceType', async () => {
      return await serviceTypeRepository.create(payload);
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
    return await handleServiceTypeError('getServiceType', async () => {
      return await serviceTypeRepository.findOne(id);
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
    return await handleServiceTypeError('listServiceTypes', async () => {
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
    return await handleServiceTypeError(
      'listServiceTypesPaginated',
      async () => {
        return await serviceTypeRepository.findAllPaginated(params);
      },
    );
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
    return await handleServiceTypeError('updateServiceType', async () => {
      return await serviceTypeRepository.update(id, payload);
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
    return await handleServiceTypeError('deleteServiceType', async () => {
      return await serviceTypeRepository.delete(id);
    });
  },
);
