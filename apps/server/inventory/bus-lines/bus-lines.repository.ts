import { busLines } from './bus-lines.schema';
import type {
  BusLine,
  CreateBusLinePayload,
  UpdateBusLinePayload,
  PaginatedBusLines,
} from './bus-lines.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '../db-service';

export const createBusLineRepository = () => {
  const baseRepository = createBaseRepository<
    BusLine,
    CreateBusLinePayload,
    UpdateBusLinePayload,
    typeof busLines
  >(db, busLines, 'Bus Line');

  const create = async (data: CreateBusLinePayload): Promise<BusLine> => {
    const result = await baseRepository.create({
      ...data,
      active: data.active,
    });
    return result;
  };

  const update = async (
    id: number,
    data: UpdateBusLinePayload,
  ): Promise<BusLine> => {
    const result = await baseRepository.update(id, data);
    return result;
  };

  const findOne = async (id: number): Promise<BusLine> => {
    const result = await baseRepository.findOne(id);
    return result;
  };

  const findAll = async (): Promise<BusLine[]> => {
    const result = await baseRepository.findAll();
    return result;
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedBusLines> => {
    const result = await baseRepository.findAllPaginated(params);
    return result;
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
