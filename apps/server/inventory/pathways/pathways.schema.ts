import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pathwayServiceAssignments } from '../pathway-service-assignments/pathway-service-assignments.schema';

/**
 * Database table for pathways
 */
export const pathways = pgTable('pathways', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  distance: real('distance').notNull(),
  typicalTime: integer('typical_time').notNull(),
  meta: jsonb('meta').notNull(),
  tollRoad: boolean('toll_road').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Relations for pathways table
 */
export const pathwaysRelations = relations(pathways, ({ many }) => ({
  pathwayServiceAssignments: many(pathwayServiceAssignments),
}));
