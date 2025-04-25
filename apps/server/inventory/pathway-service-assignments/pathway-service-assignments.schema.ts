import {
  pgTable,
  serial,
  integer,
  boolean,
  real,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pathways } from '../pathways/pathways.schema';
import { pathwayServices } from '../pathway-services/pathway-services.schema';

/**
 * Database table for pathway service assignments
 * Represents the assignment of services to pathways with additional metadata
 */
export const pathwayServiceAssignments = pgTable(
  'pathway_service_assignments',
  {
    id: serial('id').primaryKey(),
    pathwayId: integer('pathway_id')
      .notNull()
      .references(() => pathways.id, { onDelete: 'cascade' }),
    pathwayServiceId: integer('pathway_service_id')
      .notNull()
      .references(() => pathwayServices.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    distanceFromOrigin: real('distance_from_origin').notNull(),
    associatedCost: real('associated_cost'),
    mandatory: boolean('mandatory').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      // There cannot be two assignments of the same service to the same pathway
      uniqueServicePerPathway: unique().on(
        table.pathwayId,
        table.pathwayServiceId,
      ),
      // There cannot be two services with the same sequence in the same pathway
      uniqueSequencePerPathway: unique().on(table.pathwayId, table.sequence),
    };
  },
);

/**
 * Relations for pathway service assignments table
 */
export const pathwayServiceAssignmentsRelations = relations(
  pathwayServiceAssignments,
  ({ one }) => ({
    pathway: one(pathways, {
      fields: [pathwayServiceAssignments.pathwayId],
      references: [pathways.id],
    }),
    pathwayService: one(pathwayServices, {
      fields: [pathwayServiceAssignments.pathwayServiceId],
      references: [pathwayServices.id],
    }),
  }),
);
