import {
  pgTable,
  serial,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { terminals } from '../terminals/terminals.schema';

export const gates = pgTable('gates', {
  id: serial('id').primaryKey(),
  terminalId: integer('terminal_id')
    .notNull()
    .references(() => terminals.id),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
