import {
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { buses } from '@/inventory/fleet/buses/buses.schema';

export const technologies = pgTable(
  'technologies',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    provider: text('provider'),
    version: text('version'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.provider),
    index().on(table.version),
    index().on(table.active),
    index().on(table.deletedAt),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
  ],
);

export const busTechnologies = pgTable(
  'bus_technologies',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    busId: integer('bus_id')
      .notNull()
      .references(() => buses.id),
    technologyId: integer('technology_id')
      .notNull()
      .references(() => technologies.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index().on(table.technologyId),
    uniqueIndex().on(table.busId, table.technologyId),
  ],
);

export const busTechnologiesRelations = relations(
  busTechnologies,
  ({ one }) => ({
    bus: one(buses, {
      fields: [busTechnologies.busId],
      references: [buses.id],
    }),
    technology: one(technologies, {
      fields: [busTechnologies.technologyId],
      references: [technologies.id],
    }),
  }),
);
