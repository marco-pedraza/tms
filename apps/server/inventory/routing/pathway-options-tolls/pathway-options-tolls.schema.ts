import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import { pathwayOptions } from '@/inventory/routing/pathway-options/pathway-options.schema';

// Table: pathway_option_tolls
export const pathwayOptionTolls = pgTable(
  'pathway_option_tolls',
  {
    id: serial('id').primaryKey(),
    pathwayOptionId: integer('pathway_option_id')
      .notNull()
      .references(() => pathwayOptions.id),
    nodeId: integer('node_id')
      .notNull()
      .references(() => nodes.id),
    sequence: integer('sequence').notNull(),
    passTimeMin: integer('pass_time_min').notNull(),
    distance: integer('distance'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex()
      .on(table.pathwayOptionId, table.sequence)
      .where(isNull(table.deletedAt)),
    index().on(table.nodeId),
    index().on(table.pathwayOptionId),
    index().on(table.sequence),
    index().on(table.deletedAt),
  ],
);

// Relations
export const pathwayOptionTollsRelations = relations(
  pathwayOptionTolls,
  ({ one }) => ({
    option: one(pathwayOptions, {
      fields: [pathwayOptionTolls.pathwayOptionId],
      references: [pathwayOptions.id],
    }),
    toll: one(nodes, {
      fields: [pathwayOptionTolls.nodeId],
      references: [nodes.id],
    }),
  }),
);
