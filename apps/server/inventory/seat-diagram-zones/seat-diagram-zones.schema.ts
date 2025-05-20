import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { seatDiagrams } from '../seat-diagrams/seat-diagrams.schema';

/**
 * Database table for seat diagram zones
 */
export const seatDiagramZones = pgTable(
  'seat_diagram_zones',
  {
    id: serial('id').primaryKey(),
    seatDiagramId: integer('seat_diagram_id')
      .notNull()
      .references(() => seatDiagrams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    rowNumbers: integer('row_numbers').array().notNull(),
    priceMultiplier: numeric('price_multiplier').notNull().default('1.0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index().on(table.name), index().on(table.seatDiagramId)],
);

/**
 * Relations for seat diagram zones
 */
export const seatDiagramZonesRelations = relations(
  seatDiagramZones,
  ({ one }) => ({
    seatDiagram: one(seatDiagrams, {
      fields: [seatDiagramZones.seatDiagramId],
      references: [seatDiagrams.id],
    }),
  }),
);
