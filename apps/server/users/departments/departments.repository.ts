import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { departments } from './departments.schema';
import type {
  CreateDepartmentPayload,
  Department,
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
    softDeleteEnabled: true,
  });

  return {
    ...baseRepository,
  };
}

// Export the department repository instance
export const departmentRepository = createDepartmentRepository();
