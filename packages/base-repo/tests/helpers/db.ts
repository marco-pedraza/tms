import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Can be configured from environment variables for CI/CD
const pool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: Number(process.env.TEST_DB_PORT || 5433), // Use port 5433 to avoid conflicts with local instances
  database: process.env.TEST_DB_NAME || 'base_repo_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
});

// Export both the pool and drizzle instance
export const db: NodePgDatabase<Record<string, never>> = drizzle(pool);
export { pool };

// To close the connection after tests
export const closePool = async (): Promise<void> => {
  await pool.end();
};
