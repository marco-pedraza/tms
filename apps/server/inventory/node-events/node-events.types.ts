import type { EventType } from '../event-types/event-types.types';

/**
 * Base interface representing a node event entity
 */
export interface NodeEvent {
  /** Unique identifier for the node event */
  id: number;

  /** ID of the node this event belongs to */
  nodeId: number;

  /** ID of the event type */
  eventTypeId: number;

  /** Optional custom time that overrides the base time */
  customTime: number | null;

  /** Timestamp when the event was created */
  createdAt: Date | string | null;

  /** Timestamp when the event was last updated */
  updatedAt: Date | string | null;
}

/**
 * Node event entity with event type relation
 */
export interface NodeEventWithEventType extends NodeEvent {
  eventType: EventType;
}

/**
 * Node event with flattened event type information
 */
export interface NodeEventFlat {
  // From node_events table
  id: number;
  nodeId: number;
  eventTypeId: number;
  customTime: number | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;

  // From event_types table (flattened)
  name: string;
  code: string;
  description: string | null;
  baseTime: number;
  needsCost: boolean;
  needsQuantity: boolean;
  integration: boolean;
  active: boolean;
}

/**
 * Payload for creating a new node event
 */
export interface CreateNodeEventPayload {
  /** ID of the node this event belongs to */
  nodeId: number;

  /** ID of the event type */
  eventTypeId: number;

  /** Optional custom time that overrides the base time */
  customTime?: number | null;
}

/**
 * Payload for updating an existing node event
 */
export interface UpdateNodeEventPayload {
  /** Optional custom time that overrides the base time */
  customTime?: number | null;
}
