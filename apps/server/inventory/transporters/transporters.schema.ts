import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { cities } from '../cities/cities.schema';

/**
 * Database table for transporters (transportation companies)
 */
export const transporters = pgTable('transporters', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  description: text('description'),
  website: text('website'),
  email: text('email'),
  phone: text('phone'),
  headquarterCityId: integer('headquarter_city_id').references(() => cities.id),
  logoUrl: text('logo_url'),
  contactInfo: text('contact_info'),
  licenseNumber: text('license_number'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
