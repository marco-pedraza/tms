import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { busDiagramModels } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.schema';
import { buses } from '@/inventory/fleet/buses/buses.schema';
import { busModelAmenities } from '@/inventory/shared-entities/amenities/amenities.schema';

/**
 * Database table for bus models
 */
export const busModels = pgTable(
  'bus_models',
  {
    id: serial('id').primaryKey(),
    defaultBusDiagramModelId: integer('default_bus_diagram_model_id')
      .notNull()
      .references(() => busDiagramModels.id),
    manufacturer: text('manufacturer').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    seatingCapacity: integer('seating_capacity').notNull(),
    trunkCapacity: integer('trunk_capacity'),
    fuelEfficiency: integer('fuel_efficiency'),
    maxCapacity: integer('max_capacity'),
    numFloors: integer('num_floors').notNull().default(1),
    engineType: text('engine_type'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.defaultBusDiagramModelId),
    index().on(table.manufacturer),
    index().on(table.model),
    index('bus_models_deleted_at_index').on(table.deletedAt),
    uniqueIndex('bus_models_manufacturer_model_year_index')
      .on(table.manufacturer, table.model, table.year)
      .where(isNull(table.deletedAt)),
  ],
);

/**
 * Relations for bus models
 */
export const busModelsRelations = relations(busModels, ({ one, many }) => ({
  defaultBusDiagramModel: one(busDiagramModels, {
    fields: [busModels.defaultBusDiagramModelId],
    references: [busDiagramModels.id],
  }),
  buses: many(buses),
  busModelAmenities: many(busModelAmenities),
}));
