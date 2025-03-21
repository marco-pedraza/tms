import { api } from 'encore.dev/api';
import { departmentHandler } from './departments.handler';
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  Department,
  Departments,
  TenantDepartments,
} from './departments.types';
import { parseApiError } from '../../shared/errors';

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
  }
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
  async ({ id }: { id: string }): Promise<Department> => {
    try {
      return await departmentHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  }
);

/**
 * Retrieves all departments.
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
  }
);

/**
 * Retrieves all departments for a specific tenant.
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant to retrieve departments for
 * @returns {Promise<TenantDepartments>} List of departments for the tenant
 * @throws {APIError} If the retrieval fails
 */
export const listTenantDepartments = api(
  { method: 'GET', path: '/tenants/:tenantId/departments', expose: true },
  async ({ tenantId }: { tenantId: string }): Promise<TenantDepartments> => {
    try {
      return await departmentHandler.findByTenant(tenantId);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  }
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
  }: UpdateDepartmentPayload & { id: string }): Promise<Department> => {
    try {
      return await departmentHandler.update(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  }
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
  async ({ id }: { id: string }): Promise<Department> => {
    try {
      return await departmentHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  }
); 