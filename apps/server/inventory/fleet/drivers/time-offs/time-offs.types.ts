// API types
import { MatchesRegexp } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Enum for time-off types
 */
export enum TimeOffType {
  VACATION = 'VACATION',
  LEAVE = 'LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  PERSONAL_DAY = 'PERSONAL_DAY',
  OTHER = 'OTHER',
}

/**
 * Base interface representing a driver time-off entity
 */
export interface DriverTimeOff {
  /** Unique identifier for the time-off */
  id: number;

  /** ID of the driver this time-off belongs to */
  driverId: number;

  /** Start date of the time-off (inclusive) */
  startDate: Date | string;

  /** End date of the time-off (inclusive) */
  endDate: Date | string;

  /** Type of time-off */
  type: TimeOffType;

  /** Reason for the time-off */
  reason: string | null;

  /** Timestamp when the time-off record was created */
  createdAt: Date | string | null;

  /** Timestamp when the time-off record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new driver time-off
 */
export interface CreateDriverTimeOffPayload {
  /**
   * Start date of the time-off (inclusive)
   */
  startDate:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * End date of the time-off (inclusive)
   */
  endDate:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * Type of time-off
   */
  type: TimeOffType;

  /**
   * Optional reason for the time-off
   */
  reason?: string | null;
}

/**
 * Input for updating a driver time-off
 */
export interface UpdateDriverTimeOffPayload {
  /**
   * Start date of the time-off (inclusive)
   */
  startDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * End date of the time-off (inclusive)
   */
  endDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * Type of time-off
   */
  type?: TimeOffType;

  /**
   * Optional reason for the time-off
   */
  reason?: string | null;
}

export type ListDriverTimeOffsResult = ListQueryResult<DriverTimeOff>;
export type ListDriverTimeOffsQueryParams = ListQueryParams<DriverTimeOff>;

export type PaginatedListDriverTimeOffsQueryParams =
  PaginatedListQueryParams<DriverTimeOff>;
export type PaginatedListDriverTimeOffsResult =
  PaginatedListQueryResult<DriverTimeOff>;

export type CreateDriverTimeOffRepositoryPayload =
  CreateDriverTimeOffPayload & {
    driverId: number;
  };

export type UpdateDriverTimeOffRepositoryPayload =
  UpdateDriverTimeOffPayload & {
    id: number;
    driverId: number;
  };

/**
 * Payload for creating a time-off via API endpoint
 * Includes driverId from path parameter
 */
export interface CreateDriverTimeOffEndpointPayload
  extends CreateDriverTimeOffPayload {
  driverId: number;
}
