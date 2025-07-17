/**
 * Base interface representing an event type installation type assignment
 */
export interface EventTypeInstallationType {
  /** Unique identifier for the assignment */
  id: number;

  /** ID of the event type */
  eventTypeId: number;

  /** ID of the installation type */
  installationTypeId: number;

  /** Timestamp when the assignment was created */
  createdAt: Date | null;

  /** Timestamp when the assignment was last updated */
  updatedAt: Date | null;
}

/**
 * Payload for creating a new event type installation type assignment
 */
export interface CreateEventTypeInstallationTypePayload {
  /** ID of the event type to assign */
  eventTypeId: number;

  /** ID of the installation type to assign to */
  installationTypeId: number;
}

/**
 * Payload for updating an existing event type installation type assignment
 */
export interface UpdateEventTypeInstallationTypePayload {
  /** ID of the event type to assign */
  eventTypeId?: number;

  /** ID of the installation type to assign to */
  installationTypeId?: number;
}
