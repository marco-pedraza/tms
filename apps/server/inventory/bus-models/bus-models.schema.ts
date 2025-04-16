import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Database table for bus models
 */
export const busModels = pgTable('bus_models', {
  id: serial('id').primaryKey(),
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  seatingCapacity: integer('seating_capacity').notNull(),
  numFloors: integer('num_floors').notNull().default(1),
  seatsPerFloor: jsonb('seats_per_floor').notNull(),
  bathroomRows: jsonb('bathroom_rows').default([]).notNull(),
  amenities: jsonb('amenities').default([]),
  engineType: text('engine_type'),
  distributionType: text('distribution_type'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
