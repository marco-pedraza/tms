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
import { busDiagramModels } from '../bus-diagram-models/bus-diagram-models.schema';

/**
 * Database table for bus diagram model zones
 */
export const busDiagramModelZones = pgTable(
  'bus_diagram_model_zones',
  {
    id: serial('id').primaryKey(),
    busDiagramModelId: integer('bus_diagram_model_id')
      .notNull()
      .references(() => busDiagramModels.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    rowNumbers: integer('row_numbers').array().notNull(),
    priceMultiplier: numeric('price_multiplier').notNull().default('1.0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index().on(table.name), index().on(table.busDiagramModelId)],
);

/**
 * Relations for bus diagram model zones
 */
export const busDiagramModelZonesRelations = relations(
  busDiagramModelZones,
  ({ one }) => ({
    busDiagramModel: one(busDiagramModels, {
      fields: [busDiagramModelZones.busDiagramModelId],
      references: [busDiagramModels.id],
    }),
  }),
);
