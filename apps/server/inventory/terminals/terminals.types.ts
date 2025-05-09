import { MinLen, MatchesRegexp, Min, Max } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

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
 * Represents a time slot for operating hours
 */
export interface TimeSlot {
  /** Opening time in format HH:MM (24-hour format) */
  open: string;

  /** Closing time in format HH:MM (24-hour format) */
  close: string;
}

/**
 * Represents operating hours for a terminal
 */
export interface OperatingHours {
  /** Monday opening hours */
  monday?: TimeSlot[];

  /** Tuesday opening hours */
  tuesday?: TimeSlot[];

  /** Wednesday opening hours */
  wednesday?: TimeSlot[];

  /** Thursday opening hours */
  thursday?: TimeSlot[];

  /** Friday opening hours */
  friday?: TimeSlot[];

  /** Saturday opening hours */
  saturday?: TimeSlot[];

  /** Sunday opening hours */
  sunday?: TimeSlot[];
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
   * Must be a number between -90 and 90
   */
  latitude: number & Min<-90> & Max<90>;

  /**
   * Longitude coordinate of the terminal
   * Must be a number between -180 and 180
   */
  longitude: number & Min<-180> & Max<180>;

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
   * Must be a number between -90 and 90
   */
  latitude?: number & Min<-90> & Max<90>;

  /**
   * Longitude coordinate of the terminal
   * Must be a number between -180 and 180
   */
  longitude?: number & Min<-180> & Max<180>;

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

export interface TerminalsQueryOptions {
  orderBy?: { field: keyof Terminal; direction: 'asc' | 'desc' }[];
  filters?: Partial<Terminal>;
}

export type PaginatedTerminals = PaginatedResult<Terminal>;

export interface PaginationParamsTerminals
  extends PaginationParams,
    TerminalsQueryOptions {}
