import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import { pathwayOptions } from '@/inventory/routing/pathway-options/pathway-options.schema';
import { pathways } from '@/inventory/routing/pathways/pathways.schema';
import { routes } from '../routes/routes.schema';

export const routeLegs = pgTable(
  'route_legs',
  {
    id: serial('id').primaryKey(),
    position: integer('position').notNull(),
    routeId: integer('route_id')
      .notNull()
      .references(() => routes.id),
    originNodeId: integer('origin_node_id')
      .notNull()
      .references(() => nodes.id),
    destinationNodeId: integer('destination_node_id')
      .notNull()
      .references(() => nodes.id),
    pathwayId: integer('pathway_id')
      .notNull()
      .references(() => pathways.id),
    pathwayOptionId: integer('pathway_option_id')
      .notNull()
      .references(() => pathwayOptions.id),
    isDerived: boolean('is_derived').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex()
      .on(table.routeId, table.position)
      .where(isNull(table.deletedAt)),
    index().on(table.routeId).where(isNull(table.deletedAt)),
    index().on(table.originNodeId).where(isNull(table.deletedAt)),
    index().on(table.destinationNodeId).where(isNull(table.deletedAt)),
    index().on(table.pathwayId).where(isNull(table.deletedAt)),
    index().on(table.pathwayOptionId).where(isNull(table.deletedAt)),
    index().on(table.isDerived).where(isNull(table.deletedAt)),
    index().on(table.active).where(isNull(table.deletedAt)),
  ],
);

export const routeLegsRelations = relations(routeLegs, ({ one }) => ({
  route: one(routes, {
    fields: [routeLegs.routeId],
    references: [routes.id],
  }),
  originNode: one(nodes, {
    fields: [routeLegs.originNodeId],
    references: [nodes.id],
    relationName: 'originNode',
  }),
  destinationNode: one(nodes, {
    fields: [routeLegs.destinationNodeId],
    references: [nodes.id],
    relationName: 'destinationNode',
  }),
  pathway: one(pathways, {
    fields: [routeLegs.pathwayId],
    references: [pathways.id],
  }),
  pathwayOption: one(pathwayOptions, {
    fields: [routeLegs.pathwayOptionId],
    references: [pathwayOptions.id],
  }),
}));
