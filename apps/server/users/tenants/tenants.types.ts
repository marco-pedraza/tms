import { MinLen, MatchesRegexp } from 'encore.dev/validate';

/**
 * Represents a tenant entity
 */
export interface Tenant {
  id: string;
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
 * Response for listing all tenants
 */
export interface Tenants {
  tenants: Tenant[];
} 