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
import { busLines } from '@/inventory/operators/bus-lines/bus-lines.schema';
import { serviceTypes } from '@/inventory/operators/service-types/service-types.schema';
import { routeLegs } from '../route-legs/route-legs.schema';

export const routes = pgTable(
  'routes',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    serviceTypeId: integer('service_type_id')
      .notNull()
      .references(() => serviceTypes.id),
    buslineId: integer('busline_id')
      .notNull()
      .references(() => busLines.id),
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
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
    index().on(table.name).where(isNull(table.deletedAt)),
    index().on(table.serviceTypeId).where(isNull(table.deletedAt)),
    index().on(table.buslineId).where(isNull(table.deletedAt)),
    index().on(table.originNodeId).where(isNull(table.deletedAt)),
    index().on(table.destinationNodeId).where(isNull(table.deletedAt)),
    index().on(table.originCityId).where(isNull(table.deletedAt)),
    index().on(table.destinationCityId).where(isNull(table.deletedAt)),
    index().on(table.active).where(isNull(table.deletedAt)),
  ],
);

export const routesRelations = relations(routes, ({ one, many }) => ({
  serviceType: one(serviceTypes, {
    fields: [routes.serviceTypeId],
    references: [serviceTypes.id],
  }),
  busline: one(busLines, {
    fields: [routes.buslineId],
    references: [busLines.id],
  }),
  originNode: one(nodes, {
    fields: [routes.originNodeId],
    references: [nodes.id],
    relationName: 'originNode',
  }),
  destinationNode: one(nodes, {
    fields: [routes.destinationNodeId],
    references: [nodes.id],
    relationName: 'destinationNode',
  }),
  originCity: one(cities, {
    fields: [routes.originCityId],
    references: [cities.id],
    relationName: 'originCity',
  }),
  destinationCity: one(cities, {
    fields: [routes.destinationCityId],
    references: [cities.id],
    relationName: 'destinationCity',
  }),
  routeLegs: many(routeLegs),
}));
