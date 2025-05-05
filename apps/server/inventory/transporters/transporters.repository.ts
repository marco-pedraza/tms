import { transporters } from './transporters.schema';
import type {
  Transporter,
  CreateTransporterPayload,
  UpdateTransporterPayload,
  PaginatedTransporters,
} from './transporters.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '../db-service';

export const createTransporterRepository = () => {
  const baseRepository = createBaseRepository<
    Transporter,
    CreateTransporterPayload,
    UpdateTransporterPayload,
    typeof transporters
  >(db, transporters, 'Transporter');

  const create = (data: CreateTransporterPayload): Promise<Transporter> => {
    return baseRepository.create(data);
  };

  const update = (
    id: number,
    data: UpdateTransporterPayload,
  ): Promise<Transporter> => {
    return baseRepository.update(id, data);
  };

  const findOne = (id: number): Promise<Transporter> => {
    return baseRepository.findOne(id);
  };

  const findAll = (): Promise<Transporter[]> => {
    return baseRepository.findAll();
  };

  const findAllPaginated = (
    params: PaginationParams = {},
  ): Promise<PaginatedTransporters> => {
    return baseRepository.findAllPaginated(params);
  };

  const delete_ = (id: number): Promise<Transporter> => {
    return baseRepository.delete(id);
  };

  return {
    ...baseRepository,
    create,
    update,
    findOne,
    findAll,
    findAllPaginated,
    delete: delete_,
  };
};

export const transporterRepository = createTransporterRepository();
