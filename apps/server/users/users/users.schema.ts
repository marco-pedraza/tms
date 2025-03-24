import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  serial,
  integer,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull(),
  departmentId: integer('department_id').notNull(),
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
});
