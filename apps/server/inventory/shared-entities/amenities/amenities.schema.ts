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
import { installations } from '@/inventory/locations/installations/installations.schema';

export const amenities = pgTable(
  'amenities',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    amenityType: text('amenity_type').notNull(),
    description: text('description'),
    iconName: text('icon_name'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.category),
    index().on(table.amenityType),
    index().on(table.active),
    index().on(table.deletedAt),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
  ],
);

export const installationAmenities = pgTable(
  'installation_amenities',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    installationId: integer('installation_id')
      .notNull()
      .references(() => installations.id),
    amenityId: integer('amenity_id')
      .notNull()
      .references(() => amenities.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index().on(table.amenityId),
    uniqueIndex().on(table.installationId, table.amenityId),
  ],
);

export const amenitiesRelations = relations(amenities, ({ many }) => ({
  installationAmenities: many(installationAmenities),
}));

export const installationAmenitiesRelations = relations(
  installationAmenities,
  ({ one }) => ({
    installation: one(installations, {
      fields: [installationAmenities.installationId],
      references: [installations.id],
    }),
    amenity: one(amenities, {
      fields: [installationAmenities.amenityId],
      references: [amenities.id],
    }),
  }),
);
