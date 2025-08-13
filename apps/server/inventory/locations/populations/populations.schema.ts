import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';
import { cities } from '@/inventory/locations/cities/cities.schema';

export const populations = pgTable(
  'populations',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.name),
    index().on(table.deletedAt),
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
  ],
);

export const populationCities = pgTable(
  'population_cities',
  {
    id: serial('id').primaryKey(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    populationId: integer('population_id')
      .notNull()
      .references(() => populations.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [uniqueIndex().on(table.cityId)],
);

export const populationsRelations = relations(populations, ({ many }) => ({
  populationCities: many(populationCities),
}));

export const populationCitiesRelations = relations(
  populationCities,
  ({ one }) => ({
    city: one(cities, {
      fields: [populationCities.cityId],
      references: [cities.id],
    }),
    population: one(populations, {
      fields: [populationCities.populationId],
      references: [populations.id],
    }),
  }),
);
