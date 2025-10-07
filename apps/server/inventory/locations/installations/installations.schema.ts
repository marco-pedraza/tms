import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { installationProperties } from '@/inventory/locations/installation-properties/installation-properties.schemas';
import { installationTypes } from '@/inventory/locations/installation-types/installation-types.schema';
import { installationAmenities } from '@/inventory/shared-entities/amenities/amenities.schema';

export const installations = pgTable(
  'installations',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    description: text('description'),
    contactPhone: text('contact_phone'),
    contactEmail: text('contact_email'),
    website: text('website'),
    // TODO: Add notNull validation, for now we need to keep it optional
    installationTypeId: integer('installation_type_id').references(
      () => installationTypes.id,
    ),
    operatingHours: jsonb('operating_hours'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [index().on(table.name), index().on(table.deletedAt)],
);

export const installationsRelations = relations(
  installations,
  ({ one, many }) => ({
    installationType: one(installationTypes, {
      fields: [installations.installationTypeId],
      references: [installationTypes.id],
    }),
    installationProperties: many(installationProperties),
    installationAmenities: many(installationAmenities),
  }),
);
