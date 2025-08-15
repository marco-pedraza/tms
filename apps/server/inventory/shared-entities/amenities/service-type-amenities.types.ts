/**
 * Assignment between a service type and an amenity
 */
export interface ServiceTypeAmenityAssignment {
  /** Unique identifier for the assignment */
  id: number;

  /** ID of the service type */
  serviceTypeId: number;

  /** ID of the amenity */
  amenityId: number;

  /** Timestamp when the assignment was created */
  createdAt: Date | string | null;

  /** Timestamp when the assignment was last updated */
  updatedAt: Date | string | null;
}

/**
 * Payload to create a service type amenity assignment
 */
export interface CreateServiceTypeAmenityPayload {
  /** ID of the service type */
  serviceTypeId: number;

  /** ID of the amenity */
  amenityId: number;
}
