import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const countries = pgTable(
  'countries',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    active: boolean('active').notNull().default(true),
    code: text('code').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [index().on(table.deletedAt)],
);
