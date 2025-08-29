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
import { busDiagramModels } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.schema';
import { busModels } from '@/inventory/fleet/bus-models/bus-models.schema';
import { busSeats } from '@/inventory/fleet/bus-seats/bus-seats.schema';
import { buses } from '@/inventory/fleet/buses/buses.schema';

/**
 * Database table for seat diagrams
 */
export const seatDiagrams = pgTable(
  'seat_diagrams',
  {
    id: serial('id').primaryKey(),
    busDiagramModelId: integer('bus_diagram_model_id')
      .notNull()
      .references(() => busDiagramModels.id),
    name: text('name').notNull(),
    description: text('description'),
    maxCapacity: integer('max_capacity').notNull(),
    numFloors: integer('num_floors').notNull().default(1),
    seatsPerFloor: jsonb('seats_per_floor').notNull(), // Configuration of seats per floor
    totalSeats: integer('total_seats').notNull(),
    isFactoryDefault: boolean('is_factory_default').notNull().default(true),
    isModified: boolean('is_modified').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'), // Soft delete support
  },
  (table) => [
    index().on(table.deletedAt),
    index().on(table.name),
    index().on(table.busDiagramModelId),
  ],
);

/**
 * Relations for seat diagrams
 */
export const seatDiagramsRelations = relations(
  seatDiagrams,
  ({ many, one }) => ({
    busSeats: many(busSeats),
    busModel: one(busModels),
    bus: one(buses),
    busDiagramModel: one(busDiagramModels, {
      fields: [seatDiagrams.busDiagramModelId],
      references: [busDiagramModels.id],
    }),
  }),
);
