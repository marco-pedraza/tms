import { MinLen, MatchesRegexp, Min } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Base interface representing a transporter entity
 */
export interface Transporter {
  /** Unique identifier for the transporter */
  id: number;

  /** Name of the transportation company */
  name: string;

  /** Unique business code for the transporter */
  code: string;

  /** Description of the transporter */
  description: string | null;

  /** Website URL of the transporter */
  website: string | null;

  /** Contact email of the transporter */
  email: string | null;

  /** Contact phone number of the transporter */
  phone: string | null;

  /** ID of the city where the transporter is headquartered */
  headquarterCityId: number | null;

  /** URL to the transporter's logo */
  logoUrl: string | null;

  /** Additional contact information */
  contactInfo: string | null;

  /** Regulatory license number */
  licenseNumber: string | null;

  /** Whether the transporter is currently active in the system */
  active: boolean;

  /** Timestamp when the transporter record was created */
  createdAt: Date | null;

  /** Timestamp when the transporter record was last updated */
  updatedAt: Date | null;
}

/**
 * Input for creating a new transporter
 */
export interface CreateTransporterPayload {
  /**
   * The name of the transportation company
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique business code for the transporter (1-10 characters)
   * Must contain only uppercase letters, numbers, and hyphens
   */
  code: string & MinLen<1> & MatchesRegexp<'^[A-Z0-9-]{1,10}$'>;

  /**
   * Description of the transporter
   */
  description?: string;

  /**
   * Website URL of the transporter
   */
  website?: string;

  /**
   * Contact email of the transporter
   */
  email?: string;

  /**
   * Contact phone number of the transporter
   */
  phone?: string;

  /**
   * ID of the city where the transporter is headquartered
   * Must be a positive number
   */
  headquarterCityId?: number & Min<1>;

  /**
   * URL to the transporter's logo
   */
  logoUrl?: string;

  /**
   * Additional contact information
   */
  contactInfo?: string;

  /**
   * Regulatory license number
   */
  licenseNumber?: string;

  /**
   * Whether the transporter is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a transporter
 */
export interface UpdateTransporterPayload {
  /**
   * The name of the transportation company
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique business code for the transporter (1-10 characters)
   * Must contain only uppercase letters, numbers, and hyphens
   */
  code?: string & MinLen<1> & MatchesRegexp<'^[A-Z0-9-]{1,10}$'>;

  /**
   * Description of the transporter
   */
  description?: string;

  /**
   * Website URL of the transporter
   */
  website?: string;

  /**
   * Contact email of the transporter
   */
  email?: string;

  /**
   * Contact phone number of the transporter
   */
  phone?: string;

  /**
   * ID of the city where the transporter is headquartered
   * Must be a positive number
   */
  headquarterCityId?: number & Min<1>;

  /**
   * URL to the transporter's logo
   */
  logoUrl?: string;

  /**
   * Additional contact information
   */
  contactInfo?: string;

  /**
   * Regulatory license number
   */
  licenseNumber?: string;

  /**
   * Whether the transporter is active
   */
  active?: boolean;
}

/**
 * Paginated response type for the list transporters endpoint
 */
export type PaginatedTransporters = PaginatedResult<Transporter>;
