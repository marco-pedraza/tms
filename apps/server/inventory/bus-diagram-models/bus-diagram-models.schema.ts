import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { seatDiagrams } from '../seat-diagrams/seat-diagrams.schema';

/**
 * Database table for bus diagram models (templates for seat diagrams)
 */
export const busDiagramModels = pgTable(
  'bus_diagram_models',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    maxCapacity: integer('max_capacity').notNull(),
    numFloors: integer('num_floors').notNull().default(1),
    seatsPerFloor: jsonb('seats_per_floor').notNull(), // Configuration of seats per floor
    bathroomRows: jsonb('bathroom_rows').default([]).notNull(), // Rows with bathrooms
    totalSeats: integer('total_seats').notNull(),
    isFactoryDefault: boolean('is_factory_default').notNull().default(true),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index().on(table.name)],
);

/**
 * Relations for bus diagram models
 */
export const busDiagramModelsRelations = relations(
  busDiagramModels,
  ({ many }) => ({
    seatDiagrams: many(seatDiagrams),
  }),
);
