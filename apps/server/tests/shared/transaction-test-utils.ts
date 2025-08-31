import type { TransactionalDB } from '@repo/base-repo';
import type { BaseRepository, TableWithId } from '@repo/base-repo';
import { db } from '@/inventory/db-service';

/**
 * Helper type to extract the transaction-scoped repository type
 */
type WithTransactionResult<T> = T extends {
  withTransaction: (tx: TransactionalDB) => infer R;
}
  ? R
  : never;

/**
 * Type for repository that can be scoped to a transaction
 * Uses the actual BaseRepository type for stronger typing
 */
export type TransactionalRepository<
  T = unknown,
  CreateT = unknown,
  UpdateT = unknown,
  TTable extends TableWithId = TableWithId,
> = BaseRepository<T, CreateT, UpdateT, TTable>;

/**
 * Type for test data factory function
 */
export type TestDataFactory<TData> = (tx: TransactionalDB) => Promise<TData>;

/**
 * Type for entity factory function
 */
export type EntityFactory<TEntity, TRepos = Record<string, unknown>> = (
  repos: TRepos,
) => TEntity;

/**
 * Executes a test function within a database transaction that automatically rolls back
 * This ensures test isolation by preventing any data from being committed to the database
 *
 * @param testFn - The test function to execute within the transaction
 * @returns The result of the test function
 *
 * @example
 * ```typescript
 * await runInTransaction(async (tx) => {
 *   const txRepo = someRepository.withTransaction(tx);
 *   const entity = await txRepo.create({ name: 'test' });
 *   expect(entity.name).toBe('test');
 * });
 * ```
 */
export async function runInTransaction<T>(
  testFn: (tx: TransactionalDB) => T | Promise<T>,
): Promise<T> {
  let testResult: T | undefined;

  try {
    await db.transaction(async (tx) => {
      // Execute the test function and capture its result
      testResult = await testFn(tx);

      // Force rollback by throwing an error
      // This prevents the transaction from committing
      throw new Error('ROLLBACK_FOR_TEST_ISOLATION');
    });
  } catch (error) {
    // If it's our intentional rollback error, return the test result
    if (
      error instanceof Error &&
      error.message === 'ROLLBACK_FOR_TEST_ISOLATION'
    ) {
      // For void functions, testResult will be undefined, which is expected
      return testResult as T;
    }
    // If it's any other error, rethrow it
    throw error;
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected execution path in runInTransaction');
}

/**
 * Creates transaction-scoped repositories for testing
 * This is a helper to reduce boilerplate when creating multiple repositories with the same transaction
 *
 * @param tx - The transaction to use
 * @param repositories - Object containing repository instances
 * @returns Object with the same keys but transaction-scoped repositories
 *
 * @example
 * ```typescript
 * await runInTransaction(async (tx) => {
 *   const { userRepo, postRepo } = withTransactionRepos(tx, {
 *     userRepo: userRepository,
 *     postRepo: postRepository
 *   });
 *
 *   const user = await userRepo.create({ name: 'test' });
 *   const post = await postRepo.create({ userId: user.id, title: 'test' });
 * });
 * ```
 */
export function withTransactionRepos<
  T extends Record<
    string,
    { withTransaction: (tx: TransactionalDB) => unknown }
  >,
>(
  tx: TransactionalDB,
  repositories: T,
): { [K in keyof T]: WithTransactionResult<T[K]> } {
  const result = {} as { [K in keyof T]: WithTransactionResult<T[K]> };

  for (const [key, repo] of Object.entries(repositories)) {
    if (repo && typeof repo.withTransaction === 'function') {
      (result as Record<string, unknown>)[key] = repo.withTransaction(tx);
    } else {
      throw new Error(`Repository ${key} does not have withTransaction method`);
    }
  }

  return result;
}

/**
 * Generic function to create entity with test data and repositories
 * This function provides strong typing and composability for test setup
 *
 * @param tx - The transaction to use
 * @param options - Configuration object
 * @returns Object with entity, test data, and repositories
 *
 * @example
 * ```typescript
 * interface PathwayTestData {
 *   nodeIds: number[];
 *   cityIds: number[];
 * }
 *
 * interface PathwayRepos {
 *   pathwayRepo: ...;
 *   nodeRepo: ...;
 * }
 *
 * const setup = await createEntityWithTestData<
 *   PathwayEntity,
 *   PathwayTestData,
 *   PathwayRepos
 * >(tx, {
 *   testDataFactory: async (tx) => ({ ... }),
 *   repositoryFactories: { ... },
 *   entityFactory: (repos) => createPathwayEntity(repos)
 * });
 * ```
 */
export async function createEntityWithTestData<
  TEntity,
  TTestData,
  TRepos extends Record<
    string,
    { withTransaction: (tx: TransactionalDB) => unknown }
  >,
>(
  tx: TransactionalDB,
  options: {
    testDataFactory: TestDataFactory<TTestData>;
    repositoryFactories: TRepos;
    entityFactory: EntityFactory<
      TEntity,
      { [K in keyof TRepos]: WithTransactionResult<TRepos[K]> }
    >;
  },
): Promise<{
  entity: TEntity;
  testData: TTestData;
  repositories: {
    [K in keyof TRepos]: WithTransactionResult<TRepos[K]>;
  };
}> {
  // Create test data
  const testData = await options.testDataFactory(tx);

  // Create transaction-scoped repositories
  const repositories = withTransactionRepos(tx, options.repositoryFactories);

  // Create entity with repositories
  const entity = options.entityFactory(repositories);

  return {
    entity,
    testData,
    repositories,
  };
}
