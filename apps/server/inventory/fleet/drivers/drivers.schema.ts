import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { buses } from '@/inventory/fleet/buses/buses.schema';
import { busLines } from '@/inventory/operators/bus-lines/bus-lines.schema';
import { transporters } from '@/inventory/operators/transporters/transporters.schema';

export const drivers = pgTable(
  'drivers',
  {
    id: serial('id').primaryKey(),
    driverKey: text('driver_key').notNull().unique(),
    fullName: text('full_name').notNull(),
    rfc: text('rfc').notNull().unique(),
    curp: text('curp').notNull().unique(),
    imss: text('imss'),
    civilStatus: text('civil_status'),
    dependents: integer('dependents'),
    addressStreet: text('address_street'),
    addressNeighborhood: text('address_neighborhood'),
    addressCity: text('address_city'),
    addressState: text('address_state'),
    postalCode: text('postal_code'),
    phoneNumber: text('phone_number').notNull(),
    email: text('email').notNull(),
    driverType: text('driver_type').notNull(),
    position: text('position'),
    officeCode: text('office_code'),
    officeLocation: text('office_location'),
    hireDate: date('hire_date'),
    status: text('status').notNull(),
    statusDate: date('status_date').notNull(),
    federalLicense: text('federal_license'),
    federalLicenseExpiry: date('federal_license_expiry'),
    stateLicense: text('state_license'),
    stateLicenseExpiry: date('state_license_expiry'),
    creditCard: text('credit_card'),
    creditCardExpiry: date('credit_card_expiry'),
    company: text('company'),
    transporterId: integer('transporter_id').references(() => transporters.id),
    busLineId: integer('bus_line_id').references(() => busLines.id),
    busId: integer('bus_id').references(() => buses.id),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index().on(table.fullName),
    index().on(table.email),
    index().on(table.phoneNumber),
    index().on(table.transporterId),
    index().on(table.busLineId),
    index().on(table.busId),
    index().on(table.status),
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
}));
