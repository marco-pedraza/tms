import { MinLen } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * ServiceType from database
 */
export interface ServiceType {
  /** Unique identifier for the service type */
  id: number;
  /** Name of the service type */
  name: string;
  /** Description of what this service type represents */
  description: string;
  /** Whether this service type is currently active */
  active: boolean;
  /** Timestamp when this service type was created */
  createdAt: Date;
  /** Timestamp when this service type was last updated */
  updatedAt: Date;
}

/**
 * ServiceTypes list response type for Encore API compatibility
 */
export interface ServiceTypes {
  serviceTypes: ServiceType[];
}

/**
 * ServiceType creation payload
 */
export interface CreateServiceTypePayload {
  /**
   * Name of the service type
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1>;

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
  name?: string & MinLen<1>;

  /**
   * Description of the service type
   */
  description?: string;

  /**
   * Whether the service type is active
   */
  active?: boolean;
}

/**
 * Query options for filtering service types
 */
export interface ServiceTypesQueryOptions {
  orderBy?: { field: keyof ServiceType; direction: 'asc' | 'desc' }[];
  filters?: Partial<ServiceType>;
  searchTerm?: string;
}

/**
 * Paginated ServiceTypes response type
 */
export type PaginatedServiceTypes = PaginatedResult<ServiceType>;

/**
 * Pagination parameters for service types with query options
 */
export interface PaginationParamsServiceTypes
  extends PaginationParams,
    ServiceTypesQueryOptions {}
