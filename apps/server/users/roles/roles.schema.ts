import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { permissions } from '../permissions/permissions.schema';

/**
 * Schema for the roles table
 * Represents roles that can be assigned to users and contain multiple permissions
 */
export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [uniqueIndex().on(table.name)],
);

/**
 * Schema for the role_permissions junction table
 * Links roles to their permissions
 */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: serial('id').primaryKey(),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index().on(table.roleId, table.permissionId)],
);
