import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { busModels } from '../bus-models/bus-models.schema';

/**
 * Database table for bus seats
 */
export const busSeats = pgTable('bus_seats', {
  id: serial('id').primaryKey(),
  modelId: integer('model_id')
    .notNull()
    .references(() => busModels.id),
  seatNumber: text('seat_number').notNull(),
  floorNumber: integer('floor_number').notNull().default(1),
  seatType: text('seat_type').notNull(), // Regular/Premium/VIP/etc.
  amenities: jsonb('amenities').default([]).notNull(),
  reclinementAngle: integer('reclinement_angle'),
  position: jsonb('position').notNull(), // X, Y coordinates in layout
  meta: jsonb('meta').default({}).notNull(), // Additional metadata for the seat
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
