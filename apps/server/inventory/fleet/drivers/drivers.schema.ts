import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { busCrews } from '@/inventory/fleet/buses/buses.schema';
import { busLines } from '@/inventory/operators/bus-lines/bus-lines.schema';
import { transporters } from '@/inventory/operators/transporters/transporters.schema';

export const drivers = pgTable(
  'drivers',
  {
    id: serial('id').primaryKey(),
    driverKey: text('driver_key').notNull(),
    payrollKey: text('payroll_key').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    hireDate: date('hire_date'),
    status: text('status').notNull(),
    statusDate: date('status_date').notNull(),
    license: text('license').notNull(),
    licenseExpiry: date('license_expiry').notNull(),
    transporterId: integer('transporter_id')
      .references(() => transporters.id)
      .notNull(),
    busLineId: integer('bus_line_id')
      .references(() => busLines.id)
      .notNull(),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    emergencyContactRelationship: text('emergency_contact_relationship'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.firstName),
    index().on(table.lastName),
    index().on(table.email),
    index().on(table.phone),
    index().on(table.transporterId),
    index().on(table.busLineId),
    index().on(table.status),
    index().on(table.deletedAt),
    uniqueIndex().on(table.driverKey).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.payrollKey).where(isNull(table.deletedAt)),
  ],
);

/**
 * Relations for the drivers table
 */
export const driversRelations = relations(drivers, ({ one }) => ({
  transporter: one(transporters, {
    fields: [drivers.transporterId],
    references: [transporters.id],
  }),
  busLine: one(busLines, {
    fields: [drivers.busLineId],
    references: [busLines.id],
  }),
  assignedBus: one(busCrews, {
    fields: [drivers.id],
    references: [busCrews.driverId],
  }),
}));
