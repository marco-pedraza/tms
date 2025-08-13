import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { installationTypes } from '@/inventory/locations/installation-types/installation-types.schema';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';

export const eventTypes = pgTable(
  'event_types',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    baseTime: integer('base_time').notNull(),
    needsCost: boolean('needs_cost').notNull().default(false),
    needsQuantity: boolean('needs_quantity').notNull().default(false),
    integration: boolean('integration').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.name),
    index().on(table.active),
    index().on(table.deletedAt),
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
  ],
);

export const eventTypeInstallationTypes = pgTable(
  'event_type_installation_types',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    eventTypeId: bigint('event_type_id', { mode: 'number' })
      .notNull()
      .references(() => eventTypes.id, { onDelete: 'cascade' }),
    installationTypeId: integer('installation_type_id')
      .notNull()
      .references(() => installationTypes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index().on(table.eventTypeId),
    index().on(table.installationTypeId),
    uniqueIndex().on(table.eventTypeId, table.installationTypeId),
  ],
);

export const nodeEvents = pgTable(
  'node_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nodeId: integer('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    eventTypeId: bigint('event_type_id', { mode: 'number' })
      .notNull()
      .references(() => eventTypes.id, { onDelete: 'cascade' }),
    customTime: integer('custom_time'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index().on(table.nodeId), index().on(table.eventTypeId)],
);

export const eventTypesRelations = relations(eventTypes, ({ many }) => ({
  eventTypeInstallationTypes: many(eventTypeInstallationTypes),
  nodeEvents: many(nodeEvents),
}));

export const eventTypeInstallationTypesRelations = relations(
  eventTypeInstallationTypes,
  ({ one }) => ({
    eventType: one(eventTypes, {
      fields: [eventTypeInstallationTypes.eventTypeId],
      references: [eventTypes.id],
    }),
    installationType: one(installationTypes, {
      fields: [eventTypeInstallationTypes.installationTypeId],
      references: [installationTypes.id],
    }),
  }),
);

export const nodeEventsRelations = relations(nodeEvents, ({ one }) => ({
  node: one(nodes, {
    fields: [nodeEvents.nodeId],
    references: [nodes.id],
  }),
  eventType: one(eventTypes, {
    fields: [nodeEvents.eventTypeId],
    references: [eventTypes.id],
  }),
}));
