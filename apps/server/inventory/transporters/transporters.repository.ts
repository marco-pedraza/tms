import { transporters } from './transporters.schema';
import type {
  Transporter,
  CreateTransporterPayload,
  UpdateTransporterPayload,
  PaginatedTransporters,
} from './transporters.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

export const createTransporterRepository = () => {
  const baseRepository = createBaseRepository<
    Transporter,
    CreateTransporterPayload,
    UpdateTransporterPayload,
    typeof transporters
  >(db, transporters, 'Transporter');

  const create = async (
    data: CreateTransporterPayload,
  ): Promise<Transporter> => {
    return baseRepository.create(data);
  };

  const update = async (
    id: number,
    data: UpdateTransporterPayload,
  ): Promise<Transporter> => {
    return baseRepository.update(id, data);
  };

  const findOne = async (id: number): Promise<Transporter> => {
    return baseRepository.findOne(id);
  };

  const findAll = async (): Promise<Transporter[]> => {
    return baseRepository.findAll();
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedTransporters> => {
    return baseRepository.findAllPaginated(params);
  };

  const delete_ = async (id: number): Promise<Transporter> => {
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
