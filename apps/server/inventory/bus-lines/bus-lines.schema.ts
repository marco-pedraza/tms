import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull } from 'drizzle-orm';
import { serviceTypes } from '../service-types/service-types.schema';
import { transporters } from '../transporters/transporters.schema';

/**
 * Database table for bus lines (branded bus services operated by transporters)
 */
export const busLines = pgTable(
  'bus_lines',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    transporterId: integer('transporter_id')
      .notNull()
      .references(() => transporters.id),
    serviceTypeId: integer('service_type_id')
      .notNull()
      .references(() => serviceTypes.id),
    pricePerKilometer: integer('price_per_km_multiplier').notNull().default(1),
    description: text('description'),
    fleetSize: integer('fleet_size'),
    website: text('website'),
    email: text('email'),
    phone: text('phone'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.transporterId),
    index().on(table.serviceTypeId),
    index().on(table.deletedAt),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
  ],
);
