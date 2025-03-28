import { departments } from './departments.schema';
import type {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  PaginatedDepartments,
  Departments,
} from './departments.types';
import { createBaseRepository } from '../../shared/base-repository';
import { PaginationParams } from '../../shared/types';

export const createDepartmentRepository = () => {
  const baseRepository = createBaseRepository<
    Department,
    CreateDepartmentPayload & {
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    UpdateDepartmentPayload & { updatedAt: Date },
    typeof departments
  >(departments, 'Department');

  const validateUniqueCode = async (
    code: string,
    tenantId: number,
    excludeId?: number,
  ) => {
    await baseRepository.validateUniqueness(
      [
        {
          field: departments.code,
          value: code,
          scope: {
            field: departments.tenantId,
            value: tenantId,
          },
        },
      ],
      excludeId,
      `Department with code ${code} already exists in this tenant`,
    );
  };

  const create = async (data: CreateDepartmentPayload): Promise<Department> => {
    await validateUniqueCode(data.code, data.tenantId);
    return baseRepository.create({
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const update = async (
    id: number,
    data: UpdateDepartmentPayload,
  ): Promise<Department> => {
    const existing = await baseRepository.findOne(id);

    if (data.code) {
      await validateUniqueCode(data.code, existing.tenantId, id);
    }

    return baseRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedDepartments> => {
    const { data, pagination } = await baseRepository.findAllPaginated(params);
    return {
      data,
      pagination,
    };
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
    validateUniqueCode,
    findByTenant,
    findByTenantPaginated,
  };
};

export const departmentRepository = createDepartmentRepository();
