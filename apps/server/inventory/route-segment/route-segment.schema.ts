import { pgTable, serial, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { routes } from '../routes/routes.schema';

export const routeSegments = pgTable('route_segments', {
  id: serial('id').primaryKey(),
  parentRouteId: integer('parent_route_id')
    .notNull()
    .references(() => routes.id, { onDelete: 'cascade' }),
  segmentRouteId: integer('segment_route_id')
    .notNull()
    .references(() => routes.id),
  sequence: integer('sequence').notNull(),
  active: boolean('active').notNull().default(true),
});

export const routeSegmentsRelations = relations(routeSegments, ({ one }) => ({
  parentRoute: one(routes, {
    fields: [routeSegments.parentRouteId],
    references: [routes.id],
    relationName: 'parentRoute',
  }),
  route: one(routes, {
    fields: [routeSegments.segmentRouteId],
    references: [routes.id],
    relationName: 'segmentRoute',
  }),
}));
