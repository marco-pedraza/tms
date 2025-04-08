import { db } from './db';
import { users, posts } from '../schemas/test-tables';
import { sql } from 'drizzle-orm';

// Function to clean all tables between tests
export async function cleanDatabase(): Promise<void> {
  try {
    // Use TRUNCATE with RESTART IDENTITY to reset sequences
    await db.execute(
      sql`TRUNCATE TABLE ${posts}, ${users} RESTART IDENTITY CASCADE`,
    );
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

// Function to create the schema - useful for first-time setup
export async function createSchema(): Promise<void> {
  try {
    // Create test tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}
