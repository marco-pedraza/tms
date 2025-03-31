import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { permissions } from '../permissions/permissions.schema';

/**
 * Schema for the roles table
 * Represents roles that can be assigned to users and contain multiple permissions
 */
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Schema for the role_permissions junction table
 * Links roles to their permissions
 */
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});
