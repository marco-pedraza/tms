/**
 * @module BaseRepository
 * @description A module providing generic CRUD operations and utility functions for database entities
 */

import {
  NotFoundError,
  SoftDeleteNotConfiguredError,
  DependencyExistsError,
} from './errors';
import {
  eq,
  and,
  count,
  not,
  or,
  SQL,
  inArray,
  sql,
  getTableName,
} from 'drizzle-orm';
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
  Filters,
  FieldConfig,
} from './types';
import { PgColumn } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL query result structure
 */
interface PostgresQueryResult {
  rows: Record<string, unknown>[];
  rowCount?: number;
}

/**
 * Foreign key information from information_schema
 */
interface ForeignKeyInfo {
  dep_table: string;
  dep_column: string;
}

import {
  handlePostgresError,
  isApplicationError,
} from './postgres-error-handler';
import {
  createPaginationMeta,
  applyOrdering,
  applySimpleFilters,
  applySearchConditions,
  createOrderByExpressions,
  applySoftDeleteFilter,
} from './query-utils';

/**
 * Convert a string from snake_case to camelCase
 * @param str - The string to convert
 * @returns The camelCase version of the string
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

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

  const isSoftDeleteEnabled = config?.softDeleteEnabled ?? false;

  /**
   * Helper para validar que soft delete esté habilitado
   */
  const requiresSoftDelete = (operation: string) => {
    if (!isSoftDeleteEnabled) {
      throw new SoftDeleteNotConfiguredError(operation);
    }
  };

  // Cache for table schema information to avoid repeated queries
  const tableSchemaCache = new Map<string, { hasDeletedAt: boolean }>();

  /**
   * Helper to check if a table has a deleted_at column
   */
  const hasDeletedAtColumn = async (
    tx: TransactionalDB,
    tableName: string,
  ): Promise<boolean> => {
    const cachedResult = tableSchemaCache.get(tableName);
    if (cachedResult) {
      return cachedResult.hasDeletedAt;
    }

    const result = await tx.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = ${tableName}
        AND column_name = 'deleted_at'
        AND table_schema = current_schema()
    `);

    const hasDeletedAt =
      Number((result as PostgresQueryResult)?.rows?.[0]?.count) > 0;
    tableSchemaCache.set(tableName, { hasDeletedAt });
    return hasDeletedAt;
  };

  /**
   * Helper to check for active dependencies before soft delete
   */
  const checkActiveDependencies = async (
    tx: TransactionalDB,
    entityId: number,
  ): Promise<void> => {
    // Check dependencies by default, can be disabled by setting to false
    if (config?.checkDependenciesOnSoftDelete === false) {
      return;
    }
    // Get the table name from the table object using Drizzle's getTableName function
    const parentTableName = getTableName(table);

    if (!parentTableName) {
      throw new Error(`Could not determine table name for ${entityName}`);
    }

    // Discover foreign keys pointing to the current table
    const foreignKeysResult = await tx.execute(sql`
      SELECT
        tc.table_name AS dep_table,
        kcu.column_name AS dep_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = ${parentTableName}
        AND ccu.column_name = 'id'
        AND tc.table_schema = current_schema()
    `);

    // Handle the result array properly - extract rows from PostgreSQL Result object
    const foreignKeys = (foreignKeysResult as PostgresQueryResult)?.rows || [];

    const violatingTables: string[] = [];

    // Check each dependent table for active records
    for (const fk of foreignKeys) {
      const fkInfo = fk as unknown as ForeignKeyInfo;
      const depTable = fkInfo.dep_table;
      const depColumn = fkInfo.dep_column;

      // Check if the dependent table has deleted_at column
      const hasDeletedAt = await hasDeletedAtColumn(tx, depTable);

      // Build the query to check for active dependencies
      let checkQuery: SQL;
      if (hasDeletedAt) {
        // Table has soft delete - check for non-deleted records
        checkQuery = sql`
          SELECT 1
          FROM ${sql.identifier(depTable)}
          WHERE ${sql.identifier(depColumn)} = ${entityId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
      } else {
        // Table doesn't have soft delete - check for any records
        checkQuery = sql`
          SELECT 1
          FROM ${sql.identifier(depTable)}
          WHERE ${sql.identifier(depColumn)} = ${entityId}
          LIMIT 1
        `;
      }

      const result = await tx.execute(checkQuery);
      if (
        result &&
        (result as unknown as PostgresQueryResult)?.rows?.length > 0
      ) {
        violatingTables.push(depTable);
      }
    }

    // If there are violations, throw an error
    if (violatingTables.length > 0) {
      throw new DependencyExistsError(entityName, violatingTables);
    }
  };

  /**
   * Helper function to apply search or filter conditions to a query
   * @param query - The query to apply conditions to
   * @param searchTerm - Optional search term
   * @param filters - Optional filters
   * @returns The query with search or filter conditions applied
   */
  const applySearchOrFilters = <Q extends object>(
    query: Q,
    searchTerm?: string,
    filters?: Filters<T>,
  ): Q => {
    // Early return if no search term and no filters
    const trimmedSearchTerm = searchTerm?.trim();
    const hasFilters = filters && Object.keys(filters).length > 0;

    if (!trimmedSearchTerm && !hasFilters) {
      return query;
    }

    // Apply search conditions if searchTerm is provided and not empty
    if (trimmedSearchTerm) {
      if (!config?.searchableFields?.length) {
        throw new Error(`Searchable fields not defined for ${entityName}`);
      }
      return applySearchConditions(
        query,
        trimmedSearchTerm,
        config,
        table,
        filters,
      );
    } else {
      // Apply simple filters if no search term
      return applySimpleFilters(query, table, filters);
    }
  };

  /**
   * Applies both search/filters and soft delete filter efficiently
   * Only applies soft delete filter if enabled
   */
  const applyAllFilters = <Q extends object>(
    query: Q,
    searchTerm?: string,
    filters?: Filters<T>,
  ): Q => {
    // Apply search or filters first
    let filteredQuery = applySearchOrFilters(query, searchTerm, filters);

    // Only apply soft delete filter if enabled
    if (isSoftDeleteEnabled) {
      filteredQuery = applySoftDeleteFilter(filteredQuery, table, true);
    }

    return filteredQuery;
  };

  /**
   * Finds an entity by its ID
   * @param {number} id - The ID of the entity to find
   * @throws {NotFoundError} If the entity is not found
   * @returns {Promise<T>} The found entity
   */
  const findOne = async (id: number): Promise<T> => {
    try {
      const query = db.select().from(table);
      const findOneQuery = query.where(eq(table.id, id)).limit(1);
      const finalQuery = applySoftDeleteFilter(
        findOneQuery,
        table,
        isSoftDeleteEnabled,
      );
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
   * Retrieves all entities from the table with optional filters, ordering, and search
   * @param {QueryOptions<T>} options - Additional options for the query
   * @param {Record<string, unknown>} [options.filters] - Simple equality filters to apply
   * @param {Array<{field: PgColumn; direction: 'asc' | 'desc'}>} [options.orderBy] - Fields to order by
   * @param {string} [options.searchTerm] - Search term to match against searchable fields
   * @returns {Promise<T[]>} Array of all entities
   */
  const findAll = async (options?: QueryOptions<T, TTable>): Promise<T[]> => {
    try {
      const { filters, orderBy, searchTerm } = options ?? {};
      let query = db.select().from(table);

      // Apply all filters efficiently
      query = applyAllFilters(query, searchTerm, filters);

      query = applyOrdering(query, orderBy, table);

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
      query = applySoftDeleteFilter(query, table, isSoftDeleteEnabled);
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
   * Retrieves entities with pagination, optional filters, ordering, and search
   * @param {PaginationParams & { filters?: Record<string, unknown> }} query - Pagination, filters, ordering, and search parameters
   * @returns {Promise<Object>} Paginated results with data and pagination metadata
   */
  const findAllPaginated = async (
    query?: PaginationParams<T, TTable>,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }> => {
    try {
      const {
        page = 1,
        pageSize = 10,
        orderBy,
        filters,
        searchTerm,
      } = query ?? {};
      const offset = (page - 1) * pageSize;

      // Count query
      let countQuery = db.select({ count: count() }).from(table);
      countQuery = applyAllFilters(countQuery, searchTerm, filters);

      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;

      // Data query
      let dataQuery = db.select().from(table);
      dataQuery = applyAllFilters(dataQuery, searchTerm, filters);

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
   * Helper to check if we're already in a transaction context
   * When db is a transaction instance, it doesn't have a .transaction() method
   */
  const isInTransaction = (db: TransactionalDB): boolean => {
    return typeof (db as DrizzleDB).transaction !== 'function';
  };

  /**
   * Helper to execute operations either in a new transaction or within existing transaction
   */
  const executeWithDependencyCheck = <R>(
    operation: (tx: TransactionalDB) => Promise<R>,
  ): Promise<R> => {
    if (isInTransaction(db)) {
      // Already in transaction, execute directly
      return operation(db);
    } else {
      // Not in transaction, create one
      return (db as DrizzleDB).transaction(operation);
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

      // Always update the updatedAt timestamp
      const updateData = {
        ...(data as TableInsert),
        updatedAt: sql`NOW()`,
      } as TableInsert;

      const [entity] = (await db
        .update(table)
        .set(updateData)
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
   * Deletes an entity by ID (soft delete if enabled, hard delete otherwise)
   * @param {number} id - The ID of the entity to delete
   * @throws {NotFoundError} If the entity is not found
   * @throws {DependencyExistsError} If the entity has active dependencies (soft delete only)
   * @returns {Promise<T>} The deleted entity
   */
  const deleteOne = async (id: number): Promise<T> => {
    try {
      await findOne(id);

      if (isSoftDeleteEnabled) {
        // Use transaction to check dependencies and perform soft delete atomically
        const result = await executeWithDependencyCheck(async (tx) => {
          // Check for active dependencies before soft delete
          await checkActiveDependencies(tx, id);

          // Soft delete: set deletedAt to current timestamp
          const entities = await tx
            .update(table)
            .set({ deletedAt: sql`NOW()` } as TableInsert)
            .where(eq(table.id, id))
            .returning();
          return (entities as unknown[])[0] as T;
        });
        return result;
      } else {
        // Hard delete: remove from database
        const [entity] = await db
          .delete(table)
          .where(eq(table.id, id))
          .returning();
        return entity as T;
      }
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
   * Deletes multiple entities by their IDs (soft delete if enabled, hard delete otherwise)
   * @param {number[]} ids - Array of entity IDs to delete
   * @returns {Promise<T[]>} Array of deleted entities
   * @throws {NotFoundError} If any of the IDs are invalid or not found
   * @throws {DependencyExistsError} If any entity has active dependencies (soft delete only)
   */
  const deleteMany = async (ids: number[]): Promise<T[]> => {
    if (ids.length === 0) {
      return [];
    }

    try {
      // First, verify all entities exist before attempting to delete any
      let existingQuery = db.select().from(table).where(inArray(table.id, ids));

      if (isSoftDeleteEnabled) {
        // For soft delete, only check entities that are not already soft deleted
        existingQuery = applySoftDeleteFilter(existingQuery, table, true);
      }

      const existingEntities = await existingQuery;

      if (existingEntities.length !== ids.length) {
        const existingIds = (
          existingEntities as unknown as { id: number }[]
        ).map((entity) => entity.id);
        const notFoundIds = ids.filter((id) => !existingIds.includes(id));
        throw new NotFoundError(
          `${entityName}(s) with id(s) ${notFoundIds.join(', ')} not found`,
        );
      }

      if (isSoftDeleteEnabled) {
        // Use transaction to check dependencies and perform soft delete atomically
        const result = await executeWithDependencyCheck(async (tx) => {
          // Check for active dependencies for each entity before soft delete
          for (const id of ids) {
            await checkActiveDependencies(tx, id);
          }

          // Soft delete: set deletedAt to current timestamp
          const entities = await tx
            .update(table)
            .set({ deletedAt: sql`NOW()` } as TableInsert)
            .where(inArray(table.id, ids))
            .returning();
          return entities as unknown as T[];
        });
        return result;
      } else {
        // Hard delete: remove from database
        const result = await db
          .delete(table)
          .where(inArray(table.id, ids))
          .returning();
        return result as unknown as T[];
      }
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
      const findByQuery = query.where(eq(field, value)).limit(1);
      const finalQuery = applySoftDeleteFilter(
        findByQuery,
        table,
        isSoftDeleteEnabled,
      );
      const [entity] = await finalQuery;
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

      // Count query - apply WHERE first, then soft delete filter
      let countQuery = db.select({ count: count() }).from(table);
      // @ts-expect-error - Drizzle query builder method typing
      countQuery = countQuery.where(eq(field, value));
      countQuery = applySimpleFilters(countQuery, table, filters);
      countQuery = applySoftDeleteFilter(
        countQuery,
        table,
        isSoftDeleteEnabled,
      );

      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;

      // Data query - apply WHERE first, then soft delete filter
      let dataQuery = db.select().from(table);
      // @ts-expect-error - Drizzle query builder method typing
      dataQuery = dataQuery.where(eq(field, value));
      dataQuery = applySimpleFilters(dataQuery, table, filters);
      dataQuery = applySoftDeleteFilter(dataQuery, table, isSoftDeleteEnabled);

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
   * Retrieves a single entity by one or multiple field values
   * @param {FieldConfig<TTable>[] | FieldConfig<TTable>} fields - Field or fields to apply to the query
   * @returns {Promise<T | null>} The entity if found, null otherwise
   */
  const findOneBy = async (
    fields: FieldConfig<TTable> | FieldConfig<TTable>[],
  ): Promise<T | null> => {
    try {
      let query = db.select().from(table).limit(1);
      query = applySoftDeleteFilter(query, table, isSoftDeleteEnabled);

      if (Array.isArray(fields)) {
        const filters = fields.reduce<Record<string, unknown>>(
          (acc, { field, value }: FieldConfig<TTable>) => {
            acc[field.name] = value;
            return acc;
          },
          {},
        );
        query = applySimpleFilters(query, table, filters);
      } else {
        const filters = { [fields.field.name]: fields.value };
        query = applySimpleFilters(query, table, filters);
      }

      const [entity] = await query;
      return entity ? (entity as T) : null;
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findOneBy');
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

      const baseQuery = db.select({ count: count() }).from(table).where(query);

      const finalQuery = applySoftDeleteFilter(
        baseQuery,
        table,
        isSoftDeleteEnabled,
      );
      const result = await finalQuery;

      return Number(result[0]?.count ?? 0) > 0;
    } catch (error) {
      throw handlePostgresError(error, entityName, 'existsBy');
    }
  };

  /**
   * Counts entities in the table with optional filters and search
   * @param {QueryOptions<T>} options - Additional options for the query
   * @param {Record<string, unknown>} [options.filters] - Simple equality filters to apply
   * @param {string} [options.searchTerm] - Search term to match against searchable fields
   * @returns {Promise<number>} The count of entities matching the filters and search
   */
  const countAll = async (
    options?: QueryOptions<T, TTable>,
  ): Promise<number> => {
    try {
      const { filters, searchTerm } = options ?? {};
      let countQuery = db.select({ count: count() }).from(table);

      countQuery = applyAllFilters(countQuery, searchTerm, filters);

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
        // Use case-insensitive comparison for string values
        const fieldCondition =
          typeof value === 'string'
            ? sql`LOWER(${field}) = LOWER(${value})`
            : eq(field, value);

        const scopeCondition = scope
          ? typeof scope.value === 'string'
            ? sql`LOWER(${scope.field}) = LOWER(${scope.value})`
            : eq(scope.field, scope.value)
          : undefined;

        return scope ? and(fieldCondition, scopeCondition) : fieldCondition;
      });

      const query = excludeId
        ? and(or(...conditions), not(eq(table.id, excludeId)))
        : or(...conditions);

      let baseQuery = db.select().from(table).where(query);

      // Apply soft delete filter to exclude soft-deleted records from uniqueness checks
      baseQuery = applySoftDeleteFilter(baseQuery, table, isSoftDeleteEnabled);

      const [existing] = await baseQuery.limit(1);

      if (!existing) {
        return [];
      }

      const conflicts = [];
      for (const f of fields) {
        // Convert field name from snake_case to camelCase for object property access
        const camelCaseFieldName = toCamelCase(f.field.name);
        const existingValue = existing[camelCaseFieldName];
        const isConflict =
          // Compare values case-insensitively for strings
          typeof f.value === 'string' && typeof existingValue === 'string'
            ? f.value.toLowerCase() === existingValue.toLowerCase()
            : f.value === existingValue;
        if (isConflict) {
          conflicts.push({ field: camelCaseFieldName, value: f.value });
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
   * @param {boolean} relatedTableHasSoftDelete - Whether the related table has soft delete enabled
   * @throws {NotFoundError} If the related entity is not found
   * @returns {Promise<void>}
   */
  const validateRelationExists = async (
    relatedTable: TableWithId,
    relationId: number,
    relationName: string = 'Related entity',
    relatedTableHasSoftDelete = false,
  ): Promise<void> => {
    try {
      let query = db
        .select()
        .from(relatedTable)
        .where(eq(relatedTable.id, relationId));

      // Apply soft delete filter if the related table has soft delete enabled
      if (relatedTableHasSoftDelete) {
        query = applySoftDeleteFilter(query, relatedTable, true);
      }

      const [entity] = await query.limit(1);

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
   *
   * @deprecated Use findAll with searchTerm parameter instead: findAll({ searchTerm: term })
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
   *
   * @deprecated Use findAllPaginated with searchTerm parameter instead: findAllPaginated({ searchTerm: term, ...query })
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

      // Validate that searchable fields are configured when searchTerm is provided
      if (
        searchTerm?.trim() &&
        (!config?.searchableFields || config.searchableFields.length === 0)
      ) {
        throw new Error(`Searchable fields not defined for ${entityName}`);
      }

      // Use a dummy query to build conditions and extract the WHERE clause
      let dummyQuery = db.select().from(table);
      dummyQuery = applyAllFilters(dummyQuery, searchTerm, filters);

      // Extract the WHERE condition from the built query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryConfig = (dummyQuery as any).config;
      const baseWhere = queryConfig?.where;

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

  /**
   * Permanently deletes an entity by ID (hard delete)
   * @param {number} id - The ID of the entity to permanently delete
   * @throws {SoftDeleteNotConfiguredError} If soft delete is not enabled
   * @throws {NotFoundError} If the entity is not found
   * @returns {Promise<T>} The permanently deleted entity
   */
  const forceDelete = async (id: number): Promise<T> => {
    requiresSoftDelete('forceDelete');

    try {
      // Find entity without soft delete filter (can be already soft deleted)
      const [entity] = await db
        .select()
        .from(table)
        .where(eq(table.id, id))
        .limit(1);

      if (!entity) {
        throw new NotFoundError(`${entityName} with id ${id} not found`);
      }

      const [deletedEntity] = await db
        .delete(table)
        .where(eq(table.id, id))
        .returning();

      return deletedEntity as T;
    } catch (error) {
      if (error instanceof Error && isApplicationError(error)) {
        throw error;
      }
      throw handlePostgresError(error, entityName, 'forceDelete');
    }
  };

  /**
   * Restores a soft deleted entity by ID
   * @param {number} id - The ID of the entity to restore
   * @throws {SoftDeleteNotConfiguredError} If soft delete is not enabled
   * @throws {NotFoundError} If the entity is not found in deleted records
   * @returns {Promise<T>} The restored entity
   */
  const restore = async (id: number): Promise<T> => {
    requiresSoftDelete('restore');

    try {
      const [restoredEntity] = await db
        .update(table)
        .set({ deletedAt: null } as TableInsert)
        .where(eq(table.id, id))
        .returning();

      if (!restoredEntity) {
        throw new NotFoundError(`${entityName} with id ${id} not found`);
      }

      return restoredEntity as T;
    } catch (error) {
      if (error instanceof Error && isApplicationError(error)) {
        throw error;
      }
      throw handlePostgresError(error, entityName, 'restore');
    }
  };

  const repository: BaseRepository<T, CreateT, UpdateT, TTable> = {
    findOne,
    findOneBy,
    findAll,
    findAllBy,
    findAllPaginated,
    create,
    update,
    delete: deleteOne,
    deleteAll,
    deleteMany,
    forceDelete,
    restore,
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
