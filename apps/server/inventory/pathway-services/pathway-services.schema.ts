import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pathwayServiceAssignments } from '../pathway-service-assignments/pathway-service-assignments.schema';

/**
 * Database table for pathway services
 */
export const pathwayServices = pgTable('pathway_services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  serviceType: text('service_type').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  category: text('category').notNull(),
  provider: text('provider').notNull(),
  providerScheduleHours: jsonb('provider_schedule_hours').notNull(),
  duration: integer('duration').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Relations for pathway services table
 */
export const pathwayServicesRelations = relations(
  pathwayServices,
  ({ many }) => ({
    pathwayServiceAssignments: many(pathwayServiceAssignments),
  }),
);
