import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { drivers } from '../drivers.schema';

export const driverTimeOffs = pgTable(
  'driver_time_offs',
  {
    id: serial('id').primaryKey(),
    driverId: integer('driver_id')
      .references(() => drivers.id)
      .notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    type: text('type').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.startDate),
    index().on(table.endDate),
    index().on(table.type),
    index().on(table.deletedAt),
    // Composite index for date range queries
    index().on(table.driverId, table.startDate, table.endDate),
  ],
);

/**
 * Relations for the driver_time_offs table
 */
export const driverTimeOffsRelations = relations(driverTimeOffs, ({ one }) => ({
  driver: one(drivers, {
    fields: [driverTimeOffs.driverId],
    references: [drivers.id],
  }),
}));
