import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Base interface representing a chromatic entity
 */
export interface Chromatic {
  /** Unique identifier for the chromatic */
  id: number;

  /** Name of the chromatic */
  name: string;

  /** URL of the chromatic image */
  imageUrl: string | null;

  /** Description of the chromatic */
  description: string | null;

  /** Whether the chromatic is active/available */
  active: boolean;

  /** Timestamp when the chromatic record was created */
  createdAt: Date | string;

  /** Timestamp when the chromatic record was last updated */
  updatedAt: Date | string;

  /** Timestamp when the chromatic was soft deleted */
  deletedAt: Date | string | null;
}

/**
 * Input for creating a new chromatic
 */
export interface CreateChromaticPayload {
  /**
   * Name of the chromatic
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * URL of the chromatic image
   */
  imageUrl?: string | null;

  /**
   * Description of the chromatic
   */
  description?: string | null;

  /**
   * Whether the chromatic is active/available
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating an existing chromatic
 */
export interface UpdateChromaticPayload {
  /**
   * Name of the chromatic
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * URL of the chromatic image
   */
  imageUrl?: string | null;

  /**
   * Description of the chromatic
   */
  description?: string | null;

  /**
   * Whether the chromatic is active/available
   */
  active?: boolean;
}

export type ListChromaticsQueryParams = ListQueryParams<Chromatic>;
export type ListChromaticsResult = ListQueryResult<Chromatic>;

export type PaginatedListChromaticsQueryParams =
  PaginatedListQueryParams<Chromatic>;
export type PaginatedListChromaticsResult = PaginatedListQueryResult<Chromatic>;
