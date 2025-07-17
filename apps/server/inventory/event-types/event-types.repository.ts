import { inArray } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
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
  const baseRepository = createBaseRepository<
    EventType,
    CreateEventTypePayload,
    UpdateEventTypePayload,
    typeof eventTypes
  >(db, eventTypes, 'EventType', {
    searchableFields: [eventTypes.name, eventTypes.code],
    softDeleteEnabled: true,
  });

  /**
   * Validates that multiple event type IDs exist
   * @param eventTypeIds - Array of event type IDs to validate
   * @param tx - Optional transaction instance
   * @returns Array of missing event type IDs (empty if all exist)
   */
  async function validateEventTypeIds(
    eventTypeIds: number[],
    tx?: TransactionalDB,
  ): Promise<number[]> {
    if (eventTypeIds.length === 0) {
      return [];
    }

    // Use transaction instance if provided, otherwise use default db
    const dbInstance = tx ?? db;

    // Get existing event types using inArray for efficiency
    const existingEventTypes = await dbInstance
      .select()
      .from(eventTypes)
      .where(inArray(eventTypes.id, eventTypeIds));

    // Extract existing IDs
    const existingIds = existingEventTypes.map((eventType) => eventType.id);

    // Find missing IDs
    const missingIds = eventTypeIds.filter((id) => !existingIds.includes(id));

    return missingIds;
  }

  return {
    ...baseRepository,
    validateEventTypeIds,
  };
}

export const eventTypeRepository = createEventTypeRepository();
