import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { departments } from './departments.schema';
import type {
  CreateDepartmentPayload,
  Department,
  DepartmentsQueryOptions,
  PaginatedDepartments,
  PaginationParamsDepartments,
  UpdateDepartmentPayload,
} from './departments.types';

/**
 * Creates a repository for managing department entities
 * @returns {Object} An object containing department-specific operations and base CRUD operations
 */
export function createDepartmentRepository() {
  const baseRepository = createBaseRepository<
    Department,
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
    typeof departments
  >(db, departments, 'Department', {
    searchableFields: [departments.name, departments.code],
  });

  /**
   * Finds departments by tenant ID with optional filtering and ordering
   * @param tenantId Tenant ID
   * @param options Query options for filtering and ordering
   * @returns Array of departments
   */
  async function findByTenant(
    tenantId: number,
    options: DepartmentsQueryOptions = {},
  ): Promise<Department[]> {
    const mergedOptions: DepartmentsQueryOptions = {
      ...options,
      filters: {
        ...(options.filters ?? {}),
        tenantId,
      },
    };
    return await baseRepository.findAll(mergedOptions);
  }

  /**
   * Finds departments by tenant ID with pagination
   * @param tenantId Tenant ID
   * @param params Pagination, filtering, and ordering parameters
   * @returns Paginated result of departments
   */
  async function findByTenantPaginated(
    tenantId: number,
    params: PaginationParamsDepartments = {},
  ): Promise<PaginatedDepartments> {
    const mergedParams: PaginationParamsDepartments = {
      ...params,
      filters: {
        ...(params.filters ?? {}),
        tenantId,
      },
    };
    return await baseRepository.findAllPaginated(mergedParams);
  }

  return {
    ...baseRepository,
    findByTenant,
    findByTenantPaginated,
  };
}

// Export the department repository instance
export const departmentRepository = createDepartmentRepository();
