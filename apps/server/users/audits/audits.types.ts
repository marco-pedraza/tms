import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Represents a user audit record
 */
export interface Audit {
  /** Unique identifier for the audit record */
  id: number;

  /** ID of the user this audit is for */
  userId: number;

  /** The service or module that initiated the audit entry */
  service: string;

  /** The specific API endpoint accessed */
  endpoint: string | null;

  /** Content of the audit entry with detailed information */
  details: Record<string, unknown> | null;

  /** IP address from which the audit was performed */
  ipAddress: string | null;

  /** User agent of the browser/application that performed the audit */
  userAgent: string | null;

  /** Timestamp when the audit record was created */
  createdAt: Date;
}

/**
 * Payload for creating a new audit record
 */
export interface CreateAuditPayload {
  /**
   * ID of the user this audit is for
   */
  userId: number;

  /**
   * The service or module that initiated the audit entry
   */
  service: string;

  /**
   * The specific API endpoint accessed
   */
  endpoint?: string;

  /**
   * Content of the audit entry with detailed information
   */
  details?: Record<string, unknown>;

  /**
   * IP address from which the audit was performed
   */
  ipAddress?: string;

  /**
   * User agent of the browser/application that performed the audit
   */
  userAgent?: string;
}

/**
 * Response for listing all audits
 */
export interface Audits {
  /** List of audit records */
  audits: Audit[];
}

/**
 * Query options for filtering and ordering bus lines
 */
export interface AuditsQueryOptions {
  orderBy?: { field: keyof Audit; direction: 'asc' | 'desc' }[];
  filters?: Partial<Audit>;
}

/**
 * Paginated response type for the list bus lines endpoint
 */
export type PaginatedAudits = PaginatedResult<Audit>;

/**
 * Pagination parameters with bus lines query options
 */
export interface PaginationParamsAudits
  extends PaginationParams,
    AuditsQueryOptions {}
