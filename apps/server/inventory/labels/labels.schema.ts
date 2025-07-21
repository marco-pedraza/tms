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
import { nodes } from '../nodes/nodes.schema';

export const labels = pgTable(
  'labels',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
    index().on(table.description),
    index().on(table.deletedAt),
  ],
);

export const labelNodes = pgTable(
  'label_nodes',
  {
    id: serial('id').primaryKey(),
    labelId: integer('label_id')
      .notNull()
      .references(() => labels.id),
    nodeId: integer('node_id')
      .notNull()
      .references(() => nodes.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex().on(table.labelId, table.nodeId),
    index().on(table.nodeId),
  ],
);

export const labelNodesRelations = relations(labelNodes, ({ one }) => ({
  label: one(labels, {
    fields: [labelNodes.labelId],
    references: [labels.id],
  }),
  node: one(nodes, {
    fields: [labelNodes.nodeId],
    references: [nodes.id],
  }),
}));
