import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Represents a tenant entity
 */
export interface Tenant {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payload for creating a new tenant
 */
export interface CreateTenantPayload {
  /**
   * Name of the tenant
   * @minLength 2
   */
  name: string;

  /**
   * Unique code for the tenant (alphanumeric with no spaces)
   * @minLength 2
   * @pattern ^[a-zA-Z0-9-]+$
   */
  code: string;

  /**
   * Optional description of the tenant
   */
  description?: string;
}

/**
 * Payload for updating a tenant
 */
export interface UpdateTenantPayload {
  /**
   * Updated name of the tenant
   * @minLength 2
   */
  name?: string;

  /**
   * Updated code for the tenant (alphanumeric with no spaces)
   * @minLength 2
   * @pattern ^[a-zA-Z0-9-]+$
   */
  code?: string;

  /**
   * Updated description of the tenant
   */
  description?: string;

  /**
   * Updated active status of the tenant
   */
  isActive?: boolean;
}

/**
 * Query options for filtering and ordering tenants
 */
export interface TenantsQueryOptions {
  orderBy?: { field: keyof Tenant; direction: 'asc' | 'desc' }[];
  filters?: Partial<Tenant>;
}

/**
 * Combined pagination and query options for tenants
 */
export interface PaginationParamsTenants
  extends PaginationParams,
    TenantsQueryOptions {}

/**
 * Response for listing all tenants
 */
export interface Tenants {
  tenants: Tenant[];
}

/**
 * Paginated response type for the list tenants endpoint
 */
export type PaginatedTenants = PaginatedResult<Tenant>;
