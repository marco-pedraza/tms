/**
 * @module BaseRepository
 * @description A module providing generic CRUD operations and utility functions for database entities
 */

import { NotFoundError, DuplicateError } from './errors';
import { eq, and, count, not, or } from 'drizzle-orm';
import type {
  PaginationMeta,
  TableWithId,
  UniqueFieldConfig,
  BaseRepository,
  TransactionalDB,
  DrizzleDB,
  QueryOptions,
  PaginationParams,
} from './types';
import { PgColumn } from 'drizzle-orm/pg-core';
import {
  handlePostgresError,
  isApplicationError,
} from './postgres-error-handler';
import { createPaginationMeta, applyOrdering } from './query-utils';

/**
 * Creates a base repository with CRUD operations for a database entity
 * @template T - The type of the entity
 * @template CreateT - The type for creating a new entity
 * @template UpdateT - The type for updating an existing entity
 * @template TTable - The type of the database table
 * @param {TTable} table - The database table for the entity
 * @param {string} entityName - The name of the entity for error messages
 * @returns {Object} An object containing CRUD and utility functions for the entity
 */
export const createBaseRepository = <
  T,
  CreateT,
  UpdateT extends Partial<CreateT>,
  TTable extends TableWithId,
>(
  db: TransactionalDB,
  table: TTable,
  entityName: string,
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
      const [entity] = await query.where(eq(table.id, id)).limit(1);

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
   * Retrieves all entities from the table
   * @param {Object} options - Additional options for the query
   * @param {Array<{field: PgColumn; direction: 'asc' | 'desc'}>} [options.orderBy] - Fields to order by
   * @returns {Promise<T[]>} Array of all entities
   */
  const findAll = async (options?: QueryOptions): Promise<T[]> => {
    try {
      let query = db.select().from(table);
      query = applyOrdering(query, options?.orderBy);
      const entities = await query;
      return entities as T[];
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findAll');
    }
  };

  /**
   * Retrieves all entities filtered by a specific field value
   * @param {PgColumn} field - The field to filter by
   * @param {unknown} value - The value to filter for
   * @param {Object} options - Additional options for the query
   * @param {Array<{field: PgColumn; direction: 'asc' | 'desc'}>} [options.orderBy] - Fields to order by
   * @returns {Promise<T[]>} Array of filtered entities
   */
  const findAllBy = async (
    field: PgColumn,
    value: unknown,
    options?: QueryOptions,
  ): Promise<T[]> => {
    try {
      let query = db.select().from(table);
      // @ts-expect-error - Drizzle query builder method typing
      query = query.where(eq(field, value));
      query = applyOrdering(query, options?.orderBy);
      const entities = await query;
      return entities as T[];
    } catch (error) {
      throw handlePostgresError(error, entityName, 'findAllBy');
    }
  };

  /**
   * Retrieves entities with pagination
   * @param {PaginationParams} query - Pagination and ordering parameters
   * @returns {Promise<Object>} Paginated results with data and pagination metadata
   */
  const findAllPaginated = async (
    query?: PaginationParams,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }> => {
    try {
      const { page = 1, pageSize = 10, orderBy } = query ?? {};
      const offset = (page - 1) * pageSize;

      const countQuery = db.select({ count: count() }).from(table);
      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;

      let dataQuery = db.select().from(table);
      dataQuery = applyOrdering(dataQuery, orderBy);
      const data = await dataQuery.limit(pageSize).offset(offset);

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
   * Finds entities by a specific field value with pagination
   * @param {PgColumn} field - The field to search by
   * @param {unknown} value - The value to search for
   * @param {PaginationParams} query - Pagination and ordering parameters
   * @returns {Promise<Object>} Paginated results with data and pagination metadata
   */
  const findByPaginated = async (
    field: PgColumn,
    value: unknown,
    query?: PaginationParams,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }> => {
    try {
      const { page = 1, pageSize = 10, orderBy } = query ?? {};
      const offset = (page - 1) * pageSize;

      const countQuery = db
        .select({ count: count() })
        .from(table)
        .where(eq(field, value));
      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;

      let dataQuery = db.select().from(table).where(eq(field, value));
      dataQuery = applyOrdering(dataQuery, orderBy);

      const data = await dataQuery.limit(pageSize).offset(offset);

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
   * Validates that a set of fields have unique values in the table
   * @param {UniqueFieldConfig<TTable>[]} fields - Array of field configurations to validate
   * @param {number} [excludeId] - Optional ID to exclude from the validation
   * @param {string} [errorMessage] - Custom error message if validation fails
   * @throws {DuplicateError} If any of the fields are not unique
   * @returns {Promise<void>}
   */
  const validateUniqueness = async (
    fields: UniqueFieldConfig<TTable>[],
    excludeId?: number,
    errorMessage?: string,
  ): Promise<void> => {
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

      if (existing) {
        throw new DuplicateError(
          errorMessage || `${entityName} with these values already exists`,
        );
      }
    } catch (error) {
      if (error instanceof DuplicateError) {
        throw error;
      }
      throw handlePostgresError(error, entityName, 'validateUniqueness');
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

  const transaction = <R>(
    callback: (
      txRepo: BaseRepository<T, CreateT, UpdateT, TTable>,
    ) => Promise<R>,
  ): Promise<R> => {
    return (db as DrizzleDB).transaction((tx: TransactionalDB) => {
      const txRepository = createBaseRepository<T, CreateT, UpdateT, TTable>(
        tx,
        table,
        entityName,
      );
      return callback(txRepository);
    }) as Promise<R>;
  };

  const repository: BaseRepository<T, CreateT, UpdateT, TTable> = {
    findOne,
    findAll,
    findAllBy,
    findAllPaginated,
    create,
    update,
    delete: deleteOne,
    deleteAll,
    findBy,
    findByPaginated,
    existsBy,
    validateUniqueness,
    validateRelationExists,
    transaction,
    __internal: {
      db,
      table,
    },
  } as const;

  return repository;
};
