import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const installations = pgTable(
  'installations',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [index().on(table.name), index().on(table.deletedAt)],
);
