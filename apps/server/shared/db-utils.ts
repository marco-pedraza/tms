import { PgSelect } from 'drizzle-orm/pg-core';
import { PgTable, TableConfig } from 'drizzle-orm/pg-core';
import { eq, inArray, sql } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';
import type { DbReturnType } from '../db/database';
import { PaginatedResult, PaginationMeta, PaginationParams } from './types';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;
const MAX_PAGE_SIZE = 100;

/**
 * Applies pagination to a query and handles metadata calculation
 *
 * @param query - Main query in dynamic mode
 * @param countQuery - Query to get total count
 * @param params - Pagination parameters
 * @returns Paginated results with metadata
 *
 * @template T Query type
 * @template TRecord Type of returned records
 */
export async function withPagination<T extends PgSelect, TRecord>(
  query: T,
  countQuery: Promise<{ count: number }[]> | Promise<{ count: bigint }[]>,
  params: PaginationParams = {},
): Promise<PaginatedResult<TRecord>> {
  // Extract and validate pagination parameters
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(
    1,
    Math.min(MAX_PAGE_SIZE, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );

  // Apply pagination to the query
  const offset = (page - 1) * pageSize;
  const paginatedQuery = query.limit(pageSize).offset(offset);

  // Execute both queries in parallel for better performance
  const [results, countResult] = await Promise.all([
    paginatedQuery,
    countQuery,
  ]);

  const totalCount = Number(countResult[0]?.count || 0);

  const totalPages = Math.ceil(totalCount / pageSize);

  const paginationMeta: PaginationMeta = {
    currentPage: page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    data: results as TRecord[],
    pagination: paginationMeta,
  };
}

/**
 * Utility functions for handling entity relationships
 */

/**
 * Updates a many-to-many relationship between entities
 * @param db - Database connection instance initialized for the specific service
 * @param relationTable - The join table for the relationship
 * @param sourceField - The field in the join table that references the source entity
 * @param sourceId - The ID of the source entity
 * @param targetField - The field in the join table that references the target entity
 * @param targetIds - The IDs of the target entities to assign
 */
export async function updateManyToManyRelation(
  db: DbReturnType,
  relationTable: PgTable<TableConfig>,
  sourceField: AnyColumn,
  sourceId: number,
  targetField: AnyColumn,
  targetIds: number[],
): Promise<void> {
  // Delete existing relations
  await db.delete(relationTable).where(eq(sourceField, sourceId));

  // Add new relations if there are any
  if (targetIds.length > 0) {
    await db.insert(relationTable).values(
      targetIds.map((targetId) => {
        // Convert field names to camelCase if they come in snake_case
        const sourceFieldName = toCamelCase(sourceField.name);
        const targetFieldName = toCamelCase(targetField.name);

        return {
          [sourceFieldName]: sourceId,
          [targetFieldName]: targetId,
        };
      }),
    );
  }
}

/**
 * Convert a string from snake_case to camelCase
 * @param str - The string to convert
 * @returns The camelCase version of the string
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Gets related entities from a join table
 * @param db - Database connection instance initialized for the specific service
 * @param targetTable - The table of the target entities
 * @param relationTable - The join table for the relationship
 * @param sourceField - The field in the join table that references the source entity
 * @param sourceId - The ID of the source entity
 * @param targetField - The field in the join table that references the target entity
 * @returns Array of related entities
 *
 * @template T - The type of entities to return
 */
export async function getRelatedEntities<T>(
  db: DbReturnType,
  targetTable: PgTable<TableConfig>,
  relationTable: PgTable<TableConfig>,
  sourceField: AnyColumn,
  sourceId: number,
  targetField: AnyColumn,
): Promise<T[]> {
  const relations = await db
    .select()
    .from(relationTable)
    .where(eq(sourceField, sourceId));

  if (relations.length === 0) {
    return [];
  }

  // Convert targetField name to camelCase for consistent access
  const targetFieldName = toCamelCase(targetField.name);
  const targetIds = relations.map((relation) => relation[targetFieldName]);

  return (await db
    .select()
    .from(targetTable)
    .where(inArray(sql`${targetTable}.id`, targetIds))) as T[];
}
