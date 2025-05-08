import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { permissions } from '../permissions/permissions.schema';

export const permissionGroups = pgTable('permission_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const permissionGroupRelations = relations(
  permissionGroups,
  ({ many }) => ({
    permissions: many(permissions),
  }),
);
