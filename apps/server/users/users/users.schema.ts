import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { audits } from '../audits/audits.schema';
import { departments } from '../departments/departments.schema';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    departmentId: integer('department_id')
      .notNull()
      .references(() => departments.id),
    username: text('username').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    position: text('position'),
    employeeId: text('employee_id'),
    mfaSettings: json('mfa_settings'),
    lastLogin: timestamp('last_login'),
    active: boolean('active').notNull().default(true),
    isSystemAdmin: boolean('is_system_admin').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.departmentId),
    index().on(table.firstName, table.lastName),
    index().on(table.employeeId),
    index().on(table.deletedAt),
    uniqueIndex().on(table.email).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.username).where(isNull(table.deletedAt)),
  ],
);

/**
 * Defines the relations for the users table
 */
export const userRelations = relations(users, ({ many }) => ({
  audits: many(audits),
}));
