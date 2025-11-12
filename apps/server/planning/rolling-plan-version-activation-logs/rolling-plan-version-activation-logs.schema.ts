import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';
import { rollingPlanVersions } from '@/planning/rolling-plan-versions/rolling-plan-versions.schema';
import { rollingPlans } from '@/planning/rolling-plans/rolling-plans.schema';
import { isNull, relations } from 'drizzle-orm';

/**
 * Database table for rolling plan version activation logs
 * Records historical activation periods for each version
 */
export const rollingPlanVersionActivationLogs = pgTable(
  'rolling_plan_version_activation_logs',
  {
    id: serial('id').primaryKey(),
    versionId: integer('version_id')
      .notNull()
      .references(() => rollingPlanVersions.id),
    rollingPlanId: integer('rolling_plan_id')
      .notNull()
      .references(() => rollingPlans.id),
    activatedAt: timestamp('activated_at').notNull(),
    deactivatedAt: timestamp('deactivated_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index().on(table.versionId),
    index().on(table.rollingPlanId),
    index().on(table.activatedAt),
    // Partial index for active periods (deactivatedAt IS NULL) - more efficient than full index
    index().on(table.deactivatedAt).where(isNull(table.deactivatedAt)),
    // Composite index for version history queries (versionId + activatedAt for ORDER BY)
    index().on(table.versionId, table.activatedAt),
  ],
);

/**
 * Relations for the rolling plan version activation logs table
 */
export const rollingPlanVersionActivationLogsRelations = relations(
  rollingPlanVersionActivationLogs,
  ({ one }) => ({
    version: one(rollingPlanVersions, {
      fields: [rollingPlanVersionActivationLogs.versionId],
      references: [rollingPlanVersions.id],
    }),
    rollingPlan: one(rollingPlans, {
      fields: [rollingPlanVersionActivationLogs.rollingPlanId],
      references: [rollingPlans.id],
    }),
  }),
);
