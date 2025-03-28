import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema';

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
