import { api } from 'encore.dev/api';
import type {
  CreateDepartmentPayload,
  Department,
  Departments,
  DepartmentsQueryOptions,
  PaginatedDepartments,
  PaginationParamsDepartments,
  UpdateDepartmentPayload,
} from './departments.types';
import { departmentRepository } from './departments.repository';

/**
 * Creates a new department.
 * @param params - The department data to create
 * @returns {Promise<Department>} The created department
 * @throws {APIError} If the department creation fails
 */
export const createDepartment = api(
  { method: 'POST', path: '/departments', expose: true, auth: true },
  async (params: CreateDepartmentPayload): Promise<Department> => {
    return await departmentRepository.create(params);
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
    return await departmentRepository.findOne(id);
  },
);

/**
 * Retrieves all departments with optional filtering and ordering (useful for dropdowns).
 * @param params - Query options for filtering and ordering
 * @returns {Promise<Departments>} List of all departments
 * @throws {APIError} If retrieval fails
 */
export const listDepartments = api(
  { method: 'POST', path: '/get-departments', expose: true, auth: false },
  async (params: DepartmentsQueryOptions): Promise<Departments> => {
    const departments = await departmentRepository.findAll(params);
    return { departments };
  },
);

/**
 * Retrieves departments with pagination, filtering, and ordering (useful for tables).
 * @param params - Pagination, filtering, and ordering parameters
 * @returns {Promise<PaginatedDepartments>} Paginated list of departments
 * @throws {APIError} If retrieval fails
 */
export const listDepartmentsPaginated = api(
  {
    method: 'POST',
    path: '/get-departments/paginated',
    expose: true,
    auth: true,
  },
  async (
    params: PaginationParamsDepartments,
  ): Promise<PaginatedDepartments> => {
    return await departmentRepository.findAllPaginated(params);
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
    return await departmentRepository.update(id, data);
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
    return await departmentRepository.delete(id);
  },
);

/**
 * Searches for departments by matching a search term against name, code, and description.
 * @param params - Search parameters
 * @param params.term - The search term to match against department fields
 * @returns {Promise<Departments>} List of matching departments
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchDepartments = api(
  { method: 'GET', path: '/departments/search', expose: true, auth: true },
  async ({ term }: { term: string }): Promise<Departments> => {
    const departments = await departmentRepository.search(term);
    return { departments };
  },
);

/**
 * Searches for departments with pagination by matching a search term against name, code, and description.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against department fields
 * @returns {Promise<PaginatedDepartments>} Paginated list of matching departments
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchDepartmentsPaginated = api(
  {
    method: 'POST',
    path: '/departments/search/paginated',
    expose: true,
    auth: true,
  },
  async ({
    term,
    ...params
  }: PaginationParamsDepartments & {
    term: string;
  }): Promise<PaginatedDepartments> => {
    return await departmentRepository.searchPaginated(term, params);
  },
);
