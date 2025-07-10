import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { eventTypes } from './event-types.schema';
import type {
  CreateEventTypePayload,
  EventType,
  UpdateEventTypePayload,
} from './event-types.types';

/**
 * Creates a repository for managing event type entities
 */
export function createEventTypeRepository() {
  return createBaseRepository<
    EventType,
    CreateEventTypePayload,
    UpdateEventTypePayload,
    typeof eventTypes
  >(db, eventTypes, 'EventType', {
    searchableFields: [eventTypes.name, eventTypes.code],
    softDeleteEnabled: true,
  });
}

export const eventTypeRepository = createEventTypeRepository();
