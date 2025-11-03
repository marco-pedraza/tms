import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { busModels } from '@/inventory/fleet/bus-models/bus-models.schema';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import { busLines } from '@/inventory/operators/bus-lines/bus-lines.schema';
import { serviceTypes } from '@/inventory/operators/service-types/service-types.schema';

/**
 * Database table for rolling plans (planes rodantes)
 * Represents operational rotations/schedules for bus lines
 */
export const rollingPlans = pgTable(
  'rolling_plans',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    buslineId: integer('busline_id')
      .notNull()
      .references(() => busLines.id),
    serviceTypeId: integer('service_type_id')
      .notNull()
      .references(() => serviceTypes.id),
    busModelId: integer('bus_model_id')
      .notNull()
      .references(() => busModels.id),
    baseNodeId: integer('base_node_id')
      .notNull()
      .references(() => nodes.id),
    operationType: text('operation_type').notNull(), // 'continuous' | 'specific_days'
    cycleDurationDays: integer('cycle_duration_days'),
    operationDays: jsonb('operation_days'), // JSON array of days or day configurations
    active: boolean('active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.buslineId),
    index().on(table.serviceTypeId),
    index().on(table.busModelId),
    index().on(table.baseNodeId),
    index().on(table.active),
    index().on(table.deletedAt),
    // Unique index on (busline_id, name) respecting soft delete
    uniqueIndex()
      .on(table.buslineId, table.name)
      .where(isNull(table.deletedAt)),
  ],
);

/**
 * Relations for the rolling_plans table
 */
export const rollingPlansRelations = relations(rollingPlans, ({ one }) => ({
  busline: one(busLines, {
    fields: [rollingPlans.buslineId],
    references: [busLines.id],
  }),
  serviceType: one(serviceTypes, {
    fields: [rollingPlans.serviceTypeId],
    references: [serviceTypes.id],
  }),
  busModel: one(busModels, {
    fields: [rollingPlans.busModelId],
    references: [busModels.id],
  }),
  baseNode: one(nodes, {
    fields: [rollingPlans.baseNodeId],
    references: [nodes.id],
  }),
}));
