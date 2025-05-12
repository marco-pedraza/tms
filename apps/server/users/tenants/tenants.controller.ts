import { api } from 'encore.dev/api';
import type {
  CreateTenantPayload,
  PaginatedTenants,
  PaginationParamsTenants,
  Tenant,
  Tenants,
  TenantsQueryOptions,
  UpdateTenantPayload,
} from './tenants.types';
import { tenantRepository } from './tenants.repository';

/**
 * Creates a new tenant.
 * @param params - The tenant data to create
 * @returns {Promise<Tenant>} The created tenant
 * @throws {APIError} If the tenant creation fails
 */
export const createTenant = api(
  { method: 'POST', path: '/tenants', expose: true, auth: true },
  async (params: CreateTenantPayload): Promise<Tenant> => {
    return await tenantRepository.create(params);
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
  { method: 'GET', path: '/tenants/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Tenant> => {
    return await tenantRepository.findOne(id);
  },
);

/**
 * Retrieves all tenants with optional filtering and ordering.
 * @param params - Query options for filtering and ordering
 * @returns {Promise<Tenants>} List of tenants
 * @throws {APIError} If the retrieval fails
 */
export const listTenants = api(
  { method: 'POST', path: '/get-tenants', expose: true, auth: true },
  async (params: TenantsQueryOptions): Promise<Tenants> => {
    const tenants = await tenantRepository.findAll(params);
    return { tenants };
  },
);

/**
 * Retrieves tenants with pagination, filtering, and ordering.
 * @param params - Pagination, filtering, and ordering parameters
 * @returns {Promise<PaginatedTenants>} Paginated list of tenants
 * @throws {APIError} If retrieval fails
 */
export const listTenantsWithPagination = api(
  { method: 'POST', path: '/get-tenants/paginated', expose: true, auth: true },
  async (params: PaginationParamsTenants): Promise<PaginatedTenants> => {
    return await tenantRepository.findAllPaginated(params);
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
  { method: 'PUT', path: '/tenants/:id', expose: true, auth: true },
  async ({
    id,
    ...data
  }: UpdateTenantPayload & { id: number }): Promise<Tenant> => {
    return await tenantRepository.update(id, data);
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
  { method: 'DELETE', path: '/tenants/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Tenant> => {
    return await tenantRepository.delete(id);
  },
);

/**
 * Searches for tenants by matching a search term against name, code, and description.
 * @param params - Search parameters
 * @param params.term - The search term to match against tenant fields
 * @returns {Promise<Tenants>} List of matching tenants
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchTenants = api(
  { method: 'GET', path: '/tenants/search', expose: true, auth: true },
  async ({ term }: { term: string }): Promise<Tenants> => {
    const tenants = await tenantRepository.search(term);
    return { tenants };
  },
);

/**
 * Searches for tenants with pagination by matching a search term.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against tenant fields
 * @returns {Promise<PaginatedTenants>} Paginated list of matching tenants
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchTenantsPaginated = api(
  {
    method: 'POST',
    path: '/tenants/search/paginated',
    expose: true,
    auth: true,
  },
  async ({
    term,
    ...params
  }: PaginationParamsTenants & { term: string }): Promise<PaginatedTenants> => {
    return await tenantRepository.searchPaginated(term, params);
  },
);

/**
 * Maintains backward compatibility for listing tenants.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedTenants>} Paginated list of tenants
 * @throws {APIError} If retrieval fails
 */
export const getTenantsLegacy = api(
  { method: 'GET', path: '/tenants', expose: true, auth: true },
  async (params: PaginationParamsTenants): Promise<PaginatedTenants> => {
    return await tenantRepository.findAllPaginated(params);
  },
);
