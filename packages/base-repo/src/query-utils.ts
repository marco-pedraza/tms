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
 * Creates order by expressions without modifying a query
 * @param orderBy - Order by configuration
 * @param table - The table to apply ordering to
 * @returns Array of SQL order by expressions
 */
export const createOrderByExpressions = <TTable>(
  orderBy: OrderBy<TTable>,
  table: PgTable,
): SQL[] => {
  return orderBy.map((order) => {
    const columnName = String(order.field);
    const column = (table as unknown as Record<string, PgColumn>)[columnName];

    if (!column) {
      throw new Error(
        `Invalid order field: ${columnName}. Field does not exist in the table.`,
      );
    }

    return order.direction === 'asc' ? asc(column) : desc(column);
  });
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

  const orderByList = createOrderByExpressions(orderBy, table);
  return (query as Record<string, (...args: unknown[]) => Q>).orderBy(
    ...orderByList,
  );
};

/**
 * Creates filter conditions without modifying a query
 * @param table - The table to create filters for
 * @param filters - Filters object
 * @returns SQL condition for the filters
 */
export const createFilterConditions = <T = unknown>(
  table: PgTable,
  filters: Filters<T>,
): SQL | undefined => {
  if (!filters || !Object.keys(filters).length) {
    return undefined;
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

  return conditions.length > 0 ? and(...conditions) : undefined;
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

  const filterCondition = createFilterConditions(table, filters);
  if (!filterCondition) {
    return query;
  }

  // Check if the query already has a WHERE condition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingWhere = (query as any)._where;
  const combinedConditions = existingWhere
    ? and(existingWhere, filterCondition)
    : filterCondition;

  return (query as Record<string, (...args: unknown[]) => Q>).where(
    combinedConditions,
  );
};

/**
 * Creates search conditions without modifying a query
 * @param searchTerm - The search term to look for
 * @param config - Repository configuration containing searchableFields
 * @param table - The table to create search for
 * @param filters - Optional filters to combine with search
 * @returns SQL condition for the search
 */
export const createSearchConditions = <T = unknown>(
  searchTerm: string,
  config: RepositoryConfig,
  table: PgTable,
  filters?: Filters<T>,
): SQL | undefined => {
  if (!config.searchableFields?.length) {
    throw new Error(
      'Searchable fields not defined in repository configuration',
    );
  }

  // First escape backslashes (\ -> \\), then escape wildcard characters (% and _)
  const escapedSearchTerm = searchTerm
    .replace(/\\/g, '\\\\')
    .replace(/([%_])/g, '\\$1');

  // Create search conditions (OR between searchable fields)
  const searchConditions = config.searchableFields.map((field) =>
    ilike(field, `%${escapedSearchTerm}%`),
  );

  const searchWhere = or(...searchConditions);

  // Create filter conditions
  if (filters && Object.keys(filters).length > 0) {
    const filterCondition = createFilterConditions(table, filters);
    return filterCondition ? and(searchWhere, filterCondition) : searchWhere;
  }

  return searchWhere;
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

  const searchCondition = createSearchConditions(
    searchTerm,
    config,
    table,
    filters,
  );
  if (!searchCondition) {
    return query;
  }

  // Check if the query already has a WHERE condition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingWhere = (query as any)._where;
  const combinedConditions = existingWhere
    ? and(existingWhere, searchCondition)
    : searchCondition;

  return (query as Record<string, (...args: unknown[]) => Q>).where(
    combinedConditions,
  );
};
