import { and, eq, gte, isNull, lte, ne, sql } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { driverTimeOffs } from './time-offs.schema';
import type {
  CreateDriverTimeOffPayload,
  DriverTimeOff,
  UpdateDriverTimeOffPayload,
} from './time-offs.types';

/**
 * Creates a repository for managing driver time-off entities
 * @returns {Object} An object containing time-off-specific operations and base CRUD operations
 */
export const createDriverTimeOffRepository = () => {
  const baseRepository = createBaseRepository<
    DriverTimeOff,
    CreateDriverTimeOffPayload,
    UpdateDriverTimeOffPayload,
    typeof driverTimeOffs
  >(db, driverTimeOffs, 'DriverTimeOff', {
    softDeleteEnabled: true,
  });

  /**
   * Check if there are any overlapping time-offs for a driver
   * @param driverId - ID of the driver
   * @param startDate - Start date of the new time-off
   * @param endDate - End date of the new time-off
   * @param excludeId - Optional ID to exclude from the check (for updates)
   * @returns Promise<boolean> - True if there are overlapping time-offs
   */
  const hasOverlappingTimeOffs = async (
    driverId: number,
    startDate: string,
    endDate: string,
    excludeId?: number,
  ): Promise<boolean> => {
    const conditions = [
      // Driver filter
      eq(driverTimeOffs.driverId, driverId),
      // Soft delete filter
      isNull(driverTimeOffs.deletedAt),
      // Overlap check using canonical predicate: NOT (existing.end < new.start OR existing.start > new.end)
      // Using De Morgan's law: NOT (A OR B) = (NOT A) AND (NOT B)
      // Which becomes: (existing.end >= new.start) AND (existing.start <= new.end)
      and(
        gte(driverTimeOffs.endDate, startDate),
        lte(driverTimeOffs.startDate, endDate),
      ),
    ];

    // Exclude current record if updating
    if (excludeId) {
      conditions.push(ne(driverTimeOffs.id, excludeId));
    }

    const result = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(driverTimeOffs)
      .where(and(...conditions));

    return result[0].count > 0;
  };

  return {
    ...baseRepository,
    hasOverlappingTimeOffs,
  };
};

// Export the driver time-off repository instance
export const driverTimeOffRepository = createDriverTimeOffRepository();
