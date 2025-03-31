import { users } from './users.schema';
import type {
  User,
  SafeUser,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedUsers,
  Users,
} from './users.types';
import { createBaseRepository } from '../../shared/base-repository';
import { PaginationParams } from '../../shared/types';
import { hashPassword, omitPasswordHash } from '../../shared/auth-utils';

const DUPLICATE_ERROR_MESSAGE =
  'User with this username or email already exists';

export const createUserRepository = () => {
  const baseRepository = createBaseRepository<
    User,
    CreateUserPayload & {
      passwordHash: string;
      isActive: boolean;
      isSystemAdmin: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    UpdateUserPayload & { updatedAt: Date },
    typeof users
  >(users, 'User');

  const validateUniqueFields = async (
    username: string,
    email: string,
    excludeId?: number,
  ) => {
    await baseRepository.validateUniqueness(
      [
        {
          field: users.username,
          value: username,
        },
        {
          field: users.email,
          value: email,
        },
      ],
      excludeId,
      DUPLICATE_ERROR_MESSAGE,
    );
  };

  const create = async (data: CreateUserPayload): Promise<SafeUser> => {
    await validateUniqueFields(data.username, data.email);

    const user = await baseRepository.create({
      ...data,
      passwordHash: await hashPassword(data.password),
      isSystemAdmin: data.isSystemAdmin ?? false,
    });

    return omitPasswordHash(user);
  };

  const update = async (
    id: number,
    data: UpdateUserPayload,
  ): Promise<SafeUser> => {
    const existing = await baseRepository.findOne(id);

    if (data.email && data.email !== existing.email) {
      await validateUniqueFields(existing.username, data.email, id);
    }

    const user = await baseRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    return omitPasswordHash(user);
  };

  const findOne = async (id: number): Promise<SafeUser> => {
    const user = await baseRepository.findOne(id);
    return omitPasswordHash(user);
  };

  const findAll = async (): Promise<SafeUser[]> => {
    const users = await baseRepository.findAll();
    // TODO check if excluded fields can be added to base repository for db to handle this instead.
    return users.map(omitPasswordHash);
  };

  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedUsers> => {
    const { data, pagination } = await baseRepository.findAllPaginated(params);
    return {
      data: data.map(omitPasswordHash),
      pagination,
    };
  };

  const findByTenant = async (tenantId: number): Promise<Users> => {
    const result =
      (await baseRepository.findBy(users.tenantId, tenantId)) || [];
    const userList = Array.isArray(result) ? result : [result];
    return { users: userList.map(omitPasswordHash) };
  };

  const findByTenantPaginated = async (
    tenantId: number,
    params: PaginationParams = {},
  ): Promise<PaginatedUsers> => {
    const result = await baseRepository.findByPaginated(
      users.tenantId,
      tenantId,
      params,
    );
    return {
      data: result.data.map(omitPasswordHash),
      pagination: result.pagination,
    };
  };

  const findByDepartment = async (departmentId: number): Promise<Users> => {
    const result =
      (await baseRepository.findBy(users.departmentId, departmentId)) || [];
    const userList = Array.isArray(result) ? result : [result];
    return { users: userList.map(omitPasswordHash) };
  };

  const findByDepartmentPaginated = async (
    departmentId: number,
    params: PaginationParams = {},
  ): Promise<PaginatedUsers> => {
    const result = await baseRepository.findByPaginated(
      users.departmentId,
      departmentId,
      params,
    );
    return {
      data: result.data.map(omitPasswordHash),
      pagination: result.pagination,
    };
  };

  const findByUsername = async (username: string): Promise<User | null> => {
    return baseRepository.findBy(users.username, username);
  };

  const findByEmail = async (email: string): Promise<User | null> => {
    return baseRepository.findBy(users.email, email);
  };

  const findOneWithPassword = async (id: number): Promise<User> => {
    return baseRepository.findOne(id);
  };

  const delete_ = async (id: number): Promise<SafeUser> => {
    const user = await baseRepository.delete(id);
    return omitPasswordHash(user);
  };

  return {
    ...baseRepository,
    create,
    update,
    findOne,
    findAll,
    findAllPaginated,
    findByTenant,
    findByTenantPaginated,
    findByDepartment,
    findByDepartmentPaginated,
    findByUsername,
    findByEmail,
    findOneWithPassword,
    validateUniqueFields,
    delete: delete_,
  };
};

export const userRepository = createUserRepository();
