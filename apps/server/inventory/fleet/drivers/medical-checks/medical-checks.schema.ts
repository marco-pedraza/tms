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

export const driverMedicalChecks = pgTable(
  'driver_medical_checks',
  {
    id: serial('id').primaryKey(),
    driverId: integer('driver_id')
      .references(() => drivers.id)
      .notNull(),
    checkDate: date('check_date').notNull(),
    nextCheckDate: date('next_check_date').notNull(),
    daysUntilNextCheck: integer('days_until_next_check').notNull(),
    source: text('source').notNull(),
    result: text('result').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.deletedAt),
    index().on(table.checkDate),
    index().on(table.source),
    index().on(table.result),
    // Composite indexes
    index().on(table.driverId, table.checkDate),
    index().on(table.driverId, table.nextCheckDate),
  ],
);

export const driverMedicalChecksRelations = relations(
  driverMedicalChecks,
  ({ one }) => ({
    driver: one(drivers, {
      fields: [driverMedicalChecks.driverId],
      references: [drivers.id],
    }),
  }),
);
