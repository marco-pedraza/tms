import { asc, desc } from 'drizzle-orm';
import { eq, and, or, ilike, SQL, isNull, gte, lte } from 'drizzle-orm';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { fromZonedTime } from 'date-fns-tz';
import { OrderBy, PaginationMeta, Filters, RepositoryConfig } from './types';

/**
 * Default timezone for date filtering operations
 * TODO: Adjust for multi-tenant
 */
export const DEFAULT_TIMEZONE = 'America/Mexico_City';

/**
 * Creates a Date object representing the start of day in the specified timezone
 * @param date - The date to get start of day for
 * @param timezone - The timezone to use (defaults to DEFAULT_TIMEZONE)
 * @returns Date object representing 00:00:00 in the specified timezone converted to UTC
 */
function getStartOfDayInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE,
): Date {
  // Get the date string in the target timezone (YYYY-MM-DD format)
  const localDateString = date.toLocaleDateString('en-CA', {
    timeZone: timezone,
  });

  // Create a date representing midnight (00:00:00) on that day in the target timezone
  const localMidnight = new Date(`${localDateString}T00:00:00`);

  // Convert this local time to UTC using fromZonedTime
  return fromZonedTime(localMidnight, timezone);
}

/**
 * Creates a Date object representing the end of day in the specified timezone
 * @param date - The date to get end of day for
 * @param timezone - The timezone to use (defaults to DEFAULT_TIMEZONE)
 * @returns Date object representing 23:59:59.999 in the specified timezone converted to UTC
 */
function getEndOfDayInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE,
): Date {
  // Get the date string in the target timezone (YYYY-MM-DD format)
  const localDateString = date.toLocaleDateString('en-CA', {
    timeZone: timezone,
  });

  // Create a date representing end of day (23:59:59.999) on that day in the target timezone
  const localEndOfDay = new Date(`${localDateString}T23:59:59.999`);

  // Convert this local time to UTC using fromZonedTime
  return fromZonedTime(localEndOfDay, timezone);
}

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
 * Creates a single filter condition for a field and value
 * @param column - The database column
 * @param value - The filter value
 * @returns SQL condition for the filter
 */
const createSingleFilterCondition = (column: PgColumn, value: unknown): SQL => {
  // Handle Date objects and date strings - filter by entire day in configured timezone
  if (
    value instanceof Date ||
    (typeof value === 'string' && !isNaN(Date.parse(value)))
  ) {
    let startOfDay: Date;
    let endOfDay: Date;

    if (typeof value === 'string') {
      // For string dates, interpret them directly in the target timezone
      // Extract just the date part (YYYY-MM-DD) to avoid timezone confusion
      const dateString = value.split('T')[0]; // Get only the date part
      startOfDay = fromZonedTime(`${dateString}T00:00:00`, DEFAULT_TIMEZONE);
      endOfDay = fromZonedTime(`${dateString}T23:59:59.999`, DEFAULT_TIMEZONE);
    } else {
      // For Date objects, use the existing timezone conversion functions
      startOfDay = getStartOfDayInTimezone(value);
      endOfDay = getEndOfDayInTimezone(value);
    }

    return and(gte(column, startOfDay), lte(column, endOfDay)) as SQL;
  }

  // Handle simple equality for non-date values
  return eq(column, value) as SQL;
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
    return createSingleFilterCondition(column, value);
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

/**
 * Applies soft delete filter to a query if soft delete is enabled
 * @param query - The query to apply soft delete filter to
 * @param table - The table to apply soft delete filter to
 * @param softDeleteEnabled - Whether soft delete is enabled
 * @returns The query with soft delete filter applied
 *
 * @example
 * const query = db.select().from(users);
 * const filteredQuery = applySoftDeleteFilter(query, users, true);
 */
export const applySoftDeleteFilter = <Q extends object>(
  query: Q,
  table: PgTable,
  softDeleteEnabled: boolean,
): Q => {
  // Early return for performance - avoid any processing if soft delete is disabled
  if (!softDeleteEnabled) {
    return query;
  }

  if (!('where' in query)) {
    return query;
  }

  const deletedAtColumn = (table as unknown as Record<string, PgColumn>)
    .deletedAt;
  if (!deletedAtColumn) {
    throw new Error(
      'deletedAt column not found in table. Ensure the table has a deletedAt column for soft delete functionality.',
    );
  }

  const softDeleteCondition = isNull(deletedAtColumn);

  // Check if the query already has a WHERE condition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingWhere = (query as any).config?.where;
  const combinedConditions = existingWhere
    ? and(existingWhere, softDeleteCondition)
    : softDeleteCondition;

  return (query as Record<string, (...args: unknown[]) => Q>).where(
    combinedConditions,
  );
};
