/**
 * @module BaseRepository
 * @description A module providing generic CRUD operations and utility functions for database entities
 */

import { db } from '../db';
import { NotFoundError, ValidationError, DuplicateError } from './errors';
import { eq, and, count, not, or } from 'drizzle-orm';
import type { PaginationParams } from './types';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';

type TableWithId = PgTable & {
  id: PgColumn;
};

/**
 * Represents a column from a specific table
 */
type TableColumn<TTable> = {
  [K in keyof TTable]: TTable[K] extends PgColumn ? TTable[K] : never;
}[keyof TTable];

/**
 * Configuration for validating unique fields in an entity
 * @template TTable - The database table type
 */
type UniqueFieldConfig<TTable extends TableWithId> = {
  /**
   * The database column to check for uniqueness
   */
  field: TableColumn<TTable>;
  /**
   * The value to check for uniqueness
   */
  value: unknown;
  /**
   * Optional scope for the uniqueness check
   */
  scope?: {
    field: TableColumn<TTable>;
    value: unknown;
  };
};

/**
 * Standard pagination metadata structure
 * @typedef {Object} PaginationMetadata
 * @property {number} currentPage - Current page number
 * @property {number} pageSize - Number of items per page
 * @property {number} totalCount - Total number of items
 * @property {number} totalPages - Total number of pages
 * @property {boolean} hasNextPage - Whether there is a next page
 * @property {boolean} hasPreviousPage - Whether there is a previous page
 */
type PaginationMetadata = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

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
  table: TTable,
  entityName: string,
) => {
  type TableInsert = TTable extends { $inferInsert: infer U } ? U : never;

  /**
   * Finds an entity by its ID
   * @param {number} id - The ID of the entity to find
   * @throws {NotFoundError} If the entity is not found
   * @returns {Promise<T>} The found entity
   */
  const findOne = async (id: number): Promise<T> => {
    const [entity] = await db
      .select()
      .from(table)
      .where(eq(table.id, id))
      .limit(1);

    if (!entity) {
      throw new NotFoundError(`${entityName} with id ${id} not found`);
    }

    return entity as T;
  };

  /**
   * Retrieves all entities from the table
   * @returns {Promise<T[]>} Array of all entities
   */
  const findAll = async (): Promise<T[]> => {
    const entities = await db.select().from(table);
    return entities as T[];
  };

  /**
   * Retrieves entities with pagination
   * @param {PaginationParams} params - Pagination parameters (page and pageSize)
   * @returns {Promise<Object>} Paginated results with data and pagination metadata
   */
  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<{
    data: T[];
    pagination: PaginationMetadata;
  }> => {
    const { page = 1, pageSize = 10 } = params;
    const offset = (page - 1) * pageSize;

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(table);

    const result = await db.select().from(table).limit(pageSize).offset(offset);
    const totalPages = Math.ceil(Number(totalCount) / pageSize);

    return {
      data: result as T[],
      pagination: {
        currentPage: page,
        pageSize,
        totalCount: Number(totalCount),
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
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
      throw new ValidationError(
        `Failed to create ${entityName}: ${(error as Error).message}`,
      );
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
    await findOne(id);

    const [entity] = await db
      .update(table)
      .set(data as TableInsert)
      .where(eq(table.id, id))
      .returning();

    return entity as T;
  };

  /**
   * Deletes an entity by ID
   * @param {number} id - The ID of the entity to delete
   * @throws {NotFoundError} If the entity is not found
   * @returns {Promise<T>} The deleted entity
   */
  const deleteOne = async (id: number): Promise<T> => {
    await findOne(id);

    const [entity] = await db.delete(table).where(eq(table.id, id)).returning();

    return entity as T;
  };

  /**
   * Deletes all records from the table
   * @returns {Promise<number>} The number of records deleted
   */
  const deleteAll = async (): Promise<number> => {
    const result = await db.delete(table).returning();
    return result.length;
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
    const [entity] = await db
      .select()
      .from(table)
      .where(eq(field, value))
      .limit(1);

    return entity as T | null;
  };

  /**
   * Finds entities by a specific field value with pagination
   * @param {PgColumn} field - The field to search by
   * @param {unknown} value - The value to search for
   * @param {PaginationParams} params - Pagination parameters (page and pageSize)
   * @returns {Promise<Object>} Paginated results with data and pagination metadata
   */
  const findByPaginated = async (
    field: PgColumn,
    value: unknown,
    params: PaginationParams = {},
  ): Promise<{
    data: T[];
    pagination: PaginationMetadata;
  }> => {
    const { page = 1, pageSize = 10 } = params;
    const offset = (page - 1) * pageSize;

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(table)
      .where(eq(field, value));

    const result = await db
      .select()
      .from(table)
      .where(eq(field, value))
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(Number(totalCount) / pageSize);

    return {
      data: result as T[],
      pagination: {
        currentPage: page,
        pageSize,
        totalCount: Number(totalCount),
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
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

      const [result] = await db
        .select({ count: count() })
        .from(table)
        .where(query);

      return Number(result.count) > 0;
    } catch (error) {
      throw new Error(
        `Failed to check if ${entityName} exists: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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
  };

  return {
    findOne,
    findAll,
    findAllPaginated,
    create,
    update,
    delete: deleteOne,
    deleteAll,
    findBy,
    findByPaginated,
    existsBy,
    validateUniqueness,
  };
};
