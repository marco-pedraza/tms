import { and, eq, inArray, isNull } from 'drizzle-orm';
import { FieldErrorCollector, ValidationError } from '@repo/base-repo';
import { PaginationMeta } from '../../shared/types';
import { amenitiesRepository } from '../amenities/amenities.repository';
import { AmenityCategory, AmenityType } from '../amenities/amenities.types';
import { installationAmenityRepository } from '../amenities/installation-amenities.repository';
import { db } from '../db-service';
import type { PropertyInput } from '../installation-properties/installation-properties.types';
import { installationPropertyUseCases } from '../installation-properties/installation-properties.use-cases';
import { nodeRepository } from '../nodes/nodes.repository';
import { nodes } from '../nodes/nodes.schema';
import type {
  CreateNodeInstallationPayload,
  Installation,
  InstallationPropertyResponse,
  InstallationWithDetails,
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
        contactPhone: params.contactPhone,
        contactEmail: params.contactEmail,
        website: params.website,
        installationTypeId: params.installationTypeId || null,
        operatingHours: params.operatingHours ?? null,
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
   * Updates installation properties by validating and upserting them
   * This use case coordinates between installations and installation properties
   * @param installationId - The ID of the installation to update properties for
   * @param properties - Array of property name/value pairs to validate and upsert
   * @returns The installation with updated properties
   * @throws {NotFoundError} If installation or schemas are not found
   * @throws {FieldValidationError} If property validation fails
   */
  async function updateInstallationProperties(
    installationId: number,
    properties: PropertyInput[],
  ): Promise<InstallationWithDetails> {
    // First get the installation to ensure it exists and get its type
    const installation = await installationRepository.findOne(installationId);

    // Check if installation has a type assigned
    if (!installation.installationTypeId) {
      throw new ValidationError(
        'Installation must have an installation type to manage properties',
      );
    }

    // Validate and transform properties using the installation properties use case
    const validatedProperties =
      await installationPropertyUseCases.validateAndTransformProperties(
        properties,
        installation.installationTypeId,
      );

    // Upsert the validated properties
    await installationPropertyUseCases.upsertInstallationProperties({
      installationId,
      properties: validatedProperties,
    });

    // Return the installation with location information
    return await findOneWithLocation(installationId);
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
  ): Promise<InstallationWithDetails> {
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

    // Get properties for this installation if it has a type
    const properties = installation.installationTypeId
      ? await installationPropertyUseCases.getInstallationPropertiesForResponse(
          installation.installationTypeId,
          installation.id,
        )
      : [];

    // Get amenities for this installation
    const amenitiesData =
      await installationAmenityRepository.getInstallationAmenities(id);

    // Type cast the amenities to match the interface
    const typedAmenities = amenitiesData.map((amenity) => ({
      ...amenity,
      category: amenity.category as AmenityCategory,
      amenityType: amenity.amenityType as AmenityType,
    }));

    // Build the result with location information, properties, and amenities
    const result: InstallationWithDetails = {
      ...installation,
      location: nodeWithLocation
        ? {
            latitude: nodeWithLocation.latitude,
            longitude: nodeWithLocation.longitude,
            radius: nodeWithLocation.radius,
          }
        : null,
      properties,
      amenities: typedAmenities,
    };

    return result;
  }

  /**
   * Assigns amenities to an installation (destructive operation)
   * This replaces all existing amenity assignments for the installation
   * @param installationId - The ID of the installation to assign amenities to
   * @param amenityIds - Array of amenity IDs to assign
   * @returns The updated installation with amenities
   */
  async function assignAmenities(
    installationId: number,
    amenityIds: number[],
  ): Promise<InstallationWithDetails> {
    // Validate installation exists
    await installationRepository.findOne(installationId);

    // Handle empty amenity list case
    if (amenityIds.length === 0) {
      return await clearAllAmenities(installationId);
    }

    // Validate amenity assignments
    await validateAmenityAssignments(amenityIds);

    // Execute amenity assignment transaction
    await executeAmenityAssignment(installationId, amenityIds);

    // Return updated installation
    return findOneWithLocation(installationId);
  }

  /**
   * Clears all amenity assignments for an installation
   */
  async function clearAllAmenities(
    installationId: number,
  ): Promise<InstallationWithDetails> {
    await db.transaction(async (tx) => {
      await installationAmenityRepository.clearInstallationAmenities(
        installationId,
        tx,
      );
    });

    return findOneWithLocation(installationId);
  }

  /**
   * Validates amenity IDs for assignment to installation
   */
  async function validateAmenityAssignments(
    amenityIds: number[],
  ): Promise<void> {
    const validator = new FieldErrorCollector();

    // Check for duplicate amenity IDs
    validateNoDuplicateAmenities(amenityIds, validator);

    // Validate amenities exist and meet criteria
    await validateAmenitiesExistAndMeetCriteria(amenityIds, validator);

    // Throw all validation errors at once
    validator.throwIfErrors();
  }

  /**
   * Validates no duplicate amenity IDs in the array
   */
  function validateNoDuplicateAmenities(
    amenityIds: number[],
    validator: FieldErrorCollector,
  ): void {
    const uniqueAmenityIds = [...new Set(amenityIds)];

    if (uniqueAmenityIds.length !== amenityIds.length) {
      validator.addError(
        'amenityIds',
        'DUPLICATE_VALUES',
        'Duplicate amenity IDs are not allowed',
        amenityIds,
      );
    }
  }

  /**
   * Validates amenities exist, are active, and have correct type
   */
  async function validateAmenitiesExistAndMeetCriteria(
    amenityIds: number[],
    validator: FieldErrorCollector,
  ): Promise<void> {
    const invalidIds = await amenitiesRepository.validateInstallationAmenityIds(
      amenityIds,
      AmenityType.INSTALLATION,
    );

    if (invalidIds.length > 0) {
      validator.addError(
        'amenityIds',
        'INVALID_VALUES',
        `Invalid amenity IDs: ${invalidIds.join(', ')}. Amenities must exist, be active, and have type 'installation'`,
        invalidIds,
      );
    }
  }

  /**
   * Executes the amenity assignment transaction
   */
  async function executeAmenityAssignment(
    installationId: number,
    amenityIds: number[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Clear existing assignments
      await installationAmenityRepository.clearInstallationAmenities(
        installationId,
        tx,
      );

      // Assign new amenities
      await installationAmenityRepository.assignAmenitiesToInstallation(
        installationId,
        amenityIds,
        tx,
      );
    });
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

    // Get properties for all installations that have a type
    const installationsWithTypes = installationsResult.filter(
      (installation) => installation.installationTypeId !== null,
    );

    // Get properties for each installation with a type
    const propertiesPromises = installationsWithTypes.map((installation) =>
      installationPropertyUseCases.getInstallationPropertiesForResponse(
        installation.installationTypeId,
        installation.id,
      ),
    );

    const propertiesResults = await Promise.all(propertiesPromises);

    // Create a map for quick lookup of properties by installation ID
    const propertiesMap = new Map<number, InstallationPropertyResponse[]>();
    installationsWithTypes.forEach((installation, index) => {
      propertiesMap.set(installation.id, propertiesResults[index]);
    });

    // Enrich installations with location information and properties
    const installationsWithLocation: InstallationWithDetails[] =
      installationsResult.map((installation) => ({
        ...installation,
        location: locationMap.get(installation.id) || null,
        properties: propertiesMap.get(installation.id) ?? [],
        amenities: [], // Amenities are not included in list operations for performance
      }));

    return {
      data: installationsWithLocation,
      pagination,
    };
  }

  return {
    createNodeInstallation,
    updateInstallationProperties,
    findOneWithLocation,
    assignAmenities,
    appendLocationInfo,
  };
}

// Export the use case instance
export const installationUseCases = createInstallationUseCases();
