import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';
import { permissions } from '../permissions/permissions.schema';
import { roles } from '../roles/roles.schema';
import { users } from '../users/users.schema';

/**
 * Schema for the user_roles junction table
 * Links users to their assigned roles
 */
export const userRoles = pgTable(
  'user_roles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index().on(table.userId, table.roleId), index().on(table.roleId)],
);

/**
 * Schema for the user_permissions junction table
 * Links users to their directly assigned permissions (independent of roles)
 */
export const userPermissions = pgTable(
  'user_permissions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index().on(table.userId, table.permissionId),
    index().on(table.permissionId),
  ],
);
