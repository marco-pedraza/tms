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
import { cities } from '../cities/cities.schema';
import { installations } from '../installations/installations.schema';
import { populations } from '../populations/populations.schema';

export const nodes = pgTable(
  'nodes',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    radius: real('radius').notNull(),
    active: boolean('active').notNull().default(true),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    populationId: integer('population_id')
      .notNull()
      .references(() => populations.id),
    installationId: integer('installation_id').references(
      () => installations.id,
    ),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.name),
    index().on(table.cityId),
    index().on(table.populationId),
    index().on(table.deletedAt),
    uniqueIndex().on(table.installationId).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
  ],
);

export const nodesRelations = relations(nodes, ({ one }) => ({
  city: one(cities, {
    fields: [nodes.cityId],
    references: [cities.id],
  }),
  population: one(populations, {
    fields: [nodes.populationId],
    references: [populations.id],
  }),
  installation: one(installations, {
    fields: [nodes.installationId],
    references: [installations.id],
  }),
}));
