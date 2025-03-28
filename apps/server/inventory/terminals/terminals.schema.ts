import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';
import { cities } from '../cities/cities.schema';

export const terminals = pgTable('terminals', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  cityId: integer('city_id')
    .notNull()
    .references(() => cities.id),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  contactphone: text('contactphone'),
  operatingHours: jsonb('operating_hours'),
  facilities: jsonb('facilities'),
  code: text('code').notNull().unique(),
  slug: text('slug').notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
