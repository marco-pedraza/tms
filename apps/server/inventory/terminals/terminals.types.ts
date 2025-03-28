import { MinLen, MatchesRegexp, Min } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Represents a facility available at a terminal
 */
export interface Facility {
  /** Name of the facility */
  name: string;

  /** Description of the facility */
  description?: string;

  /** Icon or image representing the facility */
  icon?: string;
}

/**
 * Represents operating hours for a terminal
 */
export interface OperatingHours {
  /** Monday opening hours */
  monday?: { open: string; close: string };

  /** Tuesday opening hours */
  tuesday?: { open: string; close: string };

  /** Wednesday opening hours */
  wednesday?: { open: string; close: string };

  /** Thursday opening hours */
  thursday?: { open: string; close: string };

  /** Friday opening hours */
  friday?: { open: string; close: string };

  /** Saturday opening hours */
  saturday?: { open: string; close: string };

  /** Sunday opening hours */
  sunday?: { open: string; close: string };

  /** Note about operating hours */
  notes?: string;
}

/**
 * Base interface representing a terminal entity
 */
export interface Terminal {
  /** Unique identifier for the terminal */
  id: number;

  /** Name of the terminal */
  name: string;

  /** Physical address of the terminal */
  address: string;

  /** ID of the city where the terminal is located */
  cityId: number;

  /** Latitude coordinate */
  latitude: number;

  /** Longitude coordinate */
  longitude: number;

  /** Contact phone number for the terminal */
  contactphone?: string | null;

  /** Operating hours of the terminal */
  operatingHours?: OperatingHours | unknown;

  /** List of facilities available at the terminal */
  facilities?: Facility[] | unknown;

  /** Terminal code (unique identifier) */
  code: string;

  /** URL-friendly identifier for the terminal */
  slug: string;

  /** Whether the terminal is currently active in the system */
  active: boolean;

  /** Timestamp when the terminal record was created */
  createdAt: Date | null;

  /** Timestamp when the terminal record was last updated */
  updatedAt: Date | null;
}

/**
 * Input for creating a new terminal
 */
export interface CreateTerminalPayload {
  /**
   * The name of the terminal
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Physical address of the terminal
   * Must have at least 1 non-whitespace character
   */
  address: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * The ID of the city where the terminal is located
   * Must be a positive number
   */
  cityId: number & Min<1>;

  /**
   * Latitude coordinate of the terminal
   * Must be a valid latitude value
   */
  latitude: number & Min<1>;

  /**
   * Longitude coordinate of the terminal
   * Must be a valid longitude value
   */
  longitude: number & Min<1>;

  /**
   * Contact phone number for the terminal
   */
  contactphone?: string;

  /**
   * Operating hours of the terminal
   */
  operatingHours?: OperatingHours;

  /**
   * List of facilities available at the terminal
   */
  facilities?: Facility[];

  /**
   * Terminal code (unique identifier)
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * URL-friendly identifier for the terminal
   * Must be lowercase, can contain only letters, numbers and hyphens
   * No consecutive hyphens, special characters or spaces allowed
   * Format examples: 'central-norte', 'tapo', 'observatorio'
   */
  slug: string & MinLen<1> & MatchesRegexp<'^[a-z0-9]+(?:-[a-z0-9]+)*$'>;

  /**
   * Whether the terminal is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a terminal
 */
export interface UpdateTerminalPayload {
  /**
   * The name of the terminal
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Physical address of the terminal
   * Must have at least 1 non-whitespace character
   */
  address?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * The ID of the city where the terminal is located
   * Must be a positive number
   */
  cityId?: number & Min<1>;

  /**
   * Latitude coordinate of the terminal
   */
  latitude?: number & Min<1>;

  /**
   * Longitude coordinate of the terminal
   */
  longitude?: number & Min<1>;

  /**
   * Contact phone number for the terminal
   */
  contactphone?: string;

  /**
   * Operating hours of the terminal
   */
  operatingHours?: OperatingHours;

  /**
   * List of facilities available at the terminal
   */
  facilities?: Facility[];

  /**
   * Terminal code (unique identifier)
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * URL-friendly identifier for the terminal
   * Must be lowercase, can contain only letters, numbers and hyphens
   * No consecutive hyphens, special characters or spaces allowed
   * Format examples: 'central-norte', 'tapo', 'observatorio'
   */
  slug?: string & MinLen<1> & MatchesRegexp<'^[a-z0-9]+(?:-[a-z0-9]+)*$'>;

  /**
   * Whether the terminal is active
   */
  active?: boolean;
}

/**
 * Response type for the list terminals endpoint
 */
export interface Terminals {
  /** List of terminals */
  terminals: Terminal[];
}

/**
 * Paginated response type for the list terminals endpoint
 */
export type PaginatedTerminals = PaginatedResult<Terminal>;
