import { api } from 'encore.dev/api';
import { tenantHandler } from './tenants.handler';
import type {
  CreateTenantPayload,
  UpdateTenantPayload,
  Tenant,
  Tenants,
  PaginatedTenants,
} from './tenants.types';
import { parseApiError } from '../../shared/errors';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new tenant.
 * @param params - The tenant data to create
 * @returns {Promise<Tenant>} The created tenant
 * @throws {APIError} If the tenant creation fails
 */
export const createTenant = api(
  { method: 'POST', path: '/tenants', expose: true },
  async (params: CreateTenantPayload): Promise<Tenant> => {
    try {
      return await tenantHandler.create(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    try {
      return await tenantHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all tenants.
 * @returns {Promise<Tenants>} List of all tenants
 * @throws {APIError} If the retrieval fails
 */
export const listTenants = api(
  { method: 'GET', path: '/tenants', expose: true },
  async (): Promise<Tenants> => {
    try {
      return await tenantHandler.findAll();
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves tenants with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedTenants>} Paginated list of tenants
 * @throws {APIError} If retrieval fails
 */
export const listTenantsWithPagination = api(
  { method: 'GET', path: '/tenants/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedTenants> => {
    try {
      return await tenantHandler.findAllPaginated(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    try {
      return await tenantHandler.update(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    try {
      return await tenantHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
