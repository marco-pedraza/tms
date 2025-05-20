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
  (table) => [
    index().on(table.userId),
    index().on(table.service),
    index().on(table.endpoint),
    index().on(table.ipAddress),
  ],
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
