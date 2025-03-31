import { serviceTypes } from './service-types.schema';
import type {
  ServiceType,
  CreateServiceTypePayload,
  UpdateServiceTypePayload,
  PaginatedServiceTypes,
} from './service-types.types';
import { createBaseRepository } from '../../shared/base-repository';
import { PaginationParams } from '../../shared/types';

const DUPLICATE_ERROR_MESSAGE = 'Service type with this name already exists';

export const createServiceTypeRepository = () => {
  const baseRepository = createBaseRepository<
    ServiceType,
    CreateServiceTypePayload,
    UpdateServiceTypePayload,
    typeof serviceTypes
  >(serviceTypes, 'Service Type');

  const validateUniqueName = async (name: string, excludeId?: number) => {
    await baseRepository.validateUniqueness(
      [
        {
          field: serviceTypes.name,
          value: name,
        },
      ],
      excludeId,
      DUPLICATE_ERROR_MESSAGE,
    );
  };

  const create = async (
    data: CreateServiceTypePayload,
  ): Promise<ServiceType> => {
    await validateUniqueName(data.name);

    return baseRepository.create({
      ...data,
      active: data.active,
    });
  };

  const update = async (
    id: number,
    data: UpdateServiceTypePayload,
  ): Promise<ServiceType> => {
    const existing = await baseRepository.findOne(id);

    if (data.name && data.name !== existing.name) {
      await validateUniqueName(data.name, id);
    }

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
    validateUniqueName,
  };
};

export const serviceTypeRepository = createServiceTypeRepository();
