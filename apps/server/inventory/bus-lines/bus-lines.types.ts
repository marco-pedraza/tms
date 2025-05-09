import { MinLen, MatchesRegexp, Min } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

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

  /** Description of the bus line */
  description: string | null;

  /** URL to the bus line's logo */
  logoUrl: string | null;

  /** Primary color of the bus line (hex code) */
  primaryColor: string | null;

  /** Secondary color of the bus line (hex code) */
  secondaryColor: string | null;

  /** Whether the bus line is currently active in the system */
  active: boolean;

  /** Timestamp when the bus line record was created */
  createdAt: Date | null;

  /** Timestamp when the bus line record was last updated */
  updatedAt: Date | null;
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
   * Description of the bus line
   */
  description?: string;

  /**
   * URL to the bus line's logo
   */
  logoUrl?: string;

  /**
   * Primary color of the bus line (hex code)
   * Must be a valid hex color code
   */
  primaryColor?: string & MatchesRegexp<'^#[0-9A-Fa-f]{6}$'>;

  /**
   * Secondary color of the bus line (hex code)
   * Must be a valid hex color code
   */
  secondaryColor?: string & MatchesRegexp<'^#[0-9A-Fa-f]{6}$'>;

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
   * Description of the bus line
   */
  description?: string;

  /**
   * URL to the bus line's logo
   */
  logoUrl?: string;

  /**
   * Primary color of the bus line (hex code)
   * Must be a valid hex color code
   */
  primaryColor?: string & MatchesRegexp<'^#[0-9A-Fa-f]{6}$'>;

  /**
   * Secondary color of the bus line (hex code)
   * Must be a valid hex color code
   */
  secondaryColor?: string & MatchesRegexp<'^#[0-9A-Fa-f]{6}$'>;

  /**
   * Whether the bus line is active
   */
  active?: boolean;
}

/**
 * Response type for the list bus lines endpoint (non-paginated)
 */
export interface BusLines {
  /** List of bus line entities */
  busLines: BusLine[];
}

/**
 * Query options for filtering and ordering bus lines
 */
export interface BusLinesQueryOptions {
  orderBy?: { field: keyof BusLine; direction: 'asc' | 'desc' }[];
  filters?: Partial<BusLine>;
}

/**
 * Paginated response type for the list bus lines endpoint
 */
export type PaginatedBusLines = PaginatedResult<BusLine>;

/**
 * Pagination parameters with bus lines query options
 */
export interface PaginationParamsBusLines
  extends PaginationParams,
    BusLinesQueryOptions {}
