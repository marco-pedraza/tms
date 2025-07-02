import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { installationTypes } from '../installation-types/installation-types.schema';

export const installations = pgTable(
  'installations',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    description: text('description'),
    // TODO: Add notNull validation, for now we need to keep it optional
    installationTypeId: integer('installation_type_id').references(
      () => installationTypes.id,
    ),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [index().on(table.name), index().on(table.deletedAt)],
);

export const installationsRelations = relations(installations, ({ one }) => ({
  installationType: one(installationTypes, {
    fields: [installations.installationTypeId],
    references: [installationTypes.id],
  }),
}));
