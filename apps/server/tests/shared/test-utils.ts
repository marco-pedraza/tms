/**
 * Shared test utilities for creating unique identifiers and managing test data cleanup
 * to avoid race conditions in parallel test execution.
 */

/**
 * Creates a unique test suite identifier to avoid naming conflicts between parallel test suites
 * @param suiteName - The name of the test suite (e.g., 'states', 'cities')
 * @returns A unique identifier string combining suite name, timestamp, and random string
 */
export function createTestSuiteId(suiteName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 11);
  return `${suiteName}-${timestamp}-${randomString}`;
}

/**
 * Creates a unique name by appending the test suite ID to a base name
 * @param baseName - The base name for the entity (e.g., 'Test Country')
 * @param suiteId - The unique test suite identifier
 * @returns A unique name string
 */
export function createUniqueName(baseName: string, suiteId: string): string {
  return `${baseName} ${suiteId}`;
}

/**
 * Generates a unique code by combining a base code with random characters
 * @param baseCode - The base code (e.g., 'TC' for Test Country)
 * @param length - The length of the random suffix (default: 3)
 * @returns A unique code string
 */
export function createUniqueCode(baseCode: string, length: number = 3): string {
  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
  return `${baseCode}${randomSuffix}`;
}

/**
 * Interface for cleanup helper functions
 */
export interface CleanupHelper {
  /**
   * Tracks an entity ID for cleanup
   * @param id - The entity ID to track
   * @returns The same ID for chaining
   */
  track: (id: number) => number;

  /**
   * Safely cleans up an entity by ID, handling "not found" errors gracefully
   * @param id - The entity ID to clean up
   */
  cleanup: (id: number) => Promise<void>;

  /**
   * Cleans up all tracked entities
   */
  cleanupAll: () => Promise<void>;

  /**
   * Gets the list of currently tracked entity IDs
   */
  getTrackedIds: () => number[];
}

/**
 * Creates a cleanup helper for managing entity lifecycle in tests
 * @param deleteFunction - The function to call for deleting entities
 * @param _entityName - The name of the entity type for logging (optional, currently unused)
 * @returns A cleanup helper object
 */
export function createCleanupHelper<T>(
  deleteFunction: (params: { id: number }) => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _entityName?: string,
): CleanupHelper {
  const trackedIds: number[] = [];

  const track = (id: number): number => {
    if (!trackedIds.includes(id)) {
      trackedIds.push(id);
    }
    return id;
  };

  const cleanup = async (id: number): Promise<void> => {
    try {
      await deleteFunction({ id });
    } catch (error) {
      // Ignore "not found" and foreign key errors (expected during cleanup)
      const isNotFound =
        error instanceof Error && error.message.includes('not found');

      if (!isNotFound) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  Cleanup failed [ID: ${id}]: ${errorMsg}`);
      }
    }
    const index = trackedIds.indexOf(id);
    if (index > -1) {
      trackedIds.splice(index, 1);
    }
  };

  const cleanupAll = async (): Promise<void> => {
    // Create a copy of the array to avoid modification during iteration
    const idsToCleanup = [...trackedIds];
    for (const id of idsToCleanup) {
      await cleanup(id);
    }
  };

  const getTrackedIds = (): number[] => {
    return [...trackedIds];
  };

  return {
    track,
    cleanup,
    cleanupAll,
    getTrackedIds,
  };
}

/**
 * Options for creating test entities with unique identifiers
 */
export interface UniqueEntityOptions {
  /** The base name for the entity */
  baseName: string;
  /** The base code for the entity (optional) */
  baseCode?: string;
  /** The length of the random code suffix */
  codeLength?: number;
  /** The test suite ID for uniqueness */
  suiteId: string;
}

/**
 * Creates unique name and code for test entities
 * @param options - Configuration options for the unique entity
 * @returns An object with unique name and code (if baseCode provided)
 */
export function createUniqueEntity(options: UniqueEntityOptions): {
  name: string;
  code?: string;
} {
  const { baseName, baseCode, codeLength = 3, suiteId } = options;

  const result: { name: string; code?: string } = {
    name: createUniqueName(baseName, suiteId),
  };

  if (baseCode) {
    result.code = createUniqueCode(baseCode, codeLength);
  }

  return result;
}

/**
 * Utility for handling "not found" errors during cleanup gracefully
 * @param error - The error to check
 * @returns True if the error is a "not found" error that should be ignored
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('not found');
}

/**
 * Safe cleanup function that ignores "not found" errors
 * @param cleanupFn - The cleanup function to execute
 * @param entityName - The name of the entity for logging
 * @param entityId - The ID of the entity being cleaned up
 */
export async function safeCleanup(
  cleanupFn: () => Promise<void>,
  entityName: string,
  entityId?: number,
): Promise<void> {
  try {
    await cleanupFn();
  } catch (error) {
    if (!isNotFoundError(error)) {
      const idInfo = entityId ? ` (ID: ${entityId})` : '';
      console.log(`Error cleaning up ${entityName}${idInfo}:`, error);
    }
  }
}

/**
 * Safely finds or creates an entity, handling race conditions from parallel test execution
 * @param findFn - Function to find the entity
 * @param createFn - Function to create the entity if not found
 * @returns The found or created entity
 */
export async function findOrCreate<T>(
  findFn: () => Promise<T | undefined | null>,
  createFn: () => Promise<T>,
): Promise<T> {
  // First attempt to find
  let entity = await findFn();
  if (entity) {
    return entity;
  }

  // Try to create
  try {
    entity = await createFn();
    return entity;
  } catch (error) {
    // If creation failed (likely due to race condition), try finding again
    entity = await findFn();
    if (entity) {
      return entity;
    }
    // If still not found, re-throw the original error
    throw error;
  }
}
