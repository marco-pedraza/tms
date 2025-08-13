import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import { ServiceType } from '@/inventory/operators/service-types/service-types.types';
import { Transporter } from '@/inventory/operators/transporters/transporters.types';

/**
 * Base interface representing a bus line entity
 */
export interface BusLine {
  /** Unique identifier for the bus line */
  id: number;

  /** Name of the bus line */
  name: string;

  /** Unique business code for the bus line */
  code: string;

  /** ID of the transporter that operates this bus line */
  transporterId: number;

  /** ID of the service type of this bus line */
  serviceTypeId: number;

  /** Multiplier for price per kilometer */
  pricePerKilometer: number;

  /** Description of the bus line */
  description: string | null;

  /** Number of vehicles in the fleet */
  fleetSize: number | null;

  /** Website */
  website: string | null;

  /** Email */
  email: string | null;

  /** Phone */
  phone: string | null;

  /** Whether the bus line is currently active in the system */
  active: boolean;

  /** Timestamp when the bus line record was created */
  createdAt: Date | string | null;

  /** Timestamp when the bus line record was last updated */
  updatedAt: Date | string | null;
}

export interface BusLineWithTransporterAndServiceType extends BusLine {
  transporter: Transporter;
  serviceType: ServiceType;
}

/**
 * Input for creating a new bus line
 */
export interface CreateBusLinePayload {
  /**
   * The name of the bus line
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique business code for the bus line (1-20 characters)
   * Must contain only uppercase letters, numbers, and hyphens
   */
  code: string & MinLen<1> & MatchesRegexp<'^[A-Z0-9-]{1,20}$'>;

  /**
   * ID of the transporter that operates this bus line
   * Must be a positive number
   */
  transporterId: number & Min<1>;

  /**
   * ID of the service type of this bus line
   * Must be a positive number
   */
  serviceTypeId: number & Min<1>;

  /**
   * Multiplier for price per kilometer
   * Must be a positive number
   * @default 1
   */
  pricePerKilometer?: number & Min<1>;

  /**
   * Description of the bus line
   */
  description?: string;

  /**
   * Number of vehicles in the fleet
   */
  fleetSize?: (number & Min<1>) | null;

  /**
   * Website
   */
  website?: string;

  /**
   * Email
   */
  email?: string;

  /**
   * Phone
   */
  phone?: string;

  /**
   * Whether the bus line is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a bus line
 */
export interface UpdateBusLinePayload {
  /**
   * The name of the bus line
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique business code for the bus line (1-20 characters)
   * Must contain only uppercase letters, numbers, and hyphens
   */
  code?: string & MinLen<1> & MatchesRegexp<'^[A-Z0-9-]{1,20}$'>;

  /**
   * ID of the transporter that operates this bus line
   * Must be a positive number
   */
  transporterId?: number & Min<1>;

  /**
   * ID of the service type of this bus line
   * Must be a positive number
   */
  serviceTypeId?: number & Min<1>;

  /**
   * Multiplier for price per kilometer
   * Must be a positive number
   */
  pricePerKilometer?: number & Min<1>;

  /**
   * Description of the bus line
   */
  description?: string;

  /**
   * Number of vehicles in the fleet
   */
  fleetSize?: (number & Min<1>) | null;

  /**
   * Website
   */
  website?: string;

  /**
   * Email
   */
  email?: string;

  /**
   * Phone
   */
  phone?: string;

  /**
   * Whether the bus line is active
   */
  active?: boolean;
}

/**
 * Unified list query parameters for bus lines (non-paginated)
 */
export type ListBusLinesQueryParams = ListQueryParams<BusLine>;

/**
 * Unified list result for bus lines (non-paginated)
 */
export type ListBusLinesResult = ListQueryResult<BusLine>;

/**
 * Unified paginated list query parameters for bus lines
 */
export type PaginatedListBusLinesQueryParams =
  PaginatedListQueryParams<BusLine>;

/**
 * Unified paginated list result for bus lines
 */
export type PaginatedListBusLinesResult =
  PaginatedListQueryResult<BusLineWithTransporterAndServiceType>;
