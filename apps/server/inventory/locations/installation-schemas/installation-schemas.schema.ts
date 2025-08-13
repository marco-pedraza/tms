import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { installationTypes } from '@/inventory/locations/installation-types/installation-types.schema';

export const installationSchemas = pgTable(
  'installation_schemas',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type').notNull(),
    options: jsonb('options').notNull().default({}),
    required: boolean('required').notNull().default(false),
    installationTypeId: integer('installation_type_id')
      .notNull()
      .references(() => installationTypes.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.installationTypeId),
    index().on(table.deletedAt),
    uniqueIndex()
      .on(table.name, table.installationTypeId)
      .where(isNull(table.deletedAt)),
  ],
);

export const installationSchemasRelations = relations(
  installationSchemas,
  ({ one }) => ({
    installationType: one(installationTypes, {
      fields: [installationSchemas.installationTypeId],
      references: [installationTypes.id],
    }),
  }),
);
