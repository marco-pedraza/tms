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
import { buses } from '../buses/buses.schema';
import { seatLayoutModels } from '../seat-layout-models/seat-layout-models.schema';

/**
 * Database table for bus models
 */
export const busModels = pgTable(
  'bus_models',
  {
    id: serial('id').primaryKey(),
    defaultSeatLayoutModelId: integer('default_seat_layout_model_id')
      .notNull()
      .references(() => seatLayoutModels.id),
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
  },
  (table) => [
    index().on(table.defaultSeatLayoutModelId),
    index().on(table.manufacturer),
    index().on(table.model),
  ],
);

/**
 * Relations for bus models
 */
export const busModelsRelations = relations(busModels, ({ one, many }) => ({
  defaultSeatLayoutModel: one(seatLayoutModels, {
    fields: [busModels.defaultSeatLayoutModelId],
    references: [seatLayoutModels.id],
  }),
  buses: many(buses),
}));
