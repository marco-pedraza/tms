import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pathwayOptionTolls } from '../pathway-options-tolls/pathway-options-tolls.schema';
import { pathways } from '../pathways/pathways.schema';

export const pathwayOptions = pgTable(
  'pathway_options',
  {
    id: serial('id').primaryKey(),
    pathwayId: integer('pathway_id')
      .notNull()
      .references(() => pathways.id),
    name: text('name'),
    description: text('description'),
    distanceKm: real('distance_km'),
    typicalTimeMin: integer('typical_time_min'),
    avgSpeedKmh: real('avg_speed_kmh'),
    isDefault: boolean('is_default'),
    isPassThrough: boolean('is_pass_through'),
    passThroughTimeMin: integer('pass_through_time_min'),
    sequence: integer('sequence'),
    active: boolean('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.pathwayId),
    index().on(table.sequence),
    index().on(table.deletedAt),
  ],
);

export const pathwayOptionsRelations = relations(
  pathwayOptions,
  ({ one, many }) => ({
    pathway: one(pathways, {
      fields: [pathwayOptions.pathwayId],
      references: [pathways.id],
    }),
    pathwayOptionTolls: many(pathwayOptionTolls),
  }),
);
