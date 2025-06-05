import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { busDiagramModels } from '../bus-diagram-models/bus-diagram-models.schema';

/**
 * Database table for bus seat models (templates for bus seats)
 */
export const busSeatModels = pgTable(
  'bus_seat_models',
  {
    id: serial('id').primaryKey(),
    busDiagramModelId: integer('bus_diagram_model_id')
      .notNull()
      .references(() => busDiagramModels.id, { onDelete: 'cascade' }),
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
  (table) => [
    index().on(table.busDiagramModelId),
    unique().on(table.busDiagramModelId, table.seatNumber),
  ],
);

/**
 * Relations for bus seat models
 */
export const busSeatModelsRelations = relations(busSeatModels, ({ one }) => ({
  busDiagramModel: one(busDiagramModels, {
    fields: [busSeatModels.busDiagramModelId],
    references: [busDiagramModels.id],
  }),
}));
