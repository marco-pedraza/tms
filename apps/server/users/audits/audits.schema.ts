import {
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../users/users.schema';

/**
 * Schema for the audits table
 * This table tracks changes to users for auditing purposes
 */
export const audits = pgTable(
  'audits',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    service: text('service').notNull(), // The service or module that initiated the action
    endpoint: text('endpoint'), // The specific API endpoint accessed
    details: json('details'), // Details of what changed
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Index on createdAt for efficient time-based querying
    createdAtIdx: index('audits_created_at_idx').on(table.createdAt),

    // Index on userAgent for analytics and user behavior analysis
    userAgentIdx: index('audits_user_agent_idx').on(table.userAgent),

    // Index on ipAddress for security analysis and filtering
    ipAddressIdx: index('audits_ip_address_idx').on(table.ipAddress),
  }),
);

/**
 * Defines the relations between audits and users
 */
export const auditRelations = relations(audits, ({ one }) => ({
  user: one(users, {
    fields: [audits.userId],
    references: [users.id],
  }),
}));
