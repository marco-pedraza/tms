import { api } from 'encore.dev/api';
import { tenantRepository } from './tenants.repository';
import type {
  CreateTenantPayload,
  UpdateTenantPayload,
  Tenant,
  PaginatedTenants,
} from './tenants.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('TenantsController');

/**
 * Creates a new tenant.
 * @param params - The tenant data to create
 * @returns {Promise<Tenant>} The created tenant
 * @throws {APIError} If the tenant creation fails
 */
export const createTenant = api(
  { method: 'POST', path: '/tenants', expose: true },
  async (params: CreateTenantPayload): Promise<Tenant> => {
    return withErrorHandling('createTenant', () =>
      tenantRepository.create(params),
    );
  },
);

/**
 * Retrieves a tenant by ID.
 * @param params - Object containing the tenant ID
 * @param params.id - The ID of the tenant to retrieve
 * @returns {Promise<Tenant>} The found tenant
 * @throws {APIError} If the tenant is not found or retrieval fails
 */
export const getTenant = api(
  { method: 'GET', path: '/tenants/:id', expose: true },
  async ({ id }: { id: number }): Promise<Tenant> => {
    return withErrorHandling('getTenant', () => tenantRepository.findOne(id));
  },
);

/**
 * Retrieves tenants with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedTenants>} Paginated list of tenants
 * @throws {APIError} If retrieval fails
 */
export const listTenants = api(
  { method: 'GET', path: '/tenants', expose: true },
  async (params: PaginationParams): Promise<PaginatedTenants> => {
    return withErrorHandling('listTenants', () =>
      tenantRepository.findAllPaginated(params),
    );
  },
);

/**
 * Updates an existing tenant.
 * @param params - Object containing the tenant ID and update data
 * @param params.id - The ID of the tenant to update
 * @returns {Promise<Tenant>} The updated tenant
 * @throws {APIError} If the tenant is not found or update fails
 */
export const updateTenant = api(
  { method: 'PUT', path: '/tenants/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateTenantPayload & { id: number }): Promise<Tenant> => {
    return withErrorHandling('updateTenant', () =>
      tenantRepository.update(id, data),
    );
  },
);

/**
 * Deletes a tenant by ID.
 * @param params - Object containing the tenant ID
 * @param params.id - The ID of the tenant to delete
 * @returns {Promise<Tenant>} The deleted tenant
 * @throws {APIError} If the tenant is not found or deletion fails
 */
export const deleteTenant = api(
  { method: 'DELETE', path: '/tenants/:id', expose: true },
  async ({ id }: { id: number }): Promise<Tenant> => {
    return withErrorHandling('deleteTenant', () => tenantRepository.delete(id));
  },
);
