/**
 * Shared types for the application.
 *
 * NOTE: Some types (PaginatedResult, PaginationMeta, PaginationParams) are duplicated
 * from @repo/base-repo due to Encore limitations. Encore has issues recognizing types
 * imported from external packages, so we need to maintain a local copy of these types.
 * If types are updated in @repo/base-repo, make sure to update them here as well.
 *
 * Other types in this file are domain-specific shared Value Objects used across
 * multiple bounded contexts within this application.
 *
 * Original reference for base types: packages/base-repo/src/types.ts
 */

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
}

/**
 * Seat configuration for a specific floor
 * This is a shared Value Object used across multiple bounded contexts:
 * - bus-diagram-models (templates)
 * - seat-diagrams (instances)
 * - bus-seat-models (seat templates)
 */
export interface FloorSeats {
  /** Floor number */
  floorNumber: number;

  /** Number of rows in this floor */
  numRows: number;

  /** Number of seats on the left side per row for this floor */
  seatsLeft: number;

  /** Number of seats on the right side per row for this floor */
  seatsRight: number;
}

/**
 * Enum for seat types
 * This is a shared Value Object used across multiple bounded contexts:
 * - bus-seats (actual seat instances)
 * - bus-seat-models (seat templates)
 */
export enum SeatType {
  REGULAR = 'regular',
  PREMIUM = 'premium',
  VIP = 'vip',
  BUSINESS = 'business',
  EXECUTIVE = 'executive',
}

/**
 * Enum for space types
 * This is a shared Value Object used across multiple bounded contexts:
 * - bus-seat-models
 */
export enum SpaceType {
  SEAT = 'seat',
  HALLWAY = 'hallway',
  BATHROOM = 'bathroom',
  EMPTY = 'empty',
  STAIRS = 'stairs',
}

/**
 * Seat position coordinates
 * This is a shared Value Object used across multiple bounded contexts:
 * - bus-seat-models (seat templates)
 * - bus-seats (actual seat instances)
 */
export interface SeatPosition {
  x: number;
  y: number;
}
