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
 * Database table for bus seats
 */
export const busSeats = pgTable(
  'bus_seats',
  {
    id: serial('id').primaryKey(),
    seatDiagramId: integer('seat_diagram_id')
      .notNull()
      .references(() => seatDiagrams.id),
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
  },
  (table) => [index().on(table.seatDiagramId)],
);

/**
 * Relations for bus seats
 */
export const busSeatsRelations = relations(busSeats, ({ one }) => ({
  seatDiagram: one(seatDiagrams, {
    fields: [busSeats.seatDiagramId],
    references: [seatDiagrams.id],
  }),
}));
