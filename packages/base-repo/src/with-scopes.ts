/**
 * @module WithScopes
 * @description A module providing scope functionality to BaseRepository
 *
 * @example
 * // Define scopes for users
 * const userScopes = {
 *   active: (qb) => qb.where(eq(users.active, true)),
 *   withName: (name: string) => (qb) => qb.where(eq(users.name, name)),
 * };
 *
 * // Create scoped repository
 * const userRepo = withScopes(baseUserRepo, userScopes);
 *
 * // Use scopes in queries
 * const activeUsers = await userRepo.scope('active').findAll();
 * const activeUsersByName = await userRepo
 *   .scope('active')
 *   .scope(['withName', 'John'])
 *   .findAll();
 */

/**
 * @note Type Safety with Drizzle ORM
 *
 * We use `any` in specific places when working with Drizzle query types. This is an intentional
 * exception to our no-any rule due to Drizzle's complex type system. Here's why:
 *
 * 1. Drizzle uses advanced TypeScript features like conditional types and recursive type definitions
 *    that make it challenging to properly type query builders and their methods.
 *
 * 2. The query builder methods (limit, offset, where) modify the query type in ways that are hard
 *    to express without making the code significantly more complex.
 *
 * 3. Drizzle's internal types are not designed to be extended or manipulated directly, making
 *    it difficult to maintain type safety when building custom abstractions.
 *
 * Alternative approaches we considered:
 * - Using specific Drizzle types (PgSelect, SQL): Led to complex type errors
 * - Creating our own type definitions: Required maintaining complex type definitions
 * - Using generics: Resulted in overly complex type constraints
 *
 * The current approach with selective use of `any` provides a balance between type safety
 * and code maintainability while ensuring runtime correctness through Drizzle's query builder.
 */

import {
  TableWithId,
  BaseRepository,
  ScopedRepository,
  ScopeFunction,
  ScopesConfig,
  ScopeParams,
  ScopeState,
  PaginationMeta,
  PaginationParams,
} from './types';
import { eq, and, count, type SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { createPaginationMeta, applyOrdering } from './query-utils';

/**
 * Error thrown when a scope is not found in the scopesConfig
 */
export class ScopeNotFoundError extends Error {
  constructor(scopeName: string) {
    const message = `Scope "${scopeName}" not found in scopesConfig`;
    super(message);
    this.name = 'ScopeNotFoundError';
    Object.setPrototypeOf(this, ScopeNotFoundError.prototype);
  }
}

/**
 * Enhances a BaseRepository with scope functionality
 */
export const withScopes = <
  T,
  CreateT,
  UpdateT extends Partial<CreateT>,
  TTable extends TableWithId,
>(
  baseRepository: BaseRepository<T, CreateT, UpdateT, TTable>,
  scopesConfig: ScopesConfig<TTable>,
): ScopedRepository<T, CreateT, UpdateT, TTable> => {
  const state: ScopeState<TTable> = {
    conditions: [],
  };

  const { __internal } = baseRepository;

  if (!__internal) {
    throw new Error('BaseRepository does not have __internal property');
  }

  const { db, table } = __internal;

  const processScopeParams = (scopeParams: ScopeParams): SQL<unknown> => {
    const [scopeName, ...params] = Array.isArray(scopeParams)
      ? scopeParams
      : [scopeParams];

    const scopeDefinition = scopesConfig[scopeName];
    if (!scopeDefinition) {
      throw new ScopeNotFoundError(scopeName);
    }

    if (typeof scopeDefinition === 'function' && params.length > 0) {
      const isScopeFactory = scopeDefinition.length > 0;

      if (isScopeFactory) {
        const scopeFn = (
          scopeDefinition as (...args: unknown[]) => ScopeFunction<TTable>
        )(...params);
        return scopeFn(table, db);
      }
    }

    return (scopeDefinition as ScopeFunction<TTable>)(table, db);
  };

  const clearConditions = (): void => {
    state.conditions = [];
  };

  const combineConditions = <Q>(
    query: Q,
    baseConditions: SQL<unknown>[],
  ): Q => {
    const allConditions = [...baseConditions, ...state.conditions];
    // @ts-expect-error - Drizzle query type complexity requires this cast
    return query.where(and(...allConditions)) as Q;
  };

  const scopedRepository: ScopedRepository<T, CreateT, UpdateT, TTable> = {
    ...baseRepository,

    scope(scopeParams: ScopeParams) {
      const condition = processScopeParams(scopeParams);
      state.conditions.push(condition);
      return scopedRepository;
    },

    async findOne(id: number): Promise<T> {
      try {
        let query = db.select().from(table);
        query = combineConditions(query, [eq(table.id, id)]);
        // @ts-expect-error - Drizzle query builder method typing
        query = query.limit(1);

        const [entity] = await query;

        if (!entity) {
          throw new Error(
            `Entity with id ${id} not found or does not match the applied scopes`,
          );
        }

        return entity as T;
      } finally {
        clearConditions();
      }
    },

    async findAll(options?: {
      orderBy?: Array<{ field: PgColumn; direction: 'asc' | 'desc' }>;
    }): Promise<T[]> {
      try {
        let query = db.select().from(table);
        query = combineConditions(query, []);
        query = applyOrdering(query, options?.orderBy);

        const entities = await query;
        return entities as T[];
      } finally {
        clearConditions();
      }
    },

    async findAllPaginated(params: PaginationParams = {}): Promise<{
      data: T[];
      pagination: PaginationMeta;
    }> {
      try {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        let countQuery = db.select({ count: count() }).from(table);
        countQuery = combineConditions(countQuery, []);
        const [countResult] = await countQuery;
        const totalCount = countResult?.count ?? 0;

        let dataQuery = db.select().from(table);
        dataQuery = combineConditions(dataQuery, []);
        // @ts-expect-error - Drizzle query builder method typing
        dataQuery = dataQuery.limit(pageSize).offset(offset);

        const data = await dataQuery;

        return {
          data: data as T[],
          pagination: createPaginationMeta(totalCount, page, pageSize),
        };
      } finally {
        clearConditions();
      }
    },

    async findAllBy(
      field: PgColumn,
      value: unknown,
      options?: {
        orderBy?: Array<{ field: PgColumn; direction: 'asc' | 'desc' }>;
      },
    ): Promise<T[]> {
      try {
        let query = db.select().from(table);
        query = combineConditions(query, [eq(field, value)]);
        query = applyOrdering(query, options?.orderBy);

        const entities = await query;
        return entities as T[];
      } finally {
        clearConditions();
      }
    },

    async findBy<K extends keyof T>(
      field: PgColumn,
      value: T[K],
    ): Promise<T | null> {
      try {
        let query = db.select().from(table);
        query = combineConditions(query, [eq(field, value)]);
        // @ts-expect-error - Drizzle query builder method typing
        query = query.limit(1);

        const result = await query;
        return result.length > 0 ? (result[0] as T) : null;
      } finally {
        clearConditions();
      }
    },

    async findByPaginated<K extends keyof T>(
      field: PgColumn,
      value: T[K],
      params: PaginationParams,
    ): Promise<{
      data: T[];
      pagination: PaginationMeta;
    }> {
      try {
        const page = Math.max(1, params.page || 1);
        const pageSize = params.pageSize || 10;
        const offset = (page - 1) * pageSize;

        let baseCountQuery = db.select({ count: count() }).from(table);
        let baseDataQuery = db.select().from(table);

        baseCountQuery = combineConditions(baseCountQuery, [eq(field, value)]);
        baseDataQuery = combineConditions(baseDataQuery, [eq(field, value)]);
        // @ts-expect-error - Drizzle query builder method typing
        baseDataQuery = baseDataQuery.limit(pageSize).offset(offset);

        const [countResult, data] = await Promise.all([
          baseCountQuery,
          baseDataQuery,
        ]);

        const totalCount = Number(countResult[0]?.count || 0);
        const pagination = createPaginationMeta(totalCount, page, pageSize);

        return {
          data: data as T[],
          pagination,
        };
      } finally {
        clearConditions();
      }
    },

    create: baseRepository.create,
    update: baseRepository.update,
    delete: baseRepository.delete,
    deleteAll: baseRepository.deleteAll,
    existsBy: baseRepository.existsBy,
    ...(baseRepository.validateUniqueness && {
      validateUniqueness: baseRepository.validateUniqueness,
    }),
    ...(baseRepository.validateRelationExists && {
      validateRelationExists: baseRepository.validateRelationExists,
    }),
    __internal: baseRepository.__internal,
  };

  return scopedRepository;
};
