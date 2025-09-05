import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { buses } from '@/inventory/fleet/buses/buses.schema';

export const chromatics = pgTable(
  'chromatics',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.deletedAt),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
  ],
);

/**
 * Relations for chromatics
 */
export const chromaticsRelations = relations(chromatics, ({ many }) => ({
  buses: many(buses),
}));
