import type {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Tollbooth entity (read-only value object)
 */
export interface Tollbooth {
  /** Node ID */
  id: number;

  /** Node code */
  code: string;

  /** Node name */
  name: string;

  /** Latitude coordinate */
  latitude: number;

  /** Longitude coordinate */
  longitude: number;

  /** Coverage radius in meters */
  radius: number;

  /** Toll price in pesos (null if not set) */
  tollPrice: number | null;

  /** Whether IAVE payment is enabled (null if not set) */
  iaveEnabled: boolean | null;

  /** IAVE provider name (optional) */
  iaveProvider: string | null;

  /** Whether the tollbooth is active */
  active: boolean;

  /** City ID */
  cityId: number;

  /** Population ID (optional) */
  populationId: number | null;

  /** Created timestamp */
  createdAt: Date | string | null;

  /** Updated timestamp */
  updatedAt: Date | string | null;
}

// List types
export type ListTollboothsQueryParams = ListQueryParams<Tollbooth>;
export type ListTollboothsResult = ListQueryResult<Tollbooth>;

export type PaginatedListTollboothsQueryParams =
  PaginatedListQueryParams<Tollbooth>;
export type PaginatedListTollboothsResult = PaginatedListQueryResult<Tollbooth>;

// Repository type
export interface TollboothRepository {
  findOne: (nodeId: number) => Promise<Tollbooth>;
  findByIds: (nodeIds: number[]) => Promise<Tollbooth[]>;
  findAll: (params?: ListTollboothsQueryParams) => Promise<Tollbooth[]>;
}
