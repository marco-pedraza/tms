import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

// Table with soft delete enabled for testing
export const softDeleteUsers = pgTable(
  'soft_delete_users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'), // Soft delete column
  },
  (table) => ({
    emailUnique: unique().on(table.email),
  }),
);

// Regular table without soft delete for comparison tests
export const regularUsers = pgTable(
  'regular_users',
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

// Posts table with soft delete and foreign key to soft delete users
export const softDeletePosts = pgTable('soft_delete_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  userId: integer('user_id')
    .references(() => softDeleteUsers.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete column
});

// Types for soft delete users
export type SoftDeleteUser = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateSoftDeleteUser = Omit<
  SoftDeleteUser,
  'id' | 'active' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  active?: boolean;
};

export type UpdateSoftDeleteUser = Partial<CreateSoftDeleteUser>;

// Types for regular users (without soft delete)
export type RegularUser = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

export type CreateRegularUser = Omit<RegularUser, 'id' | 'active'> & {
  active?: boolean;
};

export type UpdateRegularUser = Partial<CreateRegularUser>;

// Types for soft delete posts
export type SoftDeletePost = {
  id: number;
  title: string;
  content: string | null;
  userId: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type CreateSoftDeletePost = Omit<
  SoftDeletePost,
  'id' | 'createdAt' | 'deletedAt'
>;

export type UpdateSoftDeletePost = Partial<CreateSoftDeletePost>;
