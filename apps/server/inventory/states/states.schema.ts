import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { countries } from '../countries/countries.schema';

export const states = pgTable(
  'states',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    code: text('code').notNull().unique(),
    countryId: integer('country_id')
      .notNull()
      .references(() => countries.id),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index().on(table.countryId)],
);

export const statesRelations = relations(states, ({ one }) => ({
  country: one(countries, {
    fields: [states.countryId],
    references: [countries.id],
  }),
}));
