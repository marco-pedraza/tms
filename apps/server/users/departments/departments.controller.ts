import { api } from 'encore.dev/api';
import { departmentRepository } from './departments.repository';
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  Department,
  PaginatedDepartments,
  Departments,
} from './departments.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('DepartmentsController');

/**
 * Creates a new department.
 * @param params - The department data to create
 * @returns {Promise<Department>} The created department
 * @throws {APIError} If the department creation fails
 */
export const createDepartment = api(
  { method: 'POST', path: '/departments', expose: true, auth: true },
  async (params: CreateDepartmentPayload): Promise<Department> => {
    return await withErrorHandling('createDepartment', () =>
      departmentRepository.create(params),
    );
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
  { method: 'GET', path: '/departments/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Department> => {
    return await withErrorHandling('getDepartment', () =>
      departmentRepository.findOne(id),
    );
  },
);

/**
 * Retrieves all departments.
 * @returns {Promise<Departments>} List of all departments
 * @throws {APIError} If retrieval fails
 */
export const listDepartments = api(
  { method: 'GET', path: '/departments', expose: true, auth: true },
  async (): Promise<Departments> => {
    return await withErrorHandling('listDepartments', async () => {
      const departments = await departmentRepository.findAll();
      return { departments };
    });
  },
);

/**
 * Retrieves departments with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedDepartments>} Paginated list of departments
 * @throws {APIError} If retrieval fails
 */
export const listDepartmentsWithPagination = api(
  { method: 'GET', path: '/departments/paginated', expose: true, auth: true },
  async (params: PaginationParams): Promise<PaginatedDepartments> => {
    return await withErrorHandling('listDepartmentsWithPagination', () =>
      departmentRepository.findAllPaginated(params),
    );
  },
);

/**
 * Retrieves all departments for a specific tenant.
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant to get departments for
 * @returns {Promise<Departments>} List of departments for the tenant
 * @throws {APIError} If retrieval fails
 */
export const listTenantDepartments = api(
  {
    method: 'GET',
    path: '/tenants/:tenantId/departments',
    expose: true,
    auth: true,
  },
  async ({ tenantId }: { tenantId: number }): Promise<Departments> => {
    return await withErrorHandling('listTenantDepartments', () =>
      departmentRepository.findByTenant(tenantId),
    );
  },
);

/**
 * Retrieves paginated departments for a specific tenant.
 * @param params - Object containing the tenant ID and pagination parameters
 * @param params.tenantId - The ID of the tenant to get departments for
 * @returns {Promise<PaginatedDepartments>} Paginated list of departments for the tenant
 * @throws {APIError} If retrieval fails
 */
export const listTenantDepartmentsWithPagination = api(
  {
    method: 'GET',
    path: '/tenants/:tenantId/departments/paginated',
    expose: true,
    auth: true,
  },
  async ({
    tenantId,
    ...paginationParams
  }: {
    tenantId: number;
  } & PaginationParams): Promise<PaginatedDepartments> => {
    return await withErrorHandling('listTenantDepartmentsWithPagination', () =>
      departmentRepository.findByTenantPaginated(tenantId, paginationParams),
    );
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
  { method: 'PUT', path: '/departments/:id', expose: true, auth: true },
  async ({
    id,
    ...data
  }: UpdateDepartmentPayload & { id: number }): Promise<Department> => {
    return await withErrorHandling('updateDepartment', () =>
      departmentRepository.update(id, data),
    );
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
  { method: 'DELETE', path: '/departments/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Department> => {
    return await withErrorHandling('deleteDepartment', () =>
      departmentRepository.delete(id),
    );
  },
);
