import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { isNull } from 'drizzle-orm';

export const serviceTypes = pgTable(
  'service_types',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.deletedAt),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
  ],
);
