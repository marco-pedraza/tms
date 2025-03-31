import { transporters } from './transporters.schema';
import type {
  Transporter,
  CreateTransporterPayload,
  UpdateTransporterPayload,
  PaginatedTransporters,
} from './transporters.types';
import { createBaseRepository } from '../../shared/base-repository';
import { PaginationParams } from '../../shared/types';

const DUPLICATE_ERROR_MESSAGE =
  'Transporter with this name or code already exists';

export const createTransporterRepository = () => {
  const baseRepository = createBaseRepository<
    Transporter,
    CreateTransporterPayload,
    UpdateTransporterPayload,
    typeof transporters
  >(transporters, 'Transporter');

  const validateUniqueFields = async (
    name: string,
    code: string,
    excludeId?: number,
  ) => {
    await baseRepository.validateUniqueness(
      [
        {
          field: transporters.name,
          value: name,
        },
        {
          field: transporters.code,
          value: code,
        },
      ],
      excludeId,
      DUPLICATE_ERROR_MESSAGE,
    );
  };

  const create = async (
    data: CreateTransporterPayload,
  ): Promise<Transporter> => {
    await validateUniqueFields(data.name, data.code);

    return baseRepository.create(data);
  };

  const update = async (
    id: number,
    data: UpdateTransporterPayload,
  ): Promise<Transporter> => {
    const existing = await baseRepository.findOne(id);

    if (
      (data.name && data.name !== existing.name) ||
      (data.code && data.code !== existing.code)
    ) {
      await validateUniqueFields(
        data.name || existing.name,
        data.code || existing.code,
        id,
      );
    }

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
    validateUniqueFields,
    delete: delete_,
  };
};

export const transporterRepository = createTransporterRepository();
