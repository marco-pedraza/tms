import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';

/**
 * Base interface representing a label entity
 */
export interface Label {
  /** Unique identifier for the label */
  id: number;

  /** Name of the label */
  name: string;

  /** Optional description of the label */
  description: string | null;

  /** Color of the label in hexadecimal format (#RRGGBB or #RGB) */
  color: string;

  /** Whether the label is active */
  active: boolean;

  /** Timestamp when the label record was created */
  createdAt: Date | string | null;

  /** Timestamp when the label record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Label entity with node count for listing operations
 */
export interface LabelWithNodeCount extends Label {
  /** Number of nodes associated with this label */
  nodeCount: number;
}

/**
 * Input for creating a new label
 */
export interface CreateLabelPayload {
  /**
   * Name of the label
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the label
   */
  description?: string;

  /**
   * Color of the label in hexadecimal format (#RRGGBB or #RGB)
   * Must be a valid hexadecimal color code
   */
  color: string &
    MinLen<1> &
    MatchesRegexp<'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'>;

  /**
   * Whether the label is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating an existing label
 */
export interface UpdateLabelPayload {
  /**
   * Name of the label
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the label
   */
  description?: string;

  /**
   * Color of the label in hexadecimal format (#RRGGBB or #RGB)
   * Must be a valid hexadecimal color code
   */
  color?: string &
    MinLen<1> &
    MatchesRegexp<'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'>;

  /**
   * Whether the label is active
   */
  active?: boolean;
}

export type ListLabelsQueryParams = ListQueryParams<Label>;
export type ListLabelsResult = ListQueryResult<LabelWithNodeCount>;

export type PaginatedListLabelsQueryParams = PaginatedListQueryParams<Label>;
export type PaginatedListLabelsResult =
  PaginatedListQueryResult<LabelWithNodeCount>;

/**
 * Metrics data for labels dashboard
 */
export interface LabelsMetrics {
  /** Total number of labels in the system */
  totalLabels: number;

  /** Number of labels that are currently assigned to at least one node */
  labelsInUse: number;

  /** Information about the most used labels (all labels with the highest node count) */
  mostUsedLabels: {
    /** Number of nodes assigned to this label */
    nodeCount: number;
    /** Name of the label */
    name: string;
    /** Color of the label */
    color: string;
  }[];
}
