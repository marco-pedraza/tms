import { FieldErrorCollector } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { amenitiesRepository } from '@/inventory/shared-entities/amenities/amenities.repository';
import {
  type Amenity,
  AmenityType,
} from '@/inventory/shared-entities/amenities/amenities.types';
import { serviceTypeAmenityRepository } from '@/inventory/shared-entities/amenities/service-type-amenities.repository';
import type { ServiceTypeWithAmenities } from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';

/**
 * Creates use cases for managing service types with complex business logic
 * that coordinates multiple repositories
 * @returns Object with service type-specific use case functions
 */
export function createServiceTypeUseCases() {
  /**
   * Finds a service type by ID with its assigned amenities
   * @param id - The ID of the service type to find
   * @returns Promise resolving to service type with amenities
   */
  async function findOneWithAmenities(
    id: number,
  ): Promise<ServiceTypeWithAmenities> {
    const serviceType = await serviceTypeRepository.findOne(id);
    const amenities =
      await serviceTypeAmenityRepository.getServiceTypeAmenities(id);

    return {
      ...serviceType,
      amenities: amenities as Amenity[],
    };
  }

  /**
   * Assigns amenities to a service type
   * @param serviceTypeId - The ID of the service type to assign amenities to
   * @param amenityIds - The IDs of the amenities to assign
   * @returns The updated service type
   */
  async function assignAmenities(
    serviceTypeId: number,
    amenityIds: number[],
  ): Promise<ServiceTypeWithAmenities> {
    // Validate service type exists
    await serviceTypeRepository.findOne(serviceTypeId);

    // Handle empty amenity list case
    if (amenityIds.length === 0) {
      return await clearAllAmenities(serviceTypeId);
    }

    // Validate amenity assignments
    await validateAmenityAssignments(amenityIds);

    // Execute amenity assignment transaction
    await executeAmenityAssignment(serviceTypeId, amenityIds);

    // Return updated service type
    return await findOneWithAmenities(serviceTypeId);
  }

  async function clearAllAmenities(
    serviceTypeId: number,
  ): Promise<ServiceTypeWithAmenities> {
    await db.transaction(async (tx) => {
      await serviceTypeAmenityRepository.clearServiceTypeAmenities(
        serviceTypeId,
        tx,
      );
    });

    return await findOneWithAmenities(serviceTypeId);
  }

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

  async function validateAmenitiesExistAndMeetCriteria(
    amenityIds: number[],
    validator: FieldErrorCollector,
  ): Promise<void> {
    const invalidIds =
      await amenitiesRepository.validateServiceTypeAmenityIds(amenityIds);

    if (invalidIds.length > 0) {
      validator.addError(
        'amenityIds',
        'INVALID_VALUES',
        `Invalid amenity IDs: ${invalidIds.join(
          ', ',
        )}. Amenities must exist, be active, and have type '${AmenityType.SERVICE_TYPE}'`,
        invalidIds,
      );
    }
  }

  async function executeAmenityAssignment(
    serviceTypeId: number,
    amenityIds: number[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Clear existing assignments
      await serviceTypeAmenityRepository.clearServiceTypeAmenities(
        serviceTypeId,
        tx,
      );

      // Assign new amenities
      await serviceTypeAmenityRepository.assignAmenitiesToServiceType(
        serviceTypeId,
        amenityIds,
        tx,
      );
    });
  }

  return { assignAmenities, findOneWithAmenities };
}

export const serviceTypeUseCases = createServiceTypeUseCases();
