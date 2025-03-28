import { tenants } from './tenants.schema';
import type {
  Tenant,
  CreateTenantPayload,
  UpdateTenantPayload,
  PaginatedTenants,
} from './tenants.types';
import { createBaseRepository } from '../../shared/base-repository';
import { PaginationParams } from '../../shared/types';

export const createTenantRepository = () => {
  const baseRepository = createBaseRepository<
    Tenant,
    CreateTenantPayload & {
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    UpdateTenantPayload & { updatedAt: Date },
    typeof tenants
  >(tenants, 'Tenant');

  const validateUniqueCode = async (code: string, excludeId?: number) => {
    await baseRepository.validateUniqueness(
      [{ field: tenants.code, value: code }],
      excludeId,
      `Tenant with code ${code} already exists`,
    );
  };

  const create = async (data: CreateTenantPayload): Promise<Tenant> => {
    await validateUniqueCode(data.code);
    return baseRepository.create(data);
  };

  const update = async (
    id: number,
    data: UpdateTenantPayload,
  ): Promise<Tenant> => {
    if (data.code) {
      await validateUniqueCode(data.code, id);
    }

    return baseRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedTenants> => {
    const { data, pagination } = await baseRepository.findAllPaginated(params);
    return {
      data,
      pagination,
    };
  };

  return {
    ...baseRepository,
    create,
    update,
    validateUniqueCode,
    findAllPaginated,
  };
};

export const tenantRepository = createTenantRepository();
