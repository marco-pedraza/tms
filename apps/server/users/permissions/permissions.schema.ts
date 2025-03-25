import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Schema for the permissions table
 * Represents individual permissions that can be assigned to roles or directly to users
 */
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
