// API types

/**
 * Base interface representing a timezone entity
 */
export interface Timezone {
  /** Unique identifier for the timezone */
  id: string;
}

/**
 * Response type for the list timezones endpoint
 */
export interface Timezones {
  /** List of timezones */
  timezones: Timezone[];
}
