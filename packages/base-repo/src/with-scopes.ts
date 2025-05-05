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
  QueryOptions,
  Filters,
} from './types';
import { eq, and, count, type SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import {
  createPaginationMeta,
  applyOrdering,
  applySimpleFilters,
  applySearchConditions,
} from './query-utils';

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
export const withScopes = <T, CreateT, UpdateT, TTable extends TableWithId>(
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

  const { db, table, config } = __internal;

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

  // Versión mejorada para evitar sobrescritura de condiciones cuando se aplican filtros
  const combineConditionsWithFilters = <Q>(
    query: Q,
    baseConditions: SQL<unknown>[],
    options?: { filters?: Filters<T> },
  ): Q => {
    // Colectamos todas las condiciones (scope + base)
    const allConditions = [...baseConditions, ...state.conditions];

    // Si hay filtros, los convertimos en condiciones SQL directamente en vez de usar applySimpleFilters
    if (options?.filters && Object.keys(options.filters).length > 0) {
      const filterConditions = Object.entries(options.filters).map(
        ([field, value]) => {
          const column = (table as unknown as Record<string, PgColumn>)[field];
          if (!column) {
            throw new Error(
              `Invalid filter field: ${field}. Field does not exist in the table.`,
            );
          }
          return eq(column, value);
        },
      );

      // Agregar las condiciones de filtro a todas las condiciones
      allConditions.push(...filterConditions);
    }

    // Aplicar todas las condiciones en una sola llamada a .where() para evitar sobrescrituras
    // @ts-expect-error - Drizzle query type complexity requires this cast
    return query.where(and(...allConditions)) as Q;
  };

  async function search(searchTerm: string): Promise<T[]> {
    try {
      if (!config?.searchableFields) {
        throw new Error('Searchable fields not defined');
      }

      let query = db.select().from(table);
      query = applySearchConditions(query, searchTerm, config, table);
      query = combineConditions(query, []);

      const entities = await query;
      return entities as T[];
    } finally {
      clearConditions();
    }
  }

  async function searchPaginated(
    searchTerm: string,
    params: PaginationParams<T, TTable> = {},
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }> {
    try {
      if (!config?.searchableFields) {
        throw new Error('Searchable fields not defined');
      }

      const { page = 1, pageSize = 10, orderBy, filters } = params;
      const offset = (page - 1) * pageSize;

      // Count query
      let countQuery = db.select({ count: count() }).from(table);
      countQuery = applySearchConditions(
        countQuery,
        searchTerm,
        config,
        table,
        filters,
      );
      countQuery = combineConditions(countQuery, []);
      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;

      // Data query
      let dataQuery = db.select().from(table);
      dataQuery = applySearchConditions(
        dataQuery,
        searchTerm,
        config,
        table,
        filters,
      );
      dataQuery = combineConditions(dataQuery, []);
      dataQuery = applyOrdering(dataQuery, orderBy, table);
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
  }

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

    async findAll(options?: QueryOptions<T, TTable>): Promise<T[]> {
      try {
        let query = db.select().from(table);
        // Usamos el nuevo método que combina condiciones sin sobrescribir
        query = combineConditionsWithFilters(query, [], options);
        query = applyOrdering(query, options?.orderBy, table);

        const entities = await query;
        return entities as T[];
      } finally {
        clearConditions();
      }
    },

    async findAllPaginated(params: PaginationParams<T, TTable> = {}): Promise<{
      data: T[];
      pagination: PaginationMeta;
    }> {
      try {
        const { page = 1, pageSize = 10, orderBy, filters } = params;
        const offset = (page - 1) * pageSize;

        // Para la consulta de conteo
        let countQuery = db.select({ count: count() }).from(table);
        countQuery = combineConditionsWithFilters(countQuery, [], { filters });
        const [countResult] = await countQuery;
        const totalCount = countResult?.count ?? 0;

        // Para la consulta de datos
        let dataQuery = db.select().from(table);
        dataQuery = combineConditionsWithFilters(dataQuery, [], { filters });
        dataQuery = applyOrdering(dataQuery, orderBy, table);
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
      options?: QueryOptions<T, TTable>,
    ): Promise<T[]> {
      try {
        let query = db.select().from(table);
        // Combinamos la condición de campo con las condiciones de scope y filtros
        query = combineConditionsWithFilters(
          query,
          [eq(field, value)],
          options,
        );
        query = applyOrdering(query, options?.orderBy, table);

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
      params: PaginationParams<T, TTable> = {},
    ): Promise<{
      data: T[];
      pagination: PaginationMeta;
    }> {
      try {
        const { page = 1, pageSize = 10, orderBy, filters } = params;
        const offset = (page - 1) * pageSize;

        // Consulta de conteo con condiciones combinadas
        let countQuery = db.select({ count: count() }).from(table);
        countQuery = combineConditionsWithFilters(
          countQuery,
          [eq(field, value)],
          { filters },
        );
        const [countResult] = await countQuery;
        const totalCount = Number(countResult?.count || 0);

        // Consulta de datos con condiciones combinadas
        let dataQuery = db.select().from(table);
        dataQuery = combineConditionsWithFilters(
          dataQuery,
          [eq(field, value)],
          { filters },
        );
        dataQuery = applyOrdering(dataQuery, orderBy, table);
        // @ts-expect-error - Drizzle query builder method typing
        dataQuery = dataQuery.limit(pageSize).offset(offset);

        const data = await dataQuery;
        const pagination = createPaginationMeta(totalCount, page, pageSize);

        return {
          data: data as T[],
          pagination,
        };
      } finally {
        clearConditions();
      }
    },

    search,
    searchPaginated,

    create: (...args) => baseRepository.create(...args),
    update: (...args) => baseRepository.update(...args),
    delete: (...args) => baseRepository.delete(...args),
    deleteAll: (...args) => baseRepository.deleteAll(...args),
    existsBy: (...args) => baseRepository.existsBy(...args),
    ...(baseRepository.validateUniqueness && {
      validateUniqueness: (...args) => {
        if (!baseRepository.validateUniqueness) {
          throw new Error('validateUniqueness is not implemented');
        }
        return baseRepository.validateUniqueness(...args);
      },
    }),
    ...(baseRepository.validateRelationExists && {
      validateRelationExists: (...args) => {
        if (!baseRepository.validateRelationExists) {
          throw new Error('validateRelationExists is not implemented');
        }
        return baseRepository.validateRelationExists(...args);
      },
    }),
    transaction: <R>(
      callback: (
        txRepo: ScopedRepository<T, CreateT, UpdateT, TTable>,
      ) => Promise<R>,
    ): Promise<R> => {
      if (!baseRepository.transaction) {
        throw new Error('transaction is not implemented');
      }
      return baseRepository.transaction((txBaseRepo) => {
        const txScopedRepo = withScopes(txBaseRepo, scopesConfig);
        return callback(txScopedRepo);
      });
    },
    __internal: baseRepository.__internal,
  };

  return scopedRepository;
};
