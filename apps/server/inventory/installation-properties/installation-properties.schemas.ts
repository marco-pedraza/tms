import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { installationSchemas } from '../installation-schemas/installation-schemas.schema';
import { installations } from '../installations/installations.schema';

export const installationProperties = pgTable(
  'installation_properties',
  {
    id: serial('id').primaryKey(),
    value: text('value').notNull(),
    installationId: integer('installation_id')
      .notNull()
      .references(() => installations.id),
    installationSchemaId: integer('installation_schema_id')
      .notNull()
      .references(() => installationSchemas.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.installationId),
    index().on(table.installationSchemaId),
    index().on(table.deletedAt),
    uniqueIndex('installation_properties_installation_schema_unique_index')
      .on(table.installationId, table.installationSchemaId)
      .where(isNull(table.deletedAt)),
  ],
);

export const installationPropertiesRelations = relations(
  installationProperties,
  ({ one }) => ({
    installation: one(installations, {
      fields: [installationProperties.installationId],
      references: [installations.id],
    }),
    installationSchema: one(installationSchemas, {
      fields: [installationProperties.installationSchemaId],
      references: [installationSchemas.id],
    }),
  }),
);
