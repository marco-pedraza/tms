// API types
import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Base interface representing a user entity
 */
export interface User {
  /** Unique identifier for the user */
  id: number;

  /** ID of the tenant this user belongs to */
  tenantId: number;

  /** ID of the department this user belongs to */
  departmentId: number;

  /** Username for login */
  username: string;

  /** Email address of the user */
  email: string;

  /** Hashed password (not exposed in API responses) */
  passwordHash: string;

  /** First name of the user */
  firstName: string;

  /** Last name of the user */
  lastName: string;

  /** Phone number of the user */
  phone: string | null;

  /** Job title/position of the user */
  position: string | null;

  /** Internal employee ID */
  employeeId: string | null;

  /** Multi-factor authentication settings */
  mfaSettings: Record<string, unknown> | null;

  /** Last login timestamp */
  lastLogin: Date | string | null;

  /** Whether the user is currently active */
  isActive: boolean;

  /** Whether the user is a system-wide admin */
  isSystemAdmin: boolean;

  /** Timestamp when the user record was created */
  createdAt: Date | string | null;

  /** Timestamp when the user record was last updated */
  updatedAt: Date | string | null;
}

/**
 * User without sensitive information for API responses
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Input for creating a new user
 */
export interface CreateUserPayload {
  /**
   * ID of the tenant this user belongs to
   */
  tenantId: number;

  /**
   * ID of the department this user belongs to
   */
  departmentId: number;

  /**
   * Username for login
   * Must have at least 3 non-whitespace characters
   */
  username: string & MinLen<3> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Email address of the user
   * Must be a valid email format
   */
  email: string &
    MatchesRegexp<'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'>;

  /**
   * Password for the user
   * Will be hashed before storage
   * Must have at least 8 characters
   */
  password: string & MinLen<8>;

  /**
   * First name of the user
   * Must have at least 1 non-whitespace character
   */
  firstName: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Last name of the user
   * Must have at least 1 non-whitespace character
   */
  lastName: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Phone number of the user
   */
  phone?: string;

  /**
   * Job title/position of the user
   */
  position?: string;

  /**
   * Internal employee ID
   */
  employeeId?: string;

  /**
   * Whether the user is currently active
   * @default true
   */
  isActive?: boolean;

  /**
   * Whether the user is a system-wide admin
   * @default false
   */
  isSystemAdmin?: boolean;
}

/**
 * Input for updating a user
 */
export interface UpdateUserPayload {
  /**
   * ID of the department this user belongs to
   */
  departmentId?: number;

  /**
   * Email address of the user
   * Must be a valid email format
   */
  email?: string &
    MatchesRegexp<'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'>;

  /**
   * First name of the user
   * Must have at least 1 non-whitespace character
   */
  firstName?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Last name of the user
   * Must have at least 1 non-whitespace character
   */
  lastName?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Phone number of the user
   */
  phone?: string;

  /**
   * Job title/position of the user
   */
  position?: string;

  /**
   * Internal employee ID
   */
  employeeId?: string;

  /**
   * Whether the user is currently active
   */
  isActive?: boolean;

  /**
   * Whether the user is a system-wide admin
   */
  isSystemAdmin?: boolean;
}

/**
 * Input for changing a user's password
 */
export interface ChangePasswordPayload {
  /**
   * Current password for verification
   */
  currentPassword: string & MinLen<1>;

  /**
   * New password to set
   * Must have at least 8 characters
   */
  newPassword: string & MinLen<8>;
}

/**
 * Response type for the list users endpoint
 */
export interface Users {
  /** List of users (without sensitive data) */
  users: SafeUser[];
}

export interface UsersQueryOptions {
  orderBy?: { field: keyof User; direction: 'asc' | 'desc' }[];
  filters?: Partial<SafeUser>;
}

/**
 * Paginated response type for the list users endpoint
 */
export type PaginatedUsers = PaginatedResult<SafeUser>;

export interface PaginationParamsUsers
  extends PaginationParams,
    UsersQueryOptions {}
