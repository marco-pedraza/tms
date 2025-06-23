/**
 * @module BaseRepository
 * @description A module providing generic CRUD operations and utility functions for database entities
 */

import { NotFoundError } from './errors';
import { eq, and, count, not, or, SQL, inArray } from 'drizzle-orm';
import type {
  PaginationMeta,
  TableWithId,
  UniqueFieldConfig,
  BaseRepository,
  TransactionalDB,
  DrizzleDB,
  QueryOptions,
  PaginationParams,
  RepositoryConfig,
} from './types';
import { PgColumn } from 'drizzle-orm/pg-core';
import {
  handlePostgresError,
  isApplicationError,
} from './postgres-error-handler';
import {
  createPaginationMeta,
  applyOrdering,
  applySimpleFilters,
  applySearchConditions,
  createSearchConditions,
  createFilterConditions,
  createOrderByExpressions,
} from './query-utils';

/**
 * Creates a base repository with CRUD operations for a database entity
 * @template T - The type of the entity
 * @template CreateT - The type for creating a new entity
 * @template UpdateT - The type for updating an existing entity
 * @template TTable - The type of the database table
 * @param {TransactionalDB} db - The database connection
 * @param {TTable} table - The database table for the entity
 * @param {string} entityName - The name of the entity for error messages
 * @param {RepositoryConfig} [config] - Configuration options for the repository
 * @returns {Object} An object containing CRUD and utility functions for the entity
 */
export const createBaseRepository = <
  T,
  CreateT,
  UpdateT,
  TTable extends TableWithId,
>(
  db: TransactionalDB,
  table: TTable,
  entityName: string,
  config?: RepositoryConfig,
): BaseRepository<T, CreateT, UpdateT, TTable> => {
  type TableInsert = TTable extends { $inferInsert: infer U } ? U : never;

  /**
   * Finds an entity by its ID
   * @param {number} id - The ID of the entity to find
   * @throws {NotFoundError} If the entity is not found
   * @returns {Promise<T>} The found entity
   */
  const findOne = async (id: number): Promise<T> => {
    try {
      const query = db.select().from(table);
      const finalQuery = query.where(eq(table.id, id)).limit(1);
      const [entity] = await finalQuery;

      if (!entity) {
        throw new NotFoundError(`${entityName} with id ${id} not found`);
      }

      return entity as T;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw handlePostgresError(error, entityName, 'find');
    }
  };

  /**
   * Retrieves all entities from the table with optional filters and ordering
   * @param {QueryOptions<T>} options - Additional options for the query
   * @param {Record<string, unknown>} [options.filters] - Simple equality filters to apply
   * @param {Array<{field: PgColumn; direction: 'asc' | 'desc'}>} [options.orderBy] - Fields to order by
   * @returns {Promise<T[]>} Array of all entities
   */
  const findAll = async (options?: QueryOptions<T, TTable>): Promise<T[]> => {
    try {
      let query = db.select().from(table);
      query = applySimpleFilters(query, table, options?.filters);
      query = applyOrdering(query, options?.orderBy, table);

      const entities = await query;
      return entities as T[];
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findAll');
    }
  };

  /**
   * Retrieves all entities filtered by a specific field value and optional filters
   * @param {PgColumn} field - The field to filter by
   * @param {unknown} value - The value to filter for
   * @param {QueryOptions<T>} options - Additional options for the query
   * @param {Record<string, unknown>} [options.filters] - Simple equality filters to apply
   * @param {Array<{field: PgColumn; direction: 'asc' | 'desc'}>} [options.orderBy] - Fields to order by
   * @returns {Promise<T[]>} Array of filtered entities
   */
  const findAllBy = async (
    field: PgColumn,
    value: unknown,
    options?: QueryOptions<T, TTable>,
  ): Promise<T[]> => {
    try {
      let query = db.select().from(table);
      // @ts-expect-error - Drizzle query builder method typing
      query = query.where(eq(field, value));
      query = applySimpleFilters(query, table, options?.filters);
      query = applyOrdering(query, options?.orderBy, table);

      const entities = await query;
      return entities as T[];
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findAllBy');
    }
  };

  /**
   * Retrieves entities with pagination, optional filters, and ordering
   * @param {PaginationParams & { filters?: Record<string, unknown> }} query - Pagination, filters, and ordering parameters
   * @returns {Promise<Object>} Paginated results with data and pagination metadata
   */
  const findAllPaginated = async (
    query?: PaginationParams<T, TTable>,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }> => {
    try {
      const { page = 1, pageSize = 10, orderBy, filters } = query ?? {};
      const offset = (page - 1) * pageSize;

      const countQuery = db.select({ count: count() }).from(table);
      const finalCountQuery = applySimpleFilters(countQuery, table, filters);
      const [countResult] = await finalCountQuery;
      const totalCount = countResult?.count ?? 0;

      let dataQuery = db.select().from(table);
      dataQuery = applySimpleFilters(dataQuery, table, filters);
      dataQuery = applyOrdering(dataQuery, orderBy, table);
      const finalDataQuery = dataQuery.limit(pageSize).offset(offset);
      const data = await finalDataQuery;

      return {
        data: data as T[],
        pagination: createPaginationMeta(totalCount, page, pageSize),
      };
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findAllPaginated');
    }
  };

  /**
   * Creates a new entity
   * @param {CreateT} data - The data to create the entity with
   * @throws {ValidationError} If the creation fails
   * @returns {Promise<T>} The created entity
   */
  const create = async (data: CreateT): Promise<T> => {
    try {
      const [entity] = await db
        .insert(table)
        .values(data as TableInsert)
        .returning();
      return entity as T;
    } catch (error) {
      if (error instanceof Error && isApplicationError(error)) {
        throw error; // Rethrow application errors
      }
      throw handlePostgresError(error, entityName, 'create');
    }
  };

  /**
   * Updates an existing entity
   * @param {number} id - The ID of the entity to update
   * @param {UpdateT} data - The data to update the entity with
   * @throws {NotFoundError} If the entity is not found
   * @returns {Promise<T>} The updated entity
   */
  const update = async (id: number, data: UpdateT): Promise<T> => {
    try {
      // Verificar existencia
      await findOne(id);

      const [entity] = (await db
        .update(table)
        .set(data as TableInsert)
        .where(eq(table.id, id))
        .returning()) as Array<Record<string, unknown>>;

      return entity as T;
    } catch (error) {
      if (error instanceof Error && isApplicationError(error)) {
        throw error; // Rethrow application errors
      }
      throw handlePostgresError(error, entityName, 'update');
    }
  };

  /**
   * Deletes an entity by ID
   * @param {number} id - The ID of the entity to delete
   * @throws {NotFoundError} If the entity is not found
   * @returns {Promise<T>} The deleted entity
   */
  const deleteOne = async (id: number): Promise<T> => {
    try {
      await findOne(id);

      const [entity] = await db
        .delete(table)
        .where(eq(table.id, id))
        .returning();

      return entity as T;
    } catch (error) {
      if (error instanceof Error && isApplicationError(error)) {
        throw error; // Rethrow application errors
      }
      throw handlePostgresError(error, entityName, 'delete');
    }
  };

  /**
   * Deletes all records from the table
   * @returns {Promise<number>} The number of records deleted
   */
  const deleteAll = async (): Promise<number> => {
    try {
      const result = await db.delete(table).returning();
      return result.length;
    } catch (error) {
      throw handlePostgresError(error, entityName, 'deleteAll');
    }
  };

  /**
   * Deletes multiple entities by their IDs in a single database operation
   * @param {number[]} ids - Array of entity IDs to delete
   * @returns {Promise<T[]>} Array of deleted entities
   * @throws {NotFoundError} If any of the IDs are invalid or not found
   */
  const deleteMany = async (ids: number[]): Promise<T[]> => {
    if (ids.length === 0) {
      return [];
    }

    try {
      // First, verify all entities exist before attempting to delete any
      const existingEntities = await db
        .select()
        .from(table)
        .where(inArray(table.id, ids));

      if (existingEntities.length !== ids.length) {
        const existingIds = (
          existingEntities as unknown as { id: number }[]
        ).map((entity) => entity.id);
        const notFoundIds = ids.filter((id) => !existingIds.includes(id));
        throw new NotFoundError(
          `${entityName}(s) with id(s) ${notFoundIds.join(', ')} not found`,
        );
      }

      // All entities exist, now delete them
      const result = await db
        .delete(table)
        .where(inArray(table.id, ids))
        .returning();

      return result as unknown as T[];
    } catch (error) {
      if (error instanceof Error && isApplicationError(error)) {
        throw error; // Rethrow application errors
      }
      throw handlePostgresError(error, entityName, 'deleteMany');
    }
  };

  /**
   * Finds an entity by a specific field value
   * @template K - The type of the field key
   * @template V - The type of the field value
   * @param {TTable['columns'][K]} field - The field to search by
   * @param {V} value - The value to search for
   * @returns {Promise<T | null>} The found entity or null if not found
   */
  const findBy = async (field: PgColumn, value: unknown): Promise<T | null> => {
    try {
      const query = db.select().from(table);
      const [entity] = await query.where(eq(field, value)).limit(1);
      return entity ? (entity as T) : null;
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findBy');
    }
  };

  /**
   * Finds entities by a specific field value with pagination and optional filters and ordering
   * @param {PgColumn} field - The field to search by
   * @param {unknown} value - The value to search for
   * @param {PaginationParams & { filters?: Record<string, unknown> }} query - Pagination, filters, and ordering parameters
   * @returns {Promise<Object>} Paginated results with data and pagination metadata
   */
  const findByPaginated = async (
    field: PgColumn,
    value: unknown,
    query?: PaginationParams<T, TTable>,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }> => {
    try {
      const { page = 1, pageSize = 10, orderBy, filters } = query ?? {};
      const offset = (page - 1) * pageSize;

      // Prepare base conditions including the main field condition
      const baseConditions = [eq(field, value)];

      // Add filter conditions if there are any
      if (filters && Object.keys(filters).length > 0) {
        const filterConditions = Object.entries(filters).map(
          ([filterField, filterValue]) => {
            const column = (table as unknown as Record<string, PgColumn>)[
              filterField
            ];
            if (!column) {
              throw new Error(
                `Invalid filter field: ${filterField}. Field does not exist in the table.`,
              );
            }
            return eq(column, filterValue);
          },
        );

        baseConditions.push(...filterConditions);
      }

      // For count query, apply all conditions at once
      const countQuery = db
        .select({ count: count() })
        .from(table)
        .where(and(...baseConditions));

      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;

      // For data query, apply all conditions at once
      let dataQuery = db
        .select()
        .from(table)
        .where(and(...baseConditions));

      dataQuery = applyOrdering(dataQuery, orderBy, table);
      const finalDataQuery = dataQuery.limit(pageSize).offset(offset);
      const data = await finalDataQuery;

      return {
        data: data as T[],
        pagination: createPaginationMeta(totalCount, page, pageSize),
      };
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findByPaginated');
    }
  };

  /**
   * Checks if an entity exists with a specific field value
   * @template K - The type of the field key
   * @template V - The type of the field value
   * @param {TTable['columns'][K]} field - The field to check
   * @param {V} value - The value to check for
   * @param {number} [excludeId] - Optional ID to exclude from the check
   * @returns {Promise<boolean>} True if an entity exists with the field value
   */
  const existsBy = async (
    field: PgColumn,
    value: unknown,
    excludeId?: number,
  ): Promise<boolean> => {
    try {
      const query = excludeId
        ? and(eq(field, value), not(eq(table.id, excludeId)))
        : eq(field, value);

      const result = await db
        .select({ count: count() })
        .from(table)
        .where(query);

      return Number(result[0]?.count ?? 0) > 0;
    } catch (error) {
      throw handlePostgresError(error, entityName, 'existsBy');
    }
  };

  /**
   * Counts entities in the table with optional filters
   * @param {QueryOptions<T>} options - Additional options for the query
   * @param {Record<string, unknown>} [options.filters] - Simple equality filters to apply
   * @returns {Promise<number>} The count of entities matching the filters
   */
  const countAll = async (
    options?: QueryOptions<T, TTable>,
  ): Promise<number> => {
    try {
      let countQuery = db.select({ count: count() }).from(table);
      countQuery = applySimpleFilters(countQuery, table, options?.filters);
      const [countResult] = await countQuery;
      return Number(countResult?.count ?? 0);
    } catch (error) {
      throw handlePostgresError(error, entityName, 'countAll');
    }
  };

  /**
   * Checks for uniqueness conflicts in a set of fields
   * @param {UniqueFieldConfig<TTable>[]} fields - Array of field configurations to check
   * @param {number} [excludeId] - Optional ID to exclude from the check
   * @returns {Promise<{ field: string; value: unknown }[]>} Array of conflicts found
   */
  const checkUniqueness = async (
    fields: UniqueFieldConfig<TTable>[],
    excludeId?: number,
  ): Promise<{ field: string; value: unknown }[]> => {
    try {
      const conditions = fields.map(({ field, value, scope }) => {
        const fieldCondition = eq(field, value);
        return scope
          ? and(fieldCondition, eq(scope.field, scope.value))
          : fieldCondition;
      });

      const query = excludeId
        ? and(or(...conditions), not(eq(table.id, excludeId)))
        : or(...conditions);

      const [existing] = await db.select().from(table).where(query).limit(1);

      if (!existing) {
        return [];
      }

      const conflicts = [];
      for (const f of fields) {
        if (existing[f.field.name] === f.value) {
          conflicts.push({ field: f.field.name, value: f.value });
        }
      }

      return conflicts;
    } catch (error) {
      throw handlePostgresError(error, entityName, 'checkUniqueness');
    }
  };

  /**
   * Validates that a related entity exists
   * @param {TableWithId} relatedTable - The related table to check
   * @param {number} relationId - The ID of the related entity
   * @param {string} relationName - The name of the related entity
   * @throws {NotFoundError} If the related entity is not found
   * @returns {Promise<void>}
   */
  const validateRelationExists = async (
    relatedTable: TableWithId,
    relationId: number,
    relationName: string = 'Related entity',
  ): Promise<void> => {
    try {
      const [entity] = await db
        .select()
        .from(relatedTable)
        .where(eq(relatedTable.id, relationId))
        .limit(1);

      if (!entity) {
        throw new NotFoundError(
          `${relationName} with id ${relationId} not found`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw handlePostgresError(error, relationName, 'validateRelation');
    }
  };

  /**
   * Executes operations within a database transaction
   * @template R - The return type of the transaction callback
   * @param {Function} callback - Function to execute within the transaction.
   * It receives a transaction-scoped repository (`txRepo`) and the Drizzle transaction object (`tx`).
   * @param {BaseRepository<T, CreateT, UpdateT, TTable>} callback.txRepo - Transaction-scoped repository passed to the callback.
   * @param {TransactionalDB} callback.tx - The Drizzle transaction object, which can be used to create other transaction-scoped repositories using their `withTransaction` method.
   * @returns {Promise<R>} Result of the transaction
   * @description
   * Creates a new transaction. It passes a transaction-scoped version of the current repository (`txRepo`)
   * and the raw Drizzle transaction object (`tx`) to the callback.
   * All operations performed using `txRepo` or other repositories created with `tx` will be atomic -
   * they will either all succeed or all fail together.
   *
   * @example
   * ```ts
   * // Assuming `userRepository` and `profileRepository` are instances of BaseRepository
   * await userRepository.transaction(async (txUserRepo, tx) => {
   *   const profileTxRepo = profileRepository.withTransaction(tx);
   *
   *   const user = await txUserRepo.create({ name: 'Alice' });
   *   await profileTxRepo.create({ userId: user.id, bio: 'Loves wonderland' });
   *
   *   return user;
   * });
   * ```
   */
  const transaction = <R>(
    callback: (
      txRepo: BaseRepository<T, CreateT, UpdateT, TTable>,
      tx: TransactionalDB,
    ) => Promise<R>,
  ): Promise<R> => {
    return (db as DrizzleDB).transaction((tx: TransactionalDB) => {
      const txRepository = createBaseRepository<T, CreateT, UpdateT, TTable>(
        tx,
        table,
        entityName,
        config,
      );
      return callback(txRepository, tx);
    }) as Promise<R>;
  };

  /**
   * Searches for entities by matching a search term against configured searchable fields
   * @param {string} term - The search term to match against searchable fields
   * @throws {Error} If no searchable fields are configured for the repository
   * @returns {Promise<T[]>} Array of entities matching the search term
   */
  const search = async (term: string): Promise<T[]> => {
    if (!config?.searchableFields) {
      throw new Error(`Searchable fields not defined for ${entityName}`);
    }

    try {
      let query = db.select().from(table);
      query = applySearchConditions(query, term, config, table);
      const entities = await query;
      return entities as T[];
    } catch (error) {
      throw handlePostgresError(error, entityName, 'search');
    }
  };

  /**
   * Searches for entities by matching a search term against configured searchable fields with pagination
   * @param {string} term - The search term to match against searchable fields
   * @param {PaginationParams} query - Pagination, filters, and ordering parameters
   * @throws {Error} If no searchable fields are configured for the repository
   * @returns {Promise<PaginatedResult<T>>} Paginated search results with data and pagination metadata
   */
  const searchPaginated = async (
    term: string,
    query?: PaginationParams<T, TTable>,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }> => {
    if (!config?.searchableFields) {
      throw new Error(`Searchable fields not defined for ${entityName}`);
    }

    const { page = 1, pageSize = 10, orderBy, filters } = query ?? {};
    const offset = (page - 1) * pageSize;

    try {
      // Count total results matching the search term and filters
      let countQuery = db.select({ count: count() }).from(table);
      countQuery = applySearchConditions(
        countQuery,
        term,
        config,
        table,
        filters,
      );
      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;

      // Build the data query with search conditions and filters
      let dataQuery = db.select().from(table);
      dataQuery = applySearchConditions(
        dataQuery,
        term,
        config,
        table,
        filters,
      );

      // Apply ordering and pagination
      dataQuery = applyOrdering(dataQuery, orderBy, table);
      const finalDataQuery = dataQuery.limit(pageSize).offset(offset);
      const data = await finalDataQuery;

      return {
        data: data as T[],
        pagination: createPaginationMeta(totalCount, page, pageSize),
      };
    } catch (error) {
      throw handlePostgresError(error, entityName, 'searchPaginated');
    }
  };

  /**
   * Builds query conditions and ordering without executing the query
   * @param {QueryOptions<T, TTable> & { searchTerm?: string }} params - Parameters for building the query
   * @returns {{ baseWhere?: SQL, baseOrderBy?: SQL[] }} SQL expressions for where conditions and ordering
   *
   * @description
   * This method exposes the internal query building logic used by methods like findAll and
   * searchPaginated, allowing it to be reused in custom queries that may include relations
   * or other complex structures.
   *
   * @example
   * ```ts
   * const { baseWhere, baseOrderBy } = userRepo.buildQuery({
   *   filters: { isActive: true },
   *   searchTerm: 'john',
   *   orderBy: [{ field: 'createdAt', direction: 'desc' }]
   * });
   *
   * const results = await db.query.users.findMany({
   *   where: baseWhere,
   *   orderBy: baseOrderBy,
   *   with: { profile: true }
   * });
   * ```
   */
  const buildQueryExpressions = (
    params?: QueryOptions<T, TTable> & { searchTerm?: string },
  ): {
    baseWhere?: SQL;
    baseOrderBy?: SQL[];
  } => {
    try {
      const { filters, orderBy, searchTerm } = params ?? {};
      let baseWhere: SQL | undefined;

      // Validate that searchable fields are configured when searchTerm is provided
      if (
        searchTerm &&
        (!config?.searchableFields || config.searchableFields.length === 0)
      ) {
        throw new Error(`Searchable fields not defined for ${entityName}`);
      }

      // Generate SQL conditions from utility functions
      if (searchTerm && config?.searchableFields?.length) {
        // If we have a search term, use the search conditions (which can include filters)
        baseWhere = createSearchConditions(searchTerm, config, table, filters);
      } else if (filters && Object.keys(filters).length > 0) {
        // If we only have filters, use the filter conditions
        baseWhere = createFilterConditions(table, filters);
      }

      // Generate order by expressions if needed
      const baseOrderBy = orderBy?.length
        ? createOrderByExpressions(orderBy, table)
        : undefined;

      return {
        baseWhere,
        baseOrderBy,
      };
    } catch (error) {
      throw handlePostgresError(error, entityName, 'buildQuery');
    }
  };

  /**
   * Creates a new repository instance that operates within the context of an existing transaction.
   *
   * @param {TransactionalDB} tx - The Drizzle transaction object to use.
   * @returns {BaseRepository<T, CreateT, UpdateT, TTable>} A new repository instance bound to the provided transaction.
   * @description
   * This method allows sharing a single database transaction across multiple repository instances.
   * Operations performed with the returned repository will be part of the transaction `tx`.
   *
   * @example
   * ```ts
   * // Assuming `userRepository` and `postRepository` are instances of BaseRepository
   * await userRepository.transaction(async (txUserRepo, tx) => {
   *   // Create a transaction-scoped postRepository
   *   const txPostRepo = postRepository.withTransaction(tx);
   *
   *   const newUser = await txUserRepo.create({ name: 'Bob' });
   *   await txPostRepo.create({ userId: newUser.id, title: 'My First Post' });
   * });
   * ```
   */
  const withTransaction = (
    tx: TransactionalDB,
  ): BaseRepository<T, CreateT, UpdateT, TTable> =>
    createBaseRepository<T, CreateT, UpdateT, TTable>(
      tx,
      table,
      entityName,
      config,
    );

  const repository: BaseRepository<T, CreateT, UpdateT, TTable> = {
    findOne,
    findAll,
    findAllBy,
    findAllPaginated,
    create,
    update,
    delete: deleteOne,
    deleteAll,
    deleteMany,
    findBy,
    findByPaginated,
    existsBy,
    countAll,
    checkUniqueness,
    validateRelationExists,
    transaction,
    search,
    searchPaginated,
    buildQueryExpressions,
    withTransaction,
    __internal: {
      db,
      table,
      config,
    },
  } as const;

  return repository;
};
