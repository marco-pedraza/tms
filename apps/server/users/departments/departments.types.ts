import { PaginatedResult, PaginationParams } from '../../shared/types';

// API types

/**
 * Represents a department entity
 */
export interface Department {
  /** Unique identifier for the department */
  id: number;

  /** ID of the tenant this department belongs to */
  tenantId: number;

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
}

/**
 * Payload for creating a new department
 */
export interface CreateDepartmentPayload {
  /**
   * ID of the tenant this department belongs to
   */
  tenantId: number;

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
 * Response for listing all departments
 */
export interface Departments {
  /** List of departments */
  departments: Department[];
}

/**
 * Query options for departments
 */
export interface DepartmentsQueryOptions {
  orderBy?: { field: keyof Department; direction: 'asc' | 'desc' }[];
  filters?: Partial<Department>;
}

/**
 * Paginated response type for the list departments endpoint
 */
export type PaginatedDepartments = PaginatedResult<Department>;

/**
 * Combined pagination and query options for departments
 */
export interface PaginationParamsDepartments
  extends PaginationParams,
    DepartmentsQueryOptions {}
