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
import { busDiagramModels } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.schema';

/**
 * Database table for bus seat models (templates for bus spaces: seats, stairs, hallways, etc.)
 */
export const busSeatModels = pgTable(
  'bus_seat_models',
  {
    id: serial('id').primaryKey(),
    busDiagramModelId: integer('bus_diagram_model_id')
      .notNull()
      .references(() => busDiagramModels.id, { onDelete: 'cascade' }),
    spaceType: text('space_type').notNull().default('seat'), // seat/stairs/hallway/bathroom/empty
    seatNumber: text('seat_number'), // Only required for SEAT space types
    floorNumber: integer('floor_number').notNull().default(1),
    seatType: text('seat_type'), // Only applicable for SEAT space types - Regular/Premium/VIP/etc.
    amenities: jsonb('amenities').default([]).notNull(), // Only for SEAT space types
    reclinementAngle: integer('reclinement_angle'), // Only for SEAT space types
    position: jsonb('position').notNull(), // X, Y coordinates in layout
    meta: jsonb('meta').default({}).notNull(), // Additional metadata for the space
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index().on(table.busDiagramModelId),
    index().on(table.spaceType),
    // Only enforce unique seat number for SEAT space types
    uniqueIndex()
      .on(table.busDiagramModelId, table.seatNumber)
      .where(eq(table.spaceType, 'seat')),
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
