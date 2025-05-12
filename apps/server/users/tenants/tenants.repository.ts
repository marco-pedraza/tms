import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { tenants } from './tenants.schema';
import type {
  CreateTenantPayload,
  Tenant,
  UpdateTenantPayload,
} from './tenants.types';

/**
 * Creates a repository for managing tenant entities
 * @returns {Object} An object containing tenant-specific operations and base CRUD operations
 */
export function createTenantRepository() {
  const baseRepository = createBaseRepository<
    Tenant,
    CreateTenantPayload,
    UpdateTenantPayload,
    typeof tenants
  >(db, tenants, 'Tenant', {
    searchableFields: [tenants.name, tenants.code],
  });

  return {
    ...baseRepository,
  };
}

// Export the tenant repository instance
export const tenantRepository = createTenantRepository();
