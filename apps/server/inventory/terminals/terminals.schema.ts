import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cities } from '../cities/cities.schema';

export const terminals = pgTable(
  'terminals',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    contactphone: text('contactphone'),
    operatingHours: jsonb('operating_hours'),
    facilities: jsonb('facilities'),
    code: text('code').notNull().unique(),
    slug: text('slug').notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index().on(table.name), index().on(table.cityId)],
);

export const terminalsRelations = relations(terminals, ({ one }) => ({
  city: one(cities, {
    fields: [terminals.cityId],
    references: [cities.id],
  }),
}));
