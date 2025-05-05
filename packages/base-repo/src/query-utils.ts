import { asc, desc } from 'drizzle-orm';
import { eq, and, or, ilike, SQL } from 'drizzle-orm';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { OrderBy, PaginationMeta, Filters, RepositoryConfig } from './types';

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
 * @param table - The table to apply ordering to
 * @returns The query with ordering applied
 *
 * @example
 * const query = db.select().from(users);
 * const orderedQuery = applyOrdering(query, [
 *   { field: 'name', direction: 'asc' },
 *   { field: 'createdAt', direction: 'desc' }
 * ], users);
 */
export const applyOrdering = <Q extends object, TTable>(
  query: Q,
  orderBy?: OrderBy<TTable>,
  table?: PgTable,
): Q => {
  if (!orderBy?.length || !('orderBy' in query) || !table) {
    return query;
  }

  const orderByList = orderBy.map((order) => {
    const columnName = String(order.field);
    const column = (table as unknown as Record<string, PgColumn>)[columnName];

    if (!column) {
      throw new Error(
        `Invalid order field: ${columnName}. Field does not exist in the table.`,
      );
    }

    return order.direction === 'asc' ? asc(column) : desc(column);
  });

  return (query as Record<string, (...args: unknown[]) => Q>).orderBy(
    ...orderByList,
  );
};

/**
 * Applies simple equality filters to a query if filters are provided
 * @param query - The query to apply filters to
 * @param table - The table to apply filters to
 * @param filters - Optional filters object
 * @returns The query with filters applied
 *
 * @example
 * const query = db.select().from(users);
 * const filteredQuery = applySimpleFilters(query, users, {
 *   status: 'active',
 *   age: 18
 * });
 */
export const applySimpleFilters = <Q extends object, T = unknown>(
  query: Q,
  table: PgTable,
  filters?: Filters<T>,
): Q => {
  if (!filters || !Object.keys(filters).length || !('where' in query)) {
    return query;
  }

  const conditions = Object.entries(filters).map(([field, value]) => {
    const column = (table as unknown as Record<string, PgColumn>)[field];
    if (!column) {
      throw new Error(
        `Invalid filter field: ${field}. Field does not exist in the table.`,
      );
    }
    return eq(column, value);
  });

  // Check if the query already has a WHERE condition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingWhere = (query as any)._where;
  const combinedConditions = existingWhere
    ? and(existingWhere, ...conditions)
    : and(...conditions);

  const finalQuery = (query as Record<string, (...args: unknown[]) => Q>).where(
    combinedConditions,
  );

  return finalQuery;
};

/**
 * Applies search conditions to a query
 * @param query - The query to apply search to
 * @param searchTerm - The search term to look for
 * @param config - Repository configuration containing searchableFields
 * @param table - The table to apply search to
 * @param filters - Optional filters to apply alongside search
 * @returns The query with search conditions applied
 *
 * @example
 * const query = db.select().from(users);
 * const config = { searchableFields: [users.name, users.email] };
 * const searchQuery = applySearchConditions(query, 'john', config, users);
 */
export const applySearchConditions = <Q extends object, T = unknown>(
  query: Q,
  searchTerm: string,
  config: RepositoryConfig,
  table: PgTable,
  filters?: Filters<T>,
): Q => {
  if (!('where' in query)) {
    return query;
  }

  if (!config.searchableFields || !config.searchableFields.length) {
    throw new Error(
      'Searchable fields not defined in repository configuration',
    );
  }

  // Escape wildcard characters (% and _) in the search term
  const escapedSearchTerm = searchTerm.replace(/([%_])/g, '\\$1');

  // Create search conditions (OR between searchable fields)
  const searchConditions = config.searchableFields.map((field) =>
    ilike(field, `%${escapedSearchTerm}%`),
  );

  // Create filter conditions
  const filterConditions: SQL[] = [];
  if (filters && Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([field, value]) => {
      const column = (table as unknown as Record<string, PgColumn>)[field];
      if (!column) {
        throw new Error(
          `Invalid filter field: ${field}. Field does not exist in the table.`,
        );
      }
      filterConditions.push(eq(column, value));
    });
  }

  // Combine search (OR) with filters (AND)
  const whereCondition =
    filterConditions.length > 0
      ? and(or(...searchConditions), ...filterConditions)
      : or(...searchConditions);

  return (query as Record<string, (...args: unknown[]) => Q>).where(
    whereCondition,
  );
};
