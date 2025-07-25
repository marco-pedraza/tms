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

/**
 * Generates a unique ID for factories using timestamp, random, and optional sequence
 * to prevent collisions during rapid ID generation (e.g., seeding)
 * @param sequence - Optional sequence number from factory for additional uniqueness
 * @returns A unique numeric ID within PostgreSQL integer range (max 2,147,483,647)
 */
export function generateId(sequence?: number): number {
  // Get current timestamp and use only last 4 digits to keep it smaller
  const timestamp = Date.now();
  const timestampPart = timestamp % 10000; // Last 4 digits (0-9999)

  // Generate a random number between 10-99 (2 digits)
  const randomPart = Math.floor(Math.random() * 90) + 10;

  // Use sequence if provided (including 0), otherwise generate random sequence (up to 99)
  const sequencePart =
    sequence !== undefined ? sequence % 100 : Math.floor(Math.random() * 100);

  // Combine parts more conservatively: timestamp(4) + random(2) + sequence(2) = max 8 digits
  // This ensures we stay well under PostgreSQL's int4 max (2,147,483,647)
  const combined = timestampPart * 10000 + randomPart * 100 + sequencePart;

  // The combined value should now always be under the PostgreSQL limit
  // Max possible: 9999 * 10000 + 99 * 100 + 99 = 99,999,999 (well under 2.1B)

  // Ensure the result is always positive and at least 1
  return Math.max(combined, 1);
}

/**
 * Generates a unique alphabetic suffix using random letters
 * @param length - Length of the suffix (default 6 characters for better uniqueness)
 * @returns A unique random alphabetic suffix without numbers
 */
function generateAlphabeticSuffix(length: number = 6): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let suffix = '';

  // Generate truly random suffix
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    suffix += letters[randomIndex];
  }

  return suffix;
}

/**
 * Generates a unique alphabetic name by appending random letters to a base name
 * @param baseName - The base name (e.g., 'Country', 'City', 'User')
 * @returns A unique name with random alphabetic suffix
 */
export function generateAlphabeticName(baseName: string): string {
  const suffix = generateAlphabeticSuffix();
  return `${baseName} ${suffix}`;
}

/**
 * Generates a unique alphabetic code using random letters
 * @param length - Length of the code (default 6 characters for better uniqueness)
 * @param prefix - Optional prefix for the code
 * @returns A unique random alphabetic code without numbers
 */
export function generateAlphabeticCode(
  length: number = 6,
  prefix?: string,
): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';

  // Generate truly random code
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    code += letters[randomIndex];
  }

  return prefix ? `${prefix}${code}` : code;
}

/**
 * Creates a unique name for testing purposes
 * @param prefix - The prefix for the name (e.g., 'Test User', 'Sample Product')
 * @param uniqueId - A unique identifier to append
 * @returns A unique name combining prefix and uniqueId
 */
export function createUniqueName(prefix: string, uniqueId: string): string {
  return `${prefix} ${uniqueId}`;
}
