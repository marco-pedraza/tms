import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { audits } from '../audits/audits.schema';
import { departments } from '../departments/departments.schema';
import { tenants } from '../tenants/tenants.schema';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id')
      .notNull()
      .references(() => tenants.id),
    departmentId: integer('department_id')
      .notNull()
      .references(() => departments.id),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    position: text('position'),
    employeeId: text('employee_id'),
    mfaSettings: json('mfa_settings'),
    lastLogin: timestamp('last_login'),
    isActive: boolean('is_active').notNull().default(true),
    isSystemAdmin: boolean('is_system_admin').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index().on(table.tenantId),
    index().on(table.departmentId),
    index().on(table.firstName, table.lastName),
    index().on(table.employeeId),
  ],
);

/**
 * Defines the relations for the users table
 */
export const userRelations = relations(users, ({ many }) => ({
  audits: many(audits),
}));
