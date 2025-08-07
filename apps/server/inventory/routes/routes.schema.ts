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
import { cities } from '../cities/cities.schema';
import { pathways } from '../pathways/pathways.schema';
import { routeSegments } from '../route-segment/route-segment.schema';

export const routes = pgTable(
  'routes',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    originCityId: integer('origin_city_id')
      .notNull()
      .references(() => cities.id),
    destinationCityId: integer('destination_city_id')
      .notNull()
      .references(() => cities.id),
    pathwayId: integer('pathway_id')
      .references(() => pathways.id)
      .unique(),
    distance: real('distance').notNull(),
    baseTime: integer('base_time').notNull(),
    isCompound: boolean('is_compound').notNull().default(false),
    connectionCount: integer('connection_count').notNull().default(0),
    totalTravelTime: integer('total_travel_time').notNull(),
    totalDistance: real('total_distance').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index().on(table.name),
    index().on(table.originCityId, table.destinationCityId),
  ],
);

export const routesRelations = relations(routes, ({ one, many }) => ({
  originCity: one(cities, {
    fields: [routes.originCityId],
    references: [cities.id],
  }),
  destinationCity: one(cities, {
    fields: [routes.destinationCityId],
    references: [cities.id],
  }),
  pathway: one(pathways, {
    fields: [routes.pathwayId],
    references: [pathways.id],
  }),
  routeSegments: many(routeSegments, { relationName: 'parentRoute' }),
}));
