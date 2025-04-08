import { busLines } from './bus-lines.schema';
import type {
  BusLine,
  CreateBusLinePayload,
  UpdateBusLinePayload,
  PaginatedBusLines,
} from './bus-lines.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

export const createBusLineRepository = () => {
  const baseRepository = createBaseRepository<
    BusLine,
    CreateBusLinePayload,
    UpdateBusLinePayload,
    typeof busLines
  >(db, busLines, 'Bus Line');

  const create = async (data: CreateBusLinePayload): Promise<BusLine> => {
    return baseRepository.create({
      ...data,
      active: data.active,
    });
  };

  const update = async (
    id: number,
    data: UpdateBusLinePayload,
  ): Promise<BusLine> => {
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
  };
};

export const busLineRepository = createBusLineRepository();
