import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema';

export const departments = pgTable(
  'departments',
  {
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
  },
  (table) => {
    return {
      // Add a composite unique constraint on code + tenantId
      codePerTenantIdx: uniqueIndex('departments_code_tenant_id_idx').on(
        table.code,
        table.tenantId,
      ),
    };
  },
);
