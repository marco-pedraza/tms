import type {
  ListQueryParams,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

// API types

/**
 * Represents a department entity
 */
export interface Department {
  /** Unique identifier for the department */
  id: number;

  /** Name of the department */
  name: string;

  /** Unique code identifier for the department */
  code: string;

  /** Optional description of the department */
  description?: string | null;

  /** Whether the department is currently active */
  isActive: boolean;

  /** Timestamp when the department record was created */
  createdAt: Date | string | null;

  /** Timestamp when the department record was last updated */
  updatedAt: Date | string | null;

  /** Timestamp when the department record was soft deleted (null if not deleted) */
  deletedAt?: Date | string | null;
}

/**
 * Payload for creating a new department
 */
export interface CreateDepartmentPayload {
  /**
   * Name of the department
   * @minLength 2
   */
  name: string;

  /**
   * Unique code for the department (alphanumeric with no spaces)
   * @minLength 2
   * @pattern ^[a-zA-Z0-9-]+$
   */
  code: string;

  /**
   * Optional description of the department
   */
  description?: string;
}

/**
 * Payload for updating a department
 */
export interface UpdateDepartmentPayload {
  /**
   * Updated name of the department
   * @minLength 2
   */
  name?: string;

  /**
   * Updated code for the department (alphanumeric with no spaces)
   * @minLength 2
   * @pattern ^[a-zA-Z0-9-]+$
   */
  code?: string;

  /**
   * Updated description of the department
   */
  description?: string;

  /**
   * Updated active status of the department
   */
  isActive?: boolean;
}

/**
 * Query options for departments (non-paginated)
 */
export type DepartmentsQueryOptions = ListQueryParams<Department>;

/**
 * Response for listing all departments (non-paginated)
 * Maintains backward compatibility with existing code that expects { departments }
 */
export interface Departments {
  departments: Department[];
}

/**
 * Query options for departments (paginated)
 */
export type PaginationParamsDepartments = PaginatedListQueryParams<Department>;

/**
 * Paginated response type for the list departments endpoint
 */
export type PaginatedDepartments = PaginatedListQueryResult<Department>;
