import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { busModels } from '../bus-models/bus-models.schema';
import { busSeats } from '../bus-seats/bus-seats.schema';
import { buses } from '../buses/buses.schema';
import { seatLayoutModels } from '../seat-layout-models/seat-layout-models.schema';

/**
 * Database table for seat diagrams
 */
export const seatDiagrams = pgTable('seat_diagrams', {
  id: serial('id').primaryKey(),
  seatLayoutModelId: integer('seat_layout_model_id')
    .notNull()
    .references(() => seatLayoutModels.id),
  name: text('name').notNull(),
  maxCapacity: integer('max_capacity').notNull(),
  allowsAdjacentSeat: boolean('allows_adjacent_seat').notNull().default(false), // Allows one passenger to purchase two adjacent seats
  observations: text('observations'),
  numFloors: integer('num_floors').notNull().default(1),
  seatsPerFloor: jsonb('seats_per_floor').notNull(), // Configuration of seats per floor
  bathroomRows: jsonb('bathroom_rows').default([]).notNull(), // Rows with bathrooms
  totalSeats: integer('total_seats').notNull(),
  isFactoryDefault: boolean('is_factory_default').notNull().default(true),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Relations for seat diagrams
 */
export const seatDiagramsRelations = relations(
  seatDiagrams,
  ({ many, one }) => ({
    busSeats: many(busSeats),
    busModel: one(busModels),
    bus: one(buses),
    seatLayoutModel: one(seatLayoutModels, {
      fields: [seatDiagrams.seatLayoutModelId],
      references: [seatLayoutModels.id],
    }),
  }),
);
