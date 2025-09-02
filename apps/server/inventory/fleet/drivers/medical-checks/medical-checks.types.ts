// API types
import { MatchesRegexp, Min } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Enum for medical check sources
 */
export enum MedicalCheckSource {
  MANUAL = 'manual',
  API = 'api',
}

/**
 * Enum for medical check results
 */
export enum MedicalCheckResult {
  FIT = 'fit',
  LIMITED = 'limited',
  UNFIT = 'unfit',
}

/**
 * Base interface representing a driver medical check entity
 */
export interface DriverMedicalCheck {
  /** Unique identifier for the medical check */
  id: number;

  /** ID of the driver this medical check belongs to */
  driverId: number;

  /** Date when the medical check was performed */
  checkDate: Date | string;

  /** Date when the next medical check is due */
  nextCheckDate: Date | string;

  /** Number of days until the next check is due */
  daysUntilNextCheck: number;

  /** Source or provider of the medical check */
  source: MedicalCheckSource;

  /** Optional notes about the medical check */
  notes: string | null;

  /** Result of the medical check */
  result: MedicalCheckResult;

  /** Timestamp when the medical check record was created */
  createdAt: Date | string | null;

  /** Timestamp when the medical check record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new driver medical check
 */
export interface CreateDriverMedicalCheckPayload {
  /**
   * Date when the medical check was performed
   */
  checkDate:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * Number of days until the next check is due
   */
  daysUntilNextCheck: number & Min<1>;

  /**
   * Result of the medical check
   */
  result: MedicalCheckResult;

  /**
   * Optional notes about the medical check
   */
  notes?: string | null;
}

/**
 * Input for updating a driver medical check
 */
export interface UpdateDriverMedicalCheckPayload {
  /**
   * Date when the medical check was performed
   */
  checkDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * Number of days until the next check is due
   */
  daysUntilNextCheck?: number & Min<1>;

  /**
   * Result of the medical check
   */
  result?: MedicalCheckResult;

  /**
   * Optional notes about the medical check
   */
  notes?: string | null;
}

export type ListDriverMedicalChecksResult = ListQueryResult<DriverMedicalCheck>;
export type ListDriverMedicalChecksQueryParams =
  ListQueryParams<DriverMedicalCheck>;

export type PaginatedListDriverMedicalChecksQueryParams =
  PaginatedListQueryParams<DriverMedicalCheck>;
export type PaginatedListDriverMedicalChecksResult =
  PaginatedListQueryResult<DriverMedicalCheck>;

export type CreateDriverMedicalCheckRepositoryPayload =
  CreateDriverMedicalCheckPayload & {
    driverId: number;
  };
