import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';
import { populationCities } from '../populations/populations.schema';
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
    slug: text('slug').notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.stateId),
    index().on(table.deletedAt),
    uniqueIndex().on(table.slug).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.name, table.stateId).where(isNull(table.deletedAt)),
  ],
);

export const citiesRelations = relations(cities, ({ one, many }) => ({
  state: one(states, {
    fields: [cities.stateId],
    references: [states.id],
  }),
  populationCities: many(populationCities),
}));
