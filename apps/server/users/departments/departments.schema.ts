import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../users/users.schema';

export const departments = pgTable(
  'departments',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [uniqueIndex().on(table.code), index().on(table.name)],
);

/**
 * Defines the relations for the departments table
 */
export const departmentRelations = relations(departments, ({ many }) => ({
  users: many(users),
}));
