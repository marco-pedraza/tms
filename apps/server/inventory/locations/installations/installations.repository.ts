import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { installations } from './installations.schema';
import type {
  CreateInstallationPayload,
  Installation,
  UpdateInstallationPayload,
} from './installations.types';

/**
 * Creates a repository for managing installation entities
 * @returns {Object} An object containing installation-specific operations and base CRUD operations
 */
export const createInstallationRepository = () => {
  const baseRepository = createBaseRepository<
    Installation,
    CreateInstallationPayload,
    UpdateInstallationPayload,
    typeof installations
  >(db, installations, 'Installation', {
    searchableFields: [installations.name, installations.address],
    softDeleteEnabled: true,
  });

  return baseRepository;
};

// Export the installation repository instance
export const installationRepository = createInstallationRepository();
