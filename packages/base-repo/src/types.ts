import { PgColumn, PgTable } from 'drizzle-orm/pg-core';

/**
 * Generic type for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * Parameters for pagination requests
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Column to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

export type TableWithId = PgTable & {
  id: PgColumn;
};

/**
 * Represents a column from a specific table
 */
export type TableColumn<TTable> = {
  [K in keyof TTable]: TTable[K] extends PgColumn ? TTable[K] : never;
}[keyof TTable];

/**
 * Configuration for validating unique fields in an entity
 * @template TTable - The database table type
 */
export type UniqueFieldConfig<TTable extends TableWithId> = {
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
