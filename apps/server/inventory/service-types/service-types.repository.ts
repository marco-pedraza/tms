import { serviceTypes } from './service-types.schema';
import type {
  ServiceType,
  CreateServiceTypePayload,
  UpdateServiceTypePayload,
  PaginatedServiceTypes,
} from './service-types.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

export const createServiceTypeRepository = () => {
  const baseRepository = createBaseRepository<
    ServiceType,
    CreateServiceTypePayload,
    UpdateServiceTypePayload,
    typeof serviceTypes
  >(db, serviceTypes, 'Service Type');

  const create = async (
    data: CreateServiceTypePayload,
  ): Promise<ServiceType> => {
    return baseRepository.create({
      ...data,
      active: data.active,
    });
  };

  const update = async (
    id: number,
    data: UpdateServiceTypePayload,
  ): Promise<ServiceType> => {
    return baseRepository.update(id, data);
  };

  const findOne = async (id: number): Promise<ServiceType> => {
    return baseRepository.findOne(id);
  };

  const findAll = async (): Promise<ServiceType[]> => {
    return baseRepository.findAll({
      orderBy: [{ field: serviceTypes.name, direction: 'asc' }],
    });
  };

  const findAllActive = async (): Promise<ServiceType[]> => {
    return baseRepository.findAllBy(serviceTypes.active, true, {
      orderBy: [{ field: serviceTypes.name, direction: 'asc' }],
    });
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedServiceTypes> => {
    return baseRepository.findAllPaginated(params);
  };

  return {
    ...baseRepository,
    create,
    update,
    findOne,
    findAll,
    findAllActive,
    findAllPaginated,
  };
};

export const serviceTypeRepository = createServiceTypeRepository();
