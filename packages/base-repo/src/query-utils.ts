import { asc, desc } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { PaginationMeta } from './types';

/**
 * Creates pagination metadata based on query results
 * @param totalCount - Total count of records
 * @param page - Current page number
 * @param pageSize - Number of items per page
 * @returns Pagination metadata object
 */
export const createPaginationMeta = (
  totalCount: number,
  page: number,
  pageSize: number,
): PaginationMeta => {
  const totalPages = Math.ceil(Number(totalCount) / pageSize);

  return {
    currentPage: page,
    pageSize,
    totalCount: Number(totalCount),
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Applies ordering to a query if ordering options are provided
 * @param query - The query to apply ordering to
 * @param orderBy - Optional ordering configuration
 * @returns The query with ordering applied
 *
 * @example
 * const query = db.select().from(users);
 * const orderedQuery = applyOrdering(query, [
 *   { field: users.name, direction: 'asc' },
 *   { field: users.createdAt, direction: 'desc' }
 * ]);
 */
export const applyOrdering = <Q extends object>(
  query: Q,
  orderBy?: Array<{ field: PgColumn; direction: 'asc' | 'desc' }>,
): Q => {
  if (!orderBy?.length || !('orderBy' in query)) {
    return query;
  }

  const orderByList = orderBy.map((order) =>
    order.direction === 'asc' ? asc(order.field) : desc(order.field),
  );

  return (query as Record<string, (...args: unknown[]) => Q>).orderBy(
    ...orderByList,
  );
};
