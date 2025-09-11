import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import type {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import type { Amenity } from '@/inventory/shared-entities/amenities/amenities.types';

/**
 * ServiceType from database
 */
export interface ServiceType {
  /** Unique identifier for the service type */
  id: number;

  /** Name of the service type */
  name: string;

  /** Unique code for the service type */
  code: string;

  /** Description of what this service type represents */
  description: string | null;

  /** Whether this service type is currently active */
  active: boolean;

  /** Timestamp when this service type was created */
  createdAt: Date | string | null;

  /** Timestamp when this service type was last updated */
  updatedAt: Date | string | null;
}

/**
 * ServiceType with assigned amenities
 */
export interface ServiceTypeWithAmenities extends ServiceType {
  /** Amenities assigned to this service type */
  amenities: Amenity[];
}

/**
 * ServiceType creation payload
 */
export interface CreateServiceTypePayload {
  /**
   * Name of the service type
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique business code for the service type
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the service type (optional)
   */
  description?: string;

  /**
   * Whether the service type is active
   * @default true
   */
  active?: boolean;
}

/**
 * ServiceType update payload
 */
export interface UpdateServiceTypePayload {
  /**
   * Name of the service type
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique business code for the service type
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the service type
   */
  description?: string;

  /**
   * Whether the service type is active
   */
  active?: boolean;
}

/** Non-paginated list query params for service types */
export type ListServiceTypesQueryParams = ListQueryParams<ServiceType>;

/** Non-paginated list result for service types */
export type ListServiceTypesResult = ListQueryResult<ServiceType>;

/** Paginated list query params for service types */
export type PaginatedListServiceTypesQueryParams =
  PaginatedListQueryParams<ServiceType>;

/** Paginated list result for service types */
export type PaginatedListServiceTypesResult =
  PaginatedListQueryResult<ServiceType>;

/** Payload to assign amenities to a service type */
export interface AssignAmenitiesToServiceTypePayload {
  /** Amenity IDs to assign to the service type (replaces existing) */
  amenityIds: number[];
}
