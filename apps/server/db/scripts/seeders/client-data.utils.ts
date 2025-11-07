import { fakerES_MX as faker } from '@faker-js/faker';
import { accessSync } from 'fs';
import { join, normalize, resolve } from 'path';

/**
 * Sanitizes client code to prevent path traversal attacks
 * @param clientCode - Client identifier to sanitize
 * @returns Sanitized client code
 */
function sanitizeClientCode(clientCode: string): string {
  // Remove any path traversal attempts and invalid characters
  const sanitized = clientCode
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, and hyphen
    .toLowerCase()
    .trim();

  // Ensure it's not empty after sanitization
  if (!sanitized) {
    throw new Error(
      'Invalid client code: must contain only alphanumeric characters, underscores, and hyphens',
    );
  }

  return sanitized;
}

/**
 * Sanitizes file name to prevent path traversal attacks
 * @param fileName - File name to sanitize
 * @returns Sanitized file name
 */
function sanitizeFileName(fileName: string): string {
  // Remove any path traversal attempts and ensure it's a valid JSON file
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '') // Only allow alphanumeric, dots, underscores, and hyphens
    .toLowerCase()
    .trim();

  // Ensure it's a JSON file and not empty
  if (!sanitized?.endsWith('.json')) {
    throw new Error('Invalid file name: must be a valid JSON file name');
  }

  return sanitized;
}

/**
 * Gets the client data file path with security validation
 * @param clientCode - Client identifier
 * @param fileName - JSON file name
 */
export function getClientDataPath(
  clientCode: string,
  fileName: string,
): string {
  // Sanitize inputs to prevent path traversal attacks
  const sanitizedClientCode = sanitizeClientCode(clientCode);
  const sanitizedFileName = sanitizeFileName(fileName);

  // Use process.cwd() to get the working directory and build the correct path
  const workingDir = process.cwd();
  const seedersDir = join(workingDir, 'db', 'scripts', 'seeders');
  const clientDir = join(seedersDir, sanitizedClientCode);
  const fullPath = join(clientDir, sanitizedFileName);

  // Normalize and resolve the path to prevent traversal
  const normalizedPath = normalize(resolve(fullPath));
  const normalizedSeedersDir = normalize(resolve(seedersDir));

  // Ensure the resolved path is within the seeders directory
  if (!normalizedPath.startsWith(normalizedSeedersDir)) {
    throw new Error('Invalid path: file must be within the seeders directory');
  }

  return normalizedPath;
}

/**
 * Utility function to check if client data exists
 * @param clientCode - Client identifier
 * @param fileName - JSON file name to check
 */
export function hasClientData(clientCode: string, fileName: string): boolean {
  try {
    // getClientDataPath already includes sanitization and security validation
    const clientDataPath = getClientDataPath(clientCode, fileName);

    // Use fs.accessSync for secure file existence check
    accessSync(clientDataPath);
    return true;
  } catch {
    // If sanitization fails or file doesn't exist, return false
    return false;
  }
}

/**
 * Utility function to load client JSON data
 * @param clientCode - Client identifier
 * @param fileName - JSON file name to load
 */
export async function loadClientData(
  clientCode: string,
  fileName: string,
): Promise<unknown> {
  const clientDataPath = getClientDataPath(clientCode, fileName);

  // Use fs.promises for secure file operations (fully async)
  const fs = await import('fs');
  await fs.promises.access(clientDataPath).catch(() => {
    throw new Error(`Client data file not found: ${clientDataPath}`);
  });

  const fileContent = await fs.promises.readFile(clientDataPath, 'utf8');
  return JSON.parse(fileContent);
}

/**
 * Remove duplicates from an array based on any of the provided unique key functions (OR logic).
 * If any key is duplicated, the item is removed.
 */
export function removeDuplicatesByAnyKey<T>(
  array: T[],
  keyFns: ((item: T) => string | number)[],
): T[] {
  const seenSets = keyFns.map(() => new Set<string>());
  return array.filter((item) => {
    // Extract and validate keys once
    const normalizedKeys: string[] = [];
    for (let i = 0; i < keyFns.length; i++) {
      const key = keyFns[i](item);

      // Runtime guard: throw if key is null/undefined or object type
      if (key == null) {
        throw new Error(
          `Key function at index ${i} returned null/undefined for item`,
        );
      }
      if (typeof key === 'object') {
        throw new Error(
          `Key function at index ${i} returned object type - only string/number allowed`,
        );
      }

      // Normalize to string for consistent comparison
      const normalizedKey = String(key);
      normalizedKeys.push(normalizedKey);

      // Check for duplicates
      if (seenSets[i].has(normalizedKey)) return false;
    }

    // Add all keys to seen sets only after all checks pass
    for (let i = 0; i < normalizedKeys.length; i++) {
      seenSets[i].add(normalizedKeys[i]);
    }
    return true;
  });
}

/**
 * Client data file names constants
 */
export const CLIENT_DATA_FILES = {
  // Geography
  CITIES_BY_STATE: 'cities_by_state.json',
  CITIES_BY_POPULATION: 'cities_by_population.json',

  // Transportation
  TRANSPORTERS: 'transporters.json',
  BUS_LINES: 'bus-lines.json',

  // Infrastructure
  INSTALLATIONS: 'installations.json',
  NODES: 'nodes.json',

  // Planning
  ROLLING_PLANS: 'rolling-plans.json',

  // Routing
  PATHWAYS: 'pathways.json',

  // Users
  DEPARTMENTS: 'departments.json',
  ROLES: 'roles.json',
  USERS: 'users.json',
} as const;

export function generatePhone(): string {
  const areaCodes = ['55', '33', '81', '222', '442'];
  const areaCode = faker.helpers.arrayElement(areaCodes);
  const localLength = 10 - areaCode.length;
  const localNumber = faker.string.numeric(localLength);
  return `+52${areaCode}${localNumber}`;
}

export function generateEmail(): string {
  const domains = ['com.mx', 'gmail.com', 'hotmail.com'];
  const domain = faker.helpers.arrayElement(domains);
  return faker.internet.email({ provider: domain });
}
