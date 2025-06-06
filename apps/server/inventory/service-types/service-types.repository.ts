import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { serviceTypes } from './service-types.schema';
import type {
  CreateServiceTypePayload,
  ServiceType,
  UpdateServiceTypePayload,
} from './service-types.types';

/**
 * Creates a repository for managing service type entities
 * @returns {Object} An object containing service type-specific operations and base CRUD operations
 */
export function createServiceTypeRepository() {
  const baseRepository = createBaseRepository<
    ServiceType,
    CreateServiceTypePayload,
    UpdateServiceTypePayload,
    typeof serviceTypes
  >(db, serviceTypes, 'Service Type', {
    searchableFields: [serviceTypes.name],
  });

  return baseRepository;
}

export const serviceTypeRepository = createServiceTypeRepository();
