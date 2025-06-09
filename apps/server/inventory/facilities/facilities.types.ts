/**
 * Base interface representing a facility entity
 */
export interface Facility {
  /** Unique code identifier for the facility */
  code: string;

  /** Name of the facility in Spanish */
  name: string;
}

/**
 * Response type for the list facilities endpoint
 */
export interface Facilities {
  /** List of facilities */
  facilities: Facility[];
}
