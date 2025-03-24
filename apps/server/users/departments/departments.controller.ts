import { api } from 'encore.dev/api';
import { departmentHandler } from './departments.handler';
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  Department,
  Departments,
  PaginatedDepartments,
} from './departments.types';
import { parseApiError } from '../../shared/errors';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new department.
 * @param params - The department data to create
 * @returns {Promise<Department>} The created department
 * @throws {APIError} If the department creation fails
 */
export const createDepartment = api(
  { method: 'POST', path: '/departments', expose: true },
  async (params: CreateDepartmentPayload): Promise<Department> => {
    try {
      return await departmentHandler.create(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves a department by ID.
 * @param params - Object containing the department ID
 * @param params.id - The ID of the department to retrieve
 * @returns {Promise<Department>} The found department
 * @throws {APIError} If the department is not found or retrieval fails
 */
export const getDepartment = api(
  { method: 'GET', path: '/departments/:id', expose: true },
  async ({ id }: { id: number }): Promise<Department> => {
    try {
      return await departmentHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all departments.
 * @deprecated Use listDepartmentsWithPagination instead
 * @returns {Promise<Departments>} List of all departments
 * @throws {APIError} If the retrieval fails
 */
export const listDepartments = api(
  { method: 'GET', path: '/departments', expose: true },
  async (): Promise<Departments> => {
    try {
      return await departmentHandler.findAll();
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves departments with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedDepartments>} Paginated list of departments
 * @throws {APIError} If retrieval fails
 */
export const listDepartmentsWithPagination = api(
  { method: 'GET', path: '/departments/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedDepartments> => {
    try {
      return await departmentHandler.findAllPaginated(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all departments for a specific tenant.
 * @deprecated Use listTenantDepartmentsWithPagination instead
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant to retrieve departments for
 * @returns {Promise<Departments>} List of departments for the tenant
 * @throws {APIError} If the retrieval fails
 */
export const listTenantDepartments = api(
  { method: 'GET', path: '/tenants/:tenantId/departments', expose: true },
  async ({ tenantId }: { tenantId: number }): Promise<Departments> => {
    try {
      return await departmentHandler.findByTenant(tenantId);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves departments for a specific tenant with pagination.
 * @param params - Object containing the tenant ID and pagination parameters
 * @param params.tenantId - The ID of the tenant to retrieve departments for
 * @returns {Promise<PaginatedDepartments>} Paginated list of departments for the tenant
 * @throws {APIError} If retrieval fails
 */
export const listTenantDepartmentsWithPagination = api(
  {
    method: 'GET',
    path: '/tenants/:tenantId/departments/paginated',
    expose: true,
  },
  async ({
    tenantId,
    ...paginationParams
  }: {
    tenantId: number;
  } & PaginationParams): Promise<PaginatedDepartments> => {
    try {
      return await departmentHandler.findByTenantPaginated(
        tenantId,
        paginationParams,
      );
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Updates an existing department.
 * @param params - Object containing the department ID and update data
 * @param params.id - The ID of the department to update
 * @returns {Promise<Department>} The updated department
 * @throws {APIError} If the department is not found or update fails
 */
export const updateDepartment = api(
  { method: 'PUT', path: '/departments/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateDepartmentPayload & { id: number }): Promise<Department> => {
    try {
      return await departmentHandler.update(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Deletes a department by ID.
 * @param params - Object containing the department ID
 * @param params.id - The ID of the department to delete
 * @returns {Promise<Department>} The deleted department
 * @throws {APIError} If the department is not found or deletion fails
 */
export const deleteDepartment = api(
  { method: 'DELETE', path: '/departments/:id', expose: true },
  async ({ id }: { id: number }): Promise<Department> => {
    try {
      return await departmentHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
