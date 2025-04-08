import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';

// Simple table for testing the base repository
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    active: boolean('active').default(true),
  },
  (table) => ({
    emailUnique: unique().on(table.email),
  }),
);

// Posts table with a relationship to users
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
});

// Types for repository operations
export type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

export type CreateUser = Omit<User, 'id' | 'active'> & { active?: boolean };
export type UpdateUser = Partial<CreateUser>;

// Types for post repository operations
export type Post = {
  id: number;
  title: string;
  content: string | null;
  userId: number;
};

export type CreatePost = Omit<Post, 'id'>;
export type UpdatePost = Partial<CreatePost>;
