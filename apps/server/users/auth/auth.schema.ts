import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema';

/**
 * Schema for refresh token storage
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
}); 