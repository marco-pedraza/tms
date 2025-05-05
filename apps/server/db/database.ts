import { SQLDatabase } from 'encore.dev/storage/sqldb';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Define a database named 'inventory-db', using the database migrations
// in the "./migrations" folder. Encore automatically provisions,
// migrates, and connects to the database.
export const DB = new SQLDatabase('inventory-db', {
  migrations: {
    path: './migrations',
    source: 'drizzle',
  },
});

// Define return type for the drizzle client
export type DbReturnType = NodePgDatabase<typeof schema>;

// Function to initialize drizzle with the connection string
// This should be called from within a service
export function initDrizzle(sqlDb: SQLDatabase) {
  if (!sqlDb) {
    throw new Error('Database connection not available');
  }
  const db = drizzle(sqlDb.connectionString, { schema });
  return db;
}

// Don't initialize db here as connectionString should be accessed from within a service
