import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  real,
} from 'drizzle-orm/pg-core';
import { states } from '../states/states.schema';

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  stateId: integer('state_id')
    .notNull()
    .references(() => states.id),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  timezone: text('timezone').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  slug: text('slug').notNull().unique(),
});
