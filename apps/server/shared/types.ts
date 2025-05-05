/**
 * NOTE: These types are duplicated from @repo/base-repo due to Encore limitations.
 * Encore has issues recognizing types imported from external packages,
 * so we need to maintain a local copy of these types.
 * If types are updated in @repo/base-repo, make sure to update them here as well.
 *
 * Original reference: packages/base-repo/src/types.ts
 */

/**
 * Type for ordering options
 */
export type OrderBy = { field: unknown; direction: 'asc' | 'desc' }[];

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
 * Query options combining pagination and ordering
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  orderBy?: OrderBy;
}
