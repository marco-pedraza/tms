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
import { relations } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';
import { cities } from '@/inventory/locations/cities/cities.schema';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import { pathwayOptions } from '../pathway-options/pathway-options.schema';

// Table: pathways
export const pathways = pgTable(
  'pathways',
  {
    id: serial('id').primaryKey(),
    originNodeId: integer('origin_node_id')
      .notNull()
      .references(() => nodes.id),
    destinationNodeId: integer('destination_node_id')
      .notNull()
      .references(() => nodes.id),
    originCityId: integer('origin_city_id')
      .notNull()
      .references(() => cities.id),
    destinationCityId: integer('destination_city_id')
      .notNull()
      .references(() => cities.id),
    name: text('name').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    isSellable: boolean('is_sellable').notNull().default(false),
    isEmptyTrip: boolean('is_empty_trip').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.originNodeId),
    index().on(table.destinationNodeId),
    index().on(table.originCityId),
    index().on(table.destinationCityId),
    index().on(table.active),
    index().on(table.deletedAt),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
  ],
);

// Relations
export const pathwaysRelations = relations(pathways, ({ one, many }) => ({
  originNode: one(nodes, {
    fields: [pathways.originNodeId],
    references: [nodes.id],
    relationName: 'originNode',
  }),
  destinationNode: one(nodes, {
    fields: [pathways.destinationNodeId],
    references: [nodes.id],
    relationName: 'destinationNode',
  }),
  originCity: one(cities, {
    fields: [pathways.originCityId],
    references: [cities.id],
    relationName: 'originCity',
  }),
  destinationCity: one(cities, {
    fields: [pathways.destinationCityId],
    references: [cities.id],
    relationName: 'destinationCity',
  }),
  options: many(pathwayOptions),
}));
