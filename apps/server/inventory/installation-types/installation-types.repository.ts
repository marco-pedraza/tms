import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { installationTypes } from './installation-types.schema';
import type {
  CreateInstallationTypePayload,
  InstallationType,
  UpdateInstallationTypePayload,
} from './installation-types.types';

/**
 * Creates a repository for managing installation type entities
 * @returns {Object} An object containing installation type-specific operations and base CRUD operations
 */
export function createInstallationTypeRepository() {
  const baseRepository = createBaseRepository<
    InstallationType,
    CreateInstallationTypePayload,
    UpdateInstallationTypePayload,
    typeof installationTypes
  >(db, installationTypes, 'InstallationType', {
    searchableFields: [installationTypes.name],
    softDeleteEnabled: true,
  });

  return baseRepository;
}

// Export the installation type repository instance
export const installationTypeRepository = createInstallationTypeRepository();
