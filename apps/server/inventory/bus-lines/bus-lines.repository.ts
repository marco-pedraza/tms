import { busLines } from './bus-lines.schema';
import type {
  BusLine,
  CreateBusLinePayload,
  UpdateBusLinePayload,
  PaginatedBusLines,
} from './bus-lines.types';
import { createBaseRepository } from '../../shared/base-repository';
import { PaginationParams } from '../../shared/types';
import { transporterRepository } from '../transporters/transporters.repository';
import { serviceTypeRepository } from '../service-types/service-types.repository';

const DUPLICATE_ERROR_MESSAGE = 'Bus line with this code already exists';

export const createBusLineRepository = () => {
  const baseRepository = createBaseRepository<
    BusLine,
    CreateBusLinePayload,
    UpdateBusLinePayload,
    typeof busLines
  >(busLines, 'Bus Line');

  const validateUniqueCode = async (code: string, excludeId?: number) => {
    await baseRepository.validateUniqueness(
      [
        {
          field: busLines.code,
          value: code,
        },
      ],
      excludeId,
      DUPLICATE_ERROR_MESSAGE,
    );
  };

  const validateTransporter = async (transporterId: number): Promise<void> => {
    await transporterRepository.findOne(transporterId);
  };

  const validateServiceType = async (serviceTypeId: number): Promise<void> => {
    await serviceTypeRepository.findOne(serviceTypeId);
  };

  const create = async (data: CreateBusLinePayload): Promise<BusLine> => {
    await validateUniqueCode(data.code);
    await validateTransporter(data.transporterId);
    await validateServiceType(data.serviceTypeId);

    return baseRepository.create({
      ...data,
      active: data.active,
    });
  };

  const update = async (
    id: number,
    data: UpdateBusLinePayload,
  ): Promise<BusLine> => {
    const existing = await baseRepository.findOne(id);

    if (data.code && data.code !== existing.code) {
      await validateUniqueCode(data.code, id);
    }

    if (data.transporterId) {
      await validateTransporter(data.transporterId);
    }

    if (data.serviceTypeId) {
      await validateServiceType(data.serviceTypeId);
    }

    return baseRepository.update(id, data);
  };

  const findOne = async (id: number): Promise<BusLine> => {
    return baseRepository.findOne(id);
  };

  const findAll = async (): Promise<BusLine[]> => {
    return baseRepository.findAll();
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedBusLines> => {
    return baseRepository.findAllPaginated(params);
  };

  return {
    ...baseRepository,
    create,
    update,
    findOne,
    findAll,
    findAllPaginated,
    validateUniqueCode,
    validateTransporter,
    validateServiceType,
  };
};

export const busLineRepository = createBusLineRepository();
