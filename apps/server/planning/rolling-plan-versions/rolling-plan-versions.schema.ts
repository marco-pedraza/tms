import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { rollingPlanVersionActivationLogs } from '@/planning/rolling-plan-version-activation-logs/rolling-plan-version-activation-logs.schema';
import { rollingPlans } from '@/planning/rolling-plans/rolling-plans.schema';
import { relations } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';

/**
 * Database table for rolling plan versions
 * Represents immutable, independent versions of rolling plans
 */
export const rollingPlanVersions = pgTable(
  'rolling_plan_versions',
  {
    id: serial('id').primaryKey(),
    rollingPlanId: integer('rolling_plan_id')
      .notNull()
      .references(() => rollingPlans.id),
    name: text('name').notNull(),
    state: text('state').notNull().default('draft'), // 'draft' | 'active' | 'inactive'
    notes: text('notes'),
    activatedAt: timestamp('activated_at'),
    deactivatedAt: timestamp('deactivated_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.rollingPlanId),
    index().on(table.state),
    index().on(table.deletedAt),
    // Composite index for finding active version of a rolling plan
    index().on(table.rollingPlanId, table.state).where(isNull(table.deletedAt)),
    // Index for date range queries and ordering by activation date
    index().on(table.activatedAt),
    // Composite index for version history queries
    index().on(table.rollingPlanId, table.activatedAt),
    // Unique index on (rolling_plan_id, name) respecting soft delete
    uniqueIndex()
      .on(table.rollingPlanId, table.name)
      .where(isNull(table.deletedAt)),
  ],
);

/**
 * Relations for the rolling plan versions table
 */
export const rollingPlanVersionsRelations = relations(
  rollingPlanVersions,
  ({ one, many }) => ({
    rollingPlan: one(rollingPlans, {
      fields: [rollingPlanVersions.rollingPlanId],
      references: [rollingPlans.id],
    }),
    activationLogs: many(rollingPlanVersionActivationLogs),
  }),
);
