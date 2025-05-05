import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { seatDiagrams } from '../seat-diagrams/seat-diagrams.schema';
import { buses } from '../buses/buses.schema';

/**
 * Database table for bus models
 */
export const busModels = pgTable('bus_models', {
  id: serial('id').primaryKey(),
  defaultSeatDiagramId: integer('default_seat_diagram_id')
    .notNull()
    .references(() => seatDiagrams.id),
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  seatingCapacity: integer('seating_capacity').notNull(),
  numFloors: integer('num_floors').notNull().default(1),
  amenities: jsonb('amenities').default([]),
  engineType: text('engine_type'),
  distributionType: text('distribution_type'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Relations for bus models
 */
export const busModelsRelations = relations(busModels, ({ one, many }) => ({
  defaultSeatDiagram: one(seatDiagrams, {
    fields: [busModels.defaultSeatDiagramId],
    references: [seatDiagrams.id],
  }),
  buses: many(buses),
}));
