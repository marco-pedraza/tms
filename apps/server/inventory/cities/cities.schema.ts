import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { states } from '../states/states.schema';

export const cities = pgTable(
  'cities',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    stateId: integer('state_id')
      .notNull()
      .references(() => states.id),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    timezone: text('timezone').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    slug: text('slug').notNull().unique(),
  },
  (table) => [index().on(table.name), index().on(table.stateId)],
);

export const citiesRelations = relations(cities, ({ one }) => ({
  state: one(states, {
    fields: [cities.stateId],
    references: [states.id],
  }),
}));
