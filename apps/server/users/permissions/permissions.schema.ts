import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { permissionGroups } from '../permission-groups/permission-groups.schema';
import { relations } from 'drizzle-orm';
/**
 * Schema for the permissions table
 * Represents individual permissions that can be assigned to roles or directly to users
 */
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  permissionGroupId: integer('permission_group_id').references(
    () => permissionGroups.id,
    { onDelete: 'restrict', onUpdate: 'cascade' },
  ),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const permissionRelations = relations(permissions, ({ one }) => ({
  permissionGroup: one(permissionGroups, {
    fields: [permissions.permissionGroupId],
    references: [permissionGroups.id],
  }),
}));
