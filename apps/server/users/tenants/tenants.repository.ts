import { tenants } from './tenants.schema';
import type {
  Tenant,
  CreateTenantPayload,
  UpdateTenantPayload,
  PaginatedTenants,
} from './tenants.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

export const createTenantRepository = () => {
  const baseRepository = createBaseRepository<
    Tenant,
    CreateTenantPayload,
    UpdateTenantPayload,
    typeof tenants
  >(db, tenants, 'Tenant');

  const create = async (data: CreateTenantPayload): Promise<Tenant> => {
    return await baseRepository.create(data);
  };

  const update = async (
    id: number,
    data: UpdateTenantPayload,
  ): Promise<Tenant> => {
    return await baseRepository.update(id, data);
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
    findAllPaginated,
  };
};

export const tenantRepository = createTenantRepository();
