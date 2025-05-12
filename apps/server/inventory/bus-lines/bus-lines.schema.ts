import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { serviceTypes } from '../service-types/service-types.schema';
import { transporters } from '../transporters/transporters.schema';

/**
 * Database table for bus lines (branded bus services operated by transporters)
 */
export const busLines = pgTable('bus_lines', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  transporterId: integer('transporter_id')
    .notNull()
    .references(() => transporters.id),
  serviceTypeId: integer('service_type_id')
    .notNull()
    .references(() => serviceTypes.id),
  description: text('description'),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }),
  secondaryColor: varchar('secondary_color', { length: 7 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
