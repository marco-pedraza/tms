import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { cities } from '@/inventory/locations/cities/cities.schema';

/**
 * Database table for transporters (transportation companies)
 */
export const transporters = pgTable(
  'transporters',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    legalName: text('legal_name'),
    address: text('address'),
    description: text('description'),
    website: text('website'),
    email: text('email'),
    phone: text('phone'),
    headquarterCityId: integer('headquarter_city_id').references(
      () => cities.id,
    ),
    logoUrl: text('logo_url'),
    contactInfo: text('contact_info'),
    licenseNumber: text('license_number'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.headquarterCityId),
    index().on(table.deletedAt),
    index().on(table.active).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
  ],
);

/**
 * Relations for the transporters table
 */
export const transportersRelations = relations(transporters, ({ one }) => ({
  headquarterCity: one(cities, {
    fields: [transporters.headquarterCityId],
    references: [cities.id],
  }),
}));
