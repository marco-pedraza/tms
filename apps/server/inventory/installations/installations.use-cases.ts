import { and, eq, inArray, isNull } from 'drizzle-orm';
import { PaginationMeta } from '../../shared/types';
import { db } from '../db-service';
import { nodeRepository } from '../nodes/nodes.repository';
import { nodes } from '../nodes/nodes.schema';
import type {
  CreateNodeInstallationPayload,
  Installation,
  InstallationWithLocation,
  PaginatedListInstallationsResult,
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

  /**
   * Finds a single installation with location information from associated nodes
   * This use case coordinates between installations and nodes repositories
   * @param id - The ID of the installation to find
   * @returns The installation with location information
   * @throws {NotFoundError} If the installation is not found
   */
  async function findOneWithLocation(
    id: number,
  ): Promise<InstallationWithLocation> {
    // First get the installation using the base repository
    const installation = await installationRepository.findOne(id);

    // Get location information for this installation by querying nodes
    const nodeWithLocation = await db.query.nodes.findFirst({
      where: and(eq(nodes.installationId, id), isNull(nodes.deletedAt)),
      columns: {
        latitude: true,
        longitude: true,
        radius: true,
      },
    });

    // Build the result with location information
    const result: InstallationWithLocation = {
      ...installation,
      location: nodeWithLocation
        ? {
            latitude: nodeWithLocation.latitude,
            longitude: nodeWithLocation.longitude,
            radius: nodeWithLocation.radius,
          }
        : null,
    };

    return result;
  }

  /**
   * Appends location information from associated nodes to installations
   * This use case coordinates between installations and nodes repositories
   * @param installationsResult - Array of installations to append location information to
   * @param pagination - Pagination metadata
   * @returns Installations with location information and pagination metadata
   */
  async function appendLocationInfo(
    installationsResult: Installation[],
    pagination: PaginationMeta,
  ): Promise<PaginatedListInstallationsResult> {
    // Return early if no installations to process
    if (installationsResult.length === 0) {
      return {
        data: [],
        pagination,
      };
    }

    const ids = installationsResult.map((installation) => installation.id);

    // Get location information for all installations by querying nodes
    const nodesWithLocation = await db.query.nodes.findMany({
      where: and(inArray(nodes.installationId, ids), isNull(nodes.deletedAt)),
      columns: {
        installationId: true,
        latitude: true,
        longitude: true,
        radius: true,
      },
    });

    // Create a map for quick lookup of location data by installation ID
    const locationMap = new Map(
      nodesWithLocation.map((node) => [
        node.installationId,
        {
          latitude: node.latitude,
          longitude: node.longitude,
          radius: node.radius,
        },
      ]),
    );

    // Enrich installations with location information
    const installationsWithLocation: InstallationWithLocation[] =
      installationsResult.map((installation) => ({
        ...installation,
        location: locationMap.get(installation.id) || null,
      }));

    return {
      data: installationsWithLocation,
      pagination,
    };
  }

  return {
    createNodeInstallation,
    findOneWithLocation,
    appendLocationInfo,
  };
}

// Export the use case instance
export const installationUseCases = createInstallationUseCases();
