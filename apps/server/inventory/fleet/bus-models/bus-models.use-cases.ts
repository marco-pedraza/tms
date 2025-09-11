import { ValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { amenitiesRepository } from '@/inventory/shared-entities/amenities/amenities.repository';
import { AmenityType } from '@/inventory/shared-entities/amenities/amenities.types';
import { busModelAmenitiesRepository } from '@/inventory/shared-entities/amenities/bus-model-amenities.repository';
import type { BusModel, BusModelWithDetails } from './bus-models.types';
import { busModelRepository } from './bus-models.repository';

// Bus model-specific error messages
const BUS_MODEL_ERRORS = {
  INVALID_AMENITIES: (invalidIds: number[]) =>
    `Amenities with ids [${invalidIds.join(', ')}] are invalid (not found, inactive, wrong type, or deleted)`,
  DUPLICATE_AMENITIES:
    'Duplicate amenity IDs are not allowed in the assignment',
};

/**
 * Creates use cases for managing bus models with complex business logic
 * that coordinates multiple repositories
 * @returns Object with bus model-specific use case functions
 */
export function createBusModelUseCases() {
  /**
   * Validates amenity assignments for bus models
   * @param amenityIds - Array of amenity IDs to validate
   * @throws {ValidationError} If amenities are invalid
   */
  async function validateAmenityAssignments(
    amenityIds: number[],
  ): Promise<void> {
    // Check for duplicates
    const uniqueAmenityIds = new Set(amenityIds);
    if (uniqueAmenityIds.size !== amenityIds.length) {
      throw new ValidationError(BUS_MODEL_ERRORS.DUPLICATE_AMENITIES);
    }

    // Validate all amenities exist and are of type 'bus'
    const uniqueAmenityIdsArray = Array.from(uniqueAmenityIds);
    const invalidAmenityIds =
      await amenitiesRepository.validateInstallationAmenityIds(
        uniqueAmenityIdsArray,
        AmenityType.BUS,
      );

    if (invalidAmenityIds.length > 0) {
      throw new ValidationError(
        BUS_MODEL_ERRORS.INVALID_AMENITIES(invalidAmenityIds),
      );
    }
  }

  /**
   * Executes the amenity assignment transaction
   * @param busModelId - The bus model ID to assign amenities to
   * @param amenityIds - Array of amenity IDs to assign
   */
  async function executeAmenityAssignment(
    busModelId: number,
    amenityIds: number[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Clear existing assignments
      await busModelAmenitiesRepository.clearBusModelAmenities(busModelId, tx);

      // Assign new amenities
      await busModelAmenitiesRepository.assignAmenitiesToBusModel(
        busModelId,
        amenityIds,
        tx,
      );
    });
  }

  /**
   * Clears all amenities from a bus model
   * @param busModelId - The ID of the bus model to clear amenities from
   * @returns The updated bus model without amenities
   */
  async function clearAllAmenities(busModelId: number): Promise<BusModel> {
    await db.transaction(async (tx) => {
      await busModelAmenitiesRepository.clearBusModelAmenities(busModelId, tx);
    });

    return busModelRepository.findOne(busModelId);
  }

  /**
   * Assigns amenities to a bus model (destructive operation)
   * This replaces all existing amenity assignments for the bus model
   * @param busModelId - The ID of the bus model to assign amenities to
   * @param amenityIds - Array of amenity IDs to assign
   * @returns The updated bus model with details
   */
  async function assignAmenities(
    busModelId: number,
    amenityIds: number[],
  ): Promise<BusModelWithDetails> {
    // Validate bus model exists
    await busModelRepository.findOne(busModelId);

    // Handle empty amenity list case
    if (amenityIds.length === 0) {
      await clearAllAmenities(busModelId);
      return busModelRepository.findOneWithRelations(busModelId);
    }

    // Validate amenity assignments
    await validateAmenityAssignments(amenityIds);

    // Execute amenity assignment transaction
    await executeAmenityAssignment(busModelId, amenityIds);

    // Return updated bus model with amenities
    return busModelRepository.findOneWithRelations(busModelId);
  }

  return {
    assignAmenities,
  };
}

// Export the use case instance
export const busModelUseCases = createBusModelUseCases();
