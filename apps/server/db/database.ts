import log from 'encore.dev/log';
import { SQLDatabase } from 'encore.dev/storage/sqldb';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { appMeta } from 'encore.dev';
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

  const environment = appMeta().environment.type; // 'local', 'development', 'production'
  const enableQueryLogs =
    process.env.ENABLE_DB_LOGS === 'true' && environment !== 'production';

  const db = drizzle(sqlDb.connectionString, {
    schema,
    logger: enableQueryLogs
      ? {
          logQuery: (query, params) => {
            const executableSQL = query
              .replace(/"([^"]+)"/g, '$1') // Remove double quotes from identifiers
              .trim();
            log.info(
              `query="${executableSQL}"`,
              params.length ? { params } : undefined,
            );
          },
        }
      : undefined,
  });
  return db;
}

// Don't initialize db here as connectionString should be accessed from within a service
