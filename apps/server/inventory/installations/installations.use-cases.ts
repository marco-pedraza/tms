import { db } from '../db-service';
import { nodeRepository } from '../nodes/nodes.repository';
import type {
  CreateNodeInstallationPayload,
  Installation,
} from './installations.types';
import { installationRepository } from './installations.repository';

/**
 * Creates use cases for managing installations with complex business logic
 * that coordinates multiple repositories
 * @returns Object with installation-specific use case functions
 */
export function createInstallationUseCases() {
  /**
   * Creates a new installation associated with a node
   * This use case coordinates between installations and nodes repositories
   * @param params The installation creation payload with nodeId
   * @returns The created installation
   */
  async function createNodeInstallation(
    params: CreateNodeInstallationPayload,
  ): Promise<Installation> {
    // Use database transaction to ensure data consistency between repositories
    const installationId = await db.transaction(async (tx) => {
      // Create scoped repositories with the transaction
      const txInstallationRepo = installationRepository.withTransaction(tx);

      // Create the installation using the provided address
      const installation = await txInstallationRepo.create({
        name: params.name,
        address: params.address,
        description: params.description,
      });

      // Assign the installation to the node within the same transaction
      await nodeRepository.assignInstallation(
        params.nodeId,
        installation.id,
        tx,
      );

      // Return installation ID for post-transaction retrieval
      return installation.id;
    });

    // After transaction completes, retrieve complete installation
    return installationRepository.findOne(installationId);
  }

  return {
    createNodeInstallation,
  };
}

// Export the use case instance
export const installationUseCases = createInstallationUseCases();
