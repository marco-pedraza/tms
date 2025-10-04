import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull } from 'drizzle-orm';
import { permissions } from '../permissions/permissions.schema';

/**
 * Schema for the roles table
 * Represents roles that can be assigned to users and contain multiple permissions
 */
export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
    index().on(table.deletedAt),
  ],
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
