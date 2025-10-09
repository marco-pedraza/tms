import { secret } from 'encore.dev/config';
import { hashPassword } from '@/shared/auth-utils';
import type {
  ChangePasswordPayload,
  SafeUser,
  UpdateUserPayload,
} from './users.types';
import { userRepository } from './users.repository';

const SALT_ROUNDS = parseInt(secret('SALT_ROUNDS')());

/**
 * Creates user use cases to handle user business logic
 * @returns Object containing user use cases
 */
export const createUserUseCases = () => {
  /**
   * Changes a user's password
   * @param id The ID of the user
   * @param data Password change payload
   * @returns Updated user (without password hash)
   */
  const changePassword = async (
    id: number,
    data: ChangePasswordPayload,
  ): Promise<SafeUser> => {
    // Hash new password and update
    const passwordHash = await hashPassword(data.newPassword, SALT_ROUNDS);
    return await userRepository.update(id, {
      passwordHash,
    } as UpdateUserPayload);
  };

  return {
    changePassword,
  };
};

export const userUseCases = createUserUseCases();
