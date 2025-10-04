import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { permissions } from '../permissions/permissions.schema';

export const permissionGroups = pgTable(
  'permission_groups',
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

export const permissionGroupRelations = relations(
  permissionGroups,
  ({ many }) => ({
    permissions: many(permissions),
  }),
);
