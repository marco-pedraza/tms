import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { faker } from '@faker-js/faker';
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
// Generate a random base ID range for this test session
// This ensures different test runs use completely different ID ranges
const RANDOM_BASE = Math.floor(Math.random() * 1000000000) + 100000000; // 100M to 1.1B range

export function generateId(sequence?: number): number {
  // Get current timestamp for temporal uniqueness with higher precision
  const timestamp = Date.now();
  const timestampPart = timestamp % 100000; // Last 5 digits

  // Add microsecond precision with higher resolution
  const microTime = Math.floor(performance.now() * 10000) % 100000;

  // Generate random component with crypto-level randomness
  const randomPart = Math.floor(Math.random() * 100000);

  // Use sequence if provided, otherwise random
  const sequencePart =
    sequence !== undefined ? sequence % 1000 : Math.floor(Math.random() * 1000);

  // Add thread-like identifier using memory address simulation
  const threadId = Math.floor(Math.random() * 10000);

  // Combine all sources with better distribution
  const combined =
    RANDOM_BASE +
    (timestampPart % 10000) + // Reduced to make room for other components
    (microTime % 10000) +
    (randomPart % 10000) +
    (sequencePart % 1000) +
    (threadId % 1000);

  // Ensure we stay under PostgreSQL int4 max (2,147,483,647)
  return Math.min(combined, 2000000000);
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
export function generateAlphabeticName(
  baseName: string,
  length: number = 6,
): string {
  const suffix = generateAlphabeticSuffix(length);
  return `${baseName} ${suffix}`;
}

// Global counter to ensure uniqueness across all calls
let globalCounter = Math.floor(Math.random() * 100000); // Start with random counter

/**
 * Generates a unique alphabetic code using random letters with timestamp for uniqueness
 * @param length - Length of the code (default 6 characters for better uniqueness)
 * @param prefix - Optional prefix for the code
 * @returns A unique random alphabetic code without numbers
 */
export function generateAlphabeticCode(
  length: number = 6,
  prefix?: string,
): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // For short codes (like country/state codes), use session-based randomness
  if (length <= 3) {
    const timestamp = Date.now();
    const timestampSuffix = timestamp.toString().slice(-4);

    // Add microsecond-level randomness using performance.now()
    const microTime = Math.floor(performance.now() * 10000);

    // Increment global counter for guaranteed uniqueness within session
    globalCounter = (globalCounter + 1) % 100000;

    // Use the same random base concept but for letters
    // This ensures different test sessions use different letter ranges
    const sessionRandomOffset = RANDOM_BASE % 100000; // Reuse the numeric random base

    // Combine all sources of randomness
    const combinedSeed =
      parseInt(timestampSuffix) +
      microTime +
      globalCounter +
      sessionRandomOffset +
      Math.floor(Math.random() * 10000);

    // Convert to letters for alphabetic codes
    let code = '';
    let seedValue = combinedSeed;

    for (let i = 0; i < length; i++) {
      // Use different parts of the seed for each character position
      const charIndex = (seedValue + i * 997) % letters.length; // 997 is a prime number for better distribution
      code += letters[charIndex];
      seedValue = Math.floor(seedValue / 26) + charIndex * 37; // Shift for next iteration
    }

    return prefix ? `${prefix}${code}` : code;
  }

  // For longer codes, use improved random approach with better distribution
  let code = '';
  const baseTime = Date.now();

  for (let i = 0; i < length; i++) {
    // Mix timestamp, index, and random for better distribution
    const seedValue =
      (baseTime + i * 37 + Math.random() * 1000) % letters.length;
    const randomIndex = Math.floor(seedValue);
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

/**
 * Generates a phone number in E.164 format: +<countryCode><digits>
 * Ensures only numeric digits after the plus sign.
 *
 * @param countryCode - Numeric country code without the plus sign (e.g., '52' for Mexico)
 * @param nationalNumberLength - Number of digits for the national number part
 * @returns Phone number string in E.164 format
 */
export function generateE164Phone(
  countryCode: string,
  nationalNumberLength: number = 10,
): string {
  // First digit 1-9 to avoid leading zero
  const first = faker.number.int({ min: 1, max: 9 }).toString();
  const rest = Array.from(
    { length: Math.max(nationalNumberLength - 1, 0) },
    () => faker.number.int({ min: 0, max: 9 }).toString(),
  ).join('');
  const digits = `${first}${rest}`;
  return `+${countryCode}${digits}`;
}
