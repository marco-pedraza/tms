import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { seatLayoutModels } from '../seat-layout-models/seat-layout-models.schema';

/**
 * Database table for seat layout model zones
 */
export const seatLayoutModelZones = pgTable('seat_layout_model_zones', {
  id: serial('id').primaryKey(),
  seatLayoutModelId: integer('seat_layout_model_id')
    .notNull()
    .references(() => seatLayoutModels.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  rowNumbers: integer('row_numbers').array().notNull(),
  priceMultiplier: numeric('price_multiplier').notNull().default('1.0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Relations for seat layout model zones
 */
export const seatLayoutModelZonesRelations = relations(
  seatLayoutModelZones,
  ({ one }) => ({
    seatLayoutModel: one(seatLayoutModels, {
      fields: [seatLayoutModelZones.seatLayoutModelId],
      references: [seatLayoutModels.id],
    }),
  }),
);
