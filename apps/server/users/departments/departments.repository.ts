import { departments } from './departments.schema';
import type {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  PaginatedDepartments,
  Departments,
} from './departments.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

export const createDepartmentRepository = () => {
  const baseRepository = createBaseRepository<
    Department,
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
    typeof departments
  >(db, departments, 'Department');

  const create = async (data: CreateDepartmentPayload): Promise<Department> => {
    return baseRepository.create(data);
  };

  const update = async (
    id: number,
    data: UpdateDepartmentPayload,
  ): Promise<Department> => {
    return baseRepository.update(id, data);
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedDepartments> => {
    return baseRepository.findAllPaginated(params);
  };

  const findByTenant = async (tenantId: number): Promise<Departments> => {
    const result =
      (await baseRepository.findBy(departments.tenantId, tenantId)) || [];
    return { departments: Array.isArray(result) ? result : [result] };
  };

  const findByTenantPaginated = async (
    tenantId: number,
    params: PaginationParams = {},
  ): Promise<PaginatedDepartments> => {
    return baseRepository.findByPaginated(
      departments.tenantId,
      tenantId,
      params,
    );
  };

  return {
    ...baseRepository,
    create,
    update,
    findAllPaginated,
    findByTenant,
    findByTenantPaginated,
  };
};

export const departmentRepository = createDepartmentRepository();
