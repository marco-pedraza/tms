/**
 * Base interface representing a bus model amenity assignment entity
 */
export interface BusModelAmenityAssignment {
  /** Unique identifier for the assignment */
  id: number;

  /** ID of the bus model */
  busModelId: number;

  /** ID of the amenity */
  amenityId: number;

  /** Timestamp when the assignment was created */
  createdAt: Date | string | null;

  /** Timestamp when the assignment was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new bus model amenity assignment
 */
export interface CreateBusModelAmenityPayload {
  /**
   * ID of the bus model to assign the amenity to
   */
  busModelId: number;

  /**
   * ID of the amenity to assign
   */
  amenityId: number;
}
