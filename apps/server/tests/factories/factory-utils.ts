import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Table } from 'drizzle-orm';

// We need to extract partial schemas because relations are not supported in the factory

export function extractTablesFromSchema(schema: Record<string, unknown>) {
  const tables: Record<string, Table> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (isTable(value) && !key.includes('Relations')) {
      tables[key] = value;
    }
  }

  return tables;
}

function isTable(value: unknown): value is Table {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getSQL' in value && // typical method in Drizzle tables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (value as any).getSQL === 'function'
  );
}

/**
 * Adapts the NodePgDatabase to be compatible with drizzle-factory
 * by creating a type-compatible version for factory usages
 * example:
 * const factoryDb = getFactoryDb(db);
 * await countryFactory(factoryDb).create();
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFactoryDb<T extends NodePgDatabase<any>>(database: T): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return database as any;
}
