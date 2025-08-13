/**
 * Base interface representing an installation amenity assignment entity
 */
export interface InstallationAmenityAssignment {
  /** Unique identifier for the assignment */
  id: number;

  /** ID of the installation */
  installationId: number;

  /** ID of the amenity */
  amenityId: number;

  /** Timestamp when the assignment was created */
  createdAt: Date | string | null;

  /** Timestamp when the assignment was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new installation amenity assignment
 */
export interface CreateInstallationAmenityPayload {
  /**
   * ID of the installation to assign the amenity to
   */
  installationId: number;

  /**
   * ID of the amenity to assign
   */
  amenityId: number;
}
