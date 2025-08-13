import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { eq, relations } from 'drizzle-orm';
import { seatDiagrams } from '@/inventory/fleet/seat-diagrams/seat-diagrams.schema';

/**
 * Database table for bus seats
 */
export const busSeats = pgTable(
  'bus_seats',
  {
    id: serial('id').primaryKey(),
    seatDiagramId: integer('seat_diagram_id')
      .notNull()
      .references(() => seatDiagrams.id, { onDelete: 'cascade' }),
    spaceType: text('space_type').notNull().default('seat'), // seat/stairs/hallway/bathroom/empty
    seatNumber: text('seat_number'), // Only required for SEAT space types
    floorNumber: integer('floor_number').notNull().default(1),
    seatType: text('seat_type'), // Only applicable for SEAT space types - Regular/Premium/VIP/etc.
    amenities: jsonb('amenities').default([]).notNull(),
    reclinementAngle: integer('reclinement_angle'),
    position: jsonb('position').notNull(), // X, Y coordinates in layout
    meta: jsonb('meta').default({}).notNull(), // Additional metadata for the seat
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index().on(table.seatDiagramId),
    index().on(table.spaceType),
    // Only enforce unique seat number for SEAT space types
    uniqueIndex()
      .on(table.seatDiagramId, table.seatNumber)
      .where(eq(table.spaceType, 'seat')),
  ],
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
