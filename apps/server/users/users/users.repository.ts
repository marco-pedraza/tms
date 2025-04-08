import { users } from './users.schema';
import type {
  User,
  SafeUser,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedUsers,
  Users,
} from './users.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { hashPassword, omitPasswordHash } from '../../shared/auth-utils';
import { db } from '@/db';
import { secret } from 'encore.dev/config';

// Get salt rounds from Encore secret
const SALT_ROUNDS = parseInt(secret('SALT_ROUNDS')());

export const createUserRepository = () => {
  const baseRepository = createBaseRepository<
    User,
    CreateUserPayload & {
      passwordHash: string;
      isActive?: boolean;
      isSystemAdmin: boolean;
    },
    UpdateUserPayload & { updatedAt: Date },
    typeof users
  >(db, users, 'User');

  const create = async (data: CreateUserPayload): Promise<SafeUser> => {
    const user = await baseRepository.create({
      ...data,
      passwordHash: await hashPassword(data.password, SALT_ROUNDS),
      isSystemAdmin: data.isSystemAdmin ?? false,
      isActive: data.isActive ?? true,
    });

    return omitPasswordHash(user);
  };

  const update = async (
    id: number,
    data: UpdateUserPayload,
  ): Promise<SafeUser> => {
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
    delete: delete_,
  };
};

export const userRepository = createUserRepository();
